---
title: "Автоматические обновления ОС Linux"
date: 2026-08-08
summary: "Linux, Debian, Ubuntu, AlmaLinux, Rocky Linux, Zabbix."
---

## О проекте

Обновления безопасности нужно ставить быстро, а вручную на парке серверов это превращается в рутину, которую откладывают. Задача состояла в том, чтобы обновления ставились сами, а администратор узнавал только о том, что действительно требует его участия: серверу нужна перезагрузка после обновления ядра или системных библиотек.

Схема одинакова для всех систем. Пакеты обновляет штатный механизм дистрибутива: `unattended-upgrades` на Debian и Ubuntu, `dnf-automatic` на RHEL-совместимых системах (Rocky Linux, AlmaLinux). Службы после обновления перезапускает `needrestart`. Нужна ли перезагрузка, проверяет небольшой скрипт по таймеру systemd, а результат забирает Zabbix и поднимает триггер.

Перезагрузку можно оставить администратору или поручить системе. Выбор зависит от роли сервера, подробнее об этом в разделе «Перезагрузка: автоматически или вручную».

## Debian и Ubuntu

**Установка.** На Ubuntu Server `unattended-upgrades` и `needrestart` обычно уже стоят, на Debian их нужно поставить:

```bash
apt install unattended-upgrades needrestart
dpkg-reconfigure -plow unattended-upgrades   # создаст 20auto-upgrades
```

Файл `/etc/apt/apt.conf.d/20auto-upgrades` включает ежедневное обновление списков пакетов и установку обновлений:

```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
```

**Свои настройки** лучше хранить в отдельном файле, чтобы их не перезаписало обновление пакета: `/etc/apt/apt.conf.d/52unattended-upgrades-local`.

```
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";   // перезагрузка вручную, см. ниже
```

По умолчанию ставятся только обновления безопасности. Чтобы ставить и обычные обновления стабильной ветки, в тот же файл добавляется одна строка: на Ubuntu `Unattended-Upgrade::Allowed-Origins:: "${distro_id}:${distro_codename}-updates";`, на Debian `Unattended-Upgrade::Origins-Pattern:: "origin=Debian,codename=${distro_codename}-updates";`.

**Время запуска** меняется через `systemctl edit apt-daily-upgrade.timer`:

```ini
[Timer]
OnCalendar=
OnCalendar=*-*-* 04:00
RandomizedDelaySec=30m
```

**Проверка:** `unattended-upgrade --dry-run --debug`.

## needrestart

После обновления библиотек часть служб продолжает работать со старой версией в памяти. Утилита `needrestart` находит такие службы и перезапускает их, а ещё определяет, что запущено старое ядро. Чтобы она не задавала вопросов при автоматическом запуске, создаётся файл `/etc/needrestart/conf.d/auto.conf`:

```perl
$nrconf{restart} = 'a';   # сам перезапускает службы; 'l' — только выводит список
```

Режим `'a'` удобен, но службы после обновления будут кратко перезапускаться сами. Если это нежелательно, режим `'l'` только показывает, что нужно перезапустить.

На RHEL-совместимых системах аналог входит в `dnf-plugins-core`: команда `dnf needs-restarting`.

## Rocky Linux и AlmaLinux

```bash
dnf install dnf-automatic dnf-plugins-core
```

Файл `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security        # или default (все обновления)
random_sleep = 0
download_updates = yes
apply_updates = yes
reboot = never                 # перезагрузка вручную, см. ниже

[emitters]
emit_via = stdio
```

Включение таймера:

```bash
systemctl enable --now dnf-automatic.timer
# время: systemctl edit dnf-automatic.timer, затем OnCalendar=*-*-* 04:00
```

## Проверка необходимости перезагрузки

Скрипт `/usr/local/sbin/reboot-notify` (права 0755) определяет, нужна ли перезагрузка, и записывает результат в два файла: `status` (0 или 1) и `reason` (причина). Для Debian и Ubuntu он использует `needrestart` и файл `/run/reboot-required`, для RHEL-совместимых систем `dnf needs-restarting -r`.

```bash
#!/usr/bin/env bash
set -u
STATE=/var/lib/reboot-notify
mkdir -p -m 0755 "$STATE"
NEED=0; REASON=""

if [ -f /etc/redhat-release ]; then
    # Rocky/Alma: учитывает kernel, glibc, systemd, openssl и т.д.
    out=$(dnf -q needs-restarting -r 2>&1); rc=$?
    if [ "$rc" -eq 1 ]; then
        NEED=1
        REASON=$(printf '%s\n' "$out" | grep '\*' | sed 's/.*\* //' | paste -sd, -)
    fi
else
    # Debian/Ubuntu
    nr=$(needrestart -b -k 2>/dev/null)
    ksta=$(printf '%s\n' "$nr" | awk -F': ' '/NEEDRESTART-KSTA/{print $2}')
    kexp=$(printf '%s\n' "$nr" | awk -F': ' '/NEEDRESTART-KEXP/{print $2}')
    if [ "${ksta:-0}" -ge 2 ]; then
        NEED=1; REASON="kernel $(uname -r) -> ${kexp}"
    fi
    if [ -f /run/reboot-required ]; then
        NEED=1
        pk=$(paste -sd, /run/reboot-required.pkgs 2>/dev/null)
        REASON="${REASON:+$REASON; }${pk:-reboot-required}"
    fi
fi

# Статус для Zabbix (без перевода строки)
printf '%s' "$NEED"   > "$STATE/status.tmp" && mv -f "$STATE/status.tmp" "$STATE/status"
printf '%s' "$REASON" > "$STATE/reason.tmp" && mv -f "$STATE/reason.tmp" "$STATE/reason"
```

Запускается скрипт по таймеру systemd. Файл `/etc/systemd/system/reboot-notify.service`:

```ini
[Unit]
Description=Check if reboot is required

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/reboot-notify
```

Файл `/etc/systemd/system/reboot-notify.timer`:

```ini
[Unit]
Description=Periodic reboot-required check

[Timer]
OnBootSec=2min
OnUnitActiveSec=1h

[Install]
WantedBy=timers.target
```

```bash
systemctl daemon-reload
systemctl enable --now reboot-notify.timer
```

Через две минуты после загрузки сервера проверка срабатывает снова, поэтому после перезагрузки статус сбрасывается в 0 сам.

Чтобы проверка шла сразу после установки обновлений, можно добавить дополнение к службе обновления: `systemctl edit apt-daily-upgrade.service` на Debian и Ubuntu или `systemctl edit dnf-automatic.service` на RHEL-совместимых системах:

```ini
[Service]
ExecStartPost=-/usr/local/sbin/reboot-notify
```

## Уведомление в Zabbix

Zabbix-агент читает файл статуса, права `sudo` для этого не нужны. В шаблоне (например, «Linux reboot required») создаются два элемента данных и триггер:

| Что | Значение |
| --- | --- |
| Элемент 1 | Zabbix agent, ключ `vfs.file.contents[/var/lib/reboot-notify/status]`, тип Numeric (unsigned), интервал 10m |
| Элемент 2 | Ключ `vfs.file.contents[/var/lib/reboot-notify/reason]`, тип Text, интервал 10m |
| Триггер | `last(/Linux reboot required/vfs.file.contents[/var/lib/reboot-notify/status])=1` |
| Имя триггера | `{HOST.NAME}: требуется перезагрузка` |
| Важность | Warning |

Триггер сам закрывается после перезагрузки, когда статус снова становится 0. Причину (например, новое ядро или обновлённый пакет) можно показать в тексте оповещения через макрос с последним значением второго элемента.

## Перезагрузка: автоматически или вручную

Обновление ядра и системных библиотек вступает в силу только после перезагрузки. Здесь есть два варианта, и выбор зависит от роли сервера.

**Вручную.** Так настроено выше: обновления ставятся, а перезагрузкой занимается администратор. Когда в Zabbix появляется триггер, сервер перезагружают в удобное окно обслуживания обычной командой `systemctl reboot`, предупредив пользователей и проверив, что службы поднялись.

**Автоматически.** Система сама перезагружается после обновления в заданное время.

На Debian и Ubuntu это включается в том же файле `52unattended-upgrades-local`. Перезагрузка происходит, только если она действительно нужна:

```
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:30";
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";   // не перезагружать, пока в системе есть вошедшие пользователи
```

На Rocky Linux и AlmaLinux 9 и новее в `/etc/dnf/automatic.conf`:

```ini
[commands]
reboot = when-needed
reboot_command = "shutdown -r +5 'Rebooting after applying package updates'"
```

Триггер в Zabbix полезен в обоих случаях: при ручной перезагрузке он напоминает о задаче, а при автоматической показывает, что перезагрузка не состоялась.

**Как выбрать:**

| Подходит автоматическая перезагрузка | Лучше вручную |
| --- | --- |
| Серверы в кластере или за балансировщиком, где остановка одного узла не заметна | Базы данных, файловые серверы, одиночные серверы без резерва |
| Тестовые и типовые серверы, которые легко поднять заново | Серверы, после загрузки которых нужно вводить пароль, например от зашифрованного диска |
| Ночью сервером никто не пользуется, перезагрузка на несколько минут незаметна | Сервер нужен круглосуточно или время простоя согласуется с пользователями |

На практике часто совмещают оба подхода: на типовых и резервируемых серверах включают автоматическую перезагрузку, а на критичных оставляют ручную и следят за триггером.

## Итог

**Что стало сложнее:** автоматические обновления могут сломать работу службы, поэтому для критичных серверов стоит оставить только обновления безопасности и сначала проверять изменения на тестовой машине. Ручная перезагрузка требует внимания администратора, зато он узнаёт о ней из мониторинга, а не по сообщению пользователей.

**Результат:** обновления безопасности ставятся каждую ночь без участия администратора, службы после них перезапускаются сами, а в Zabbix появляется триггер, как только серверу действительно нужна перезагрузка. Решение работает на Debian, Ubuntu, Rocky Linux и AlmaLinux одним и тем же скриптом и не требует ничего, кроме штатных средств дистрибутивов.
