---
title: "Automatic updates for Linux"
date: 2026-08-01
summary: "Linux, Debian, Ubuntu, AlmaLinux, Rocky Linux, Zabbix."
---

## About the project

Security updates need to be installed quickly, but doing it by hand across a fleet of servers turns into a chore that gets postponed. The goal was for updates to install themselves, so that the administrator only hears about what really needs their attention: a server that needs a reboot after a kernel or system library update.

The scheme is the same for all systems. Packages are updated by the distribution's own mechanism: `unattended-upgrades` on Debian and Ubuntu, `dnf-automatic` on RHEL-compatible systems (Rocky Linux, AlmaLinux). `needrestart` restarts services after an update. A small script run by a systemd timer checks whether a reboot is needed, and Zabbix picks up the result and raises a trigger.

The reboot itself can be left to the administrator or handed over to the system. The choice depends on the server's role; see the section "Reboot: automatic or manual".

## Debian and Ubuntu

**Installation.** On Ubuntu Server `unattended-upgrades` and `needrestart` are usually already installed; on Debian they must be added:

```bash
apt install unattended-upgrades needrestart
dpkg-reconfigure -plow unattended-upgrades   # creates 20auto-upgrades
```

The file `/etc/apt/apt.conf.d/20auto-upgrades` turns on the daily package list refresh and the installation of updates:

```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
```

**Custom settings** are best kept in a separate file so that a package update does not overwrite them: `/etc/apt/apt.conf.d/52unattended-upgrades-local`.

```
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";   // manual reboot, see below
```

By default only security updates are installed. To install regular updates of the stable branch as well, add one line to the same file: on Ubuntu `Unattended-Upgrade::Allowed-Origins:: "${distro_id}:${distro_codename}-updates";`, on Debian `Unattended-Upgrade::Origins-Pattern:: "origin=Debian,codename=${distro_codename}-updates";`.

**The run time** is changed with `systemctl edit apt-daily-upgrade.timer`:

```ini
[Timer]
OnCalendar=
OnCalendar=*-*-* 04:00
RandomizedDelaySec=30m
```

**Check:** `unattended-upgrade --dry-run --debug`.

## needrestart

After libraries are updated, some services keep running the old version in memory. The `needrestart` utility finds such services and restarts them, and it also detects that an old kernel is running. To keep it from asking questions during an automatic run, create `/etc/needrestart/conf.d/auto.conf`:

```perl
$nrconf{restart} = 'a';   # restarts services itself; 'l' only prints the list
```

Mode `'a'` is convenient, but services will briefly restart on their own after an update. If that is undesirable, mode `'l'` only shows what needs to be restarted.

On RHEL-compatible systems the equivalent is part of `dnf-plugins-core`: the `dnf needs-restarting` command.

## Rocky Linux and AlmaLinux

```bash
dnf install dnf-automatic dnf-plugins-core
```

The file `/etc/dnf/automatic.conf`:

```ini
[commands]
upgrade_type = security        # or default (all updates)
random_sleep = 0
download_updates = yes
apply_updates = yes
reboot = never                 # manual reboot, see below

[emitters]
emit_via = stdio
```

Enabling the timer:

```bash
systemctl enable --now dnf-automatic.timer
# run time: systemctl edit dnf-automatic.timer, then OnCalendar=*-*-* 04:00
```

## Checking whether a reboot is needed

The script `/usr/local/sbin/reboot-notify` (mode 0755) determines whether a reboot is needed and writes the result to two files: `status` (0 or 1) and `reason`. On Debian and Ubuntu it uses `needrestart` and the `/run/reboot-required` file; on RHEL-compatible systems it uses `dnf needs-restarting -r`.

```bash
#!/usr/bin/env bash
set -u
STATE=/var/lib/reboot-notify
mkdir -p -m 0755 "$STATE"
NEED=0; REASON=""

if [ -f /etc/redhat-release ]; then
    # Rocky/Alma: covers kernel, glibc, systemd, openssl, etc.
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

# Status for Zabbix (no trailing newline)
printf '%s' "$NEED"   > "$STATE/status.tmp" && mv -f "$STATE/status.tmp" "$STATE/status"
printf '%s' "$REASON" > "$STATE/reason.tmp" && mv -f "$STATE/reason.tmp" "$STATE/reason"
```

The script is run by a systemd timer. The file `/etc/systemd/system/reboot-notify.service`:

```ini
[Unit]
Description=Check if reboot is required

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/reboot-notify
```

The file `/etc/systemd/system/reboot-notify.timer`:

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

The check runs again two minutes after the server boots, so after a reboot the status resets to 0 by itself.

To run the check right after updates are installed, add a drop-in to the update service: `systemctl edit apt-daily-upgrade.service` on Debian and Ubuntu, or `systemctl edit dnf-automatic.service` on RHEL-compatible systems:

```ini
[Service]
ExecStartPost=-/usr/local/sbin/reboot-notify
```

## Notification in Zabbix

The Zabbix agent reads the status file, and no `sudo` rights are needed for that. In a template (for example, "Linux reboot required") create two items and a trigger:

| Item | Value |
| --- | --- |
| Item 1 | Zabbix agent, key `vfs.file.contents[/var/lib/reboot-notify/status]`, type Numeric (unsigned), interval 10m |
| Item 2 | Key `vfs.file.contents[/var/lib/reboot-notify/reason]`, type Text, interval 10m |
| Trigger | `last(/Linux reboot required/vfs.file.contents[/var/lib/reboot-notify/status])=1` |
| Trigger name | `{HOST.NAME}: reboot required` |
| Severity | Warning |

The trigger closes by itself after a reboot, when the status becomes 0 again. The reason (for example, a new kernel or an updated package) can be shown in the alert text through a macro with the last value of the second item.

## Reboot: automatic or manual

Kernel and system library updates take effect only after a reboot. There are two options, and the choice depends on the server's role.

**Manual.** This is how it is set up above: updates are installed, and the administrator takes care of the reboot. When the trigger appears in Zabbix, the server is rebooted in a convenient maintenance window with a plain `systemctl reboot`, after warning users and then checking that the services are back up.

**Automatic.** The system reboots itself after an update at a set time.

On Debian and Ubuntu this is enabled in the same `52unattended-upgrades-local` file. The reboot happens only if it is actually needed:

```
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:30";
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";   // do not reboot while users are logged in
```

On Rocky Linux and AlmaLinux 9 and newer, in `/etc/dnf/automatic.conf`:

```ini
[commands]
reboot = when-needed
reboot_command = "shutdown -r +5 'Rebooting after applying package updates'"
```

The Zabbix trigger is useful in both cases: with a manual reboot it reminds you of the task, and with an automatic one it shows that the reboot did not happen.

**How to choose:**

| Automatic reboot fits | Manual is better |
| --- | --- |
| Servers in a cluster or behind a load balancer, where stopping one node goes unnoticed | Databases, file servers, single servers without a standby |
| Test and standard servers that are easy to rebuild | Servers that need a password after boot, for example for an encrypted disk |
| Nobody uses the server at night, and a reboot of a few minutes is unnoticeable | The server is needed around the clock, or downtime has to be agreed with users |

In practice the two approaches are often combined: automatic reboot on standard and redundant servers, manual on critical ones, with the trigger watched.

## Summary

**What got harder:** automatic updates can break a service, so on critical servers it is better to keep only security updates and to test changes on a lab machine first. A manual reboot takes the administrator's attention, but they learn about it from monitoring rather than from users' messages.

**Result:** security updates are installed every night without the administrator's involvement, services are restarted after them automatically, and Zabbix raises a trigger as soon as a server really needs a reboot. The solution works on Debian, Ubuntu, Rocky Linux and AlmaLinux with the same script and needs nothing beyond the distributions' standard tools.
