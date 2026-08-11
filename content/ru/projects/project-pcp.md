---
title: "pfSense: Настройка Captive Portal для корпоративной и гостевой Wi-Fi сетей."
date: 2026-08-07
summary: "Pfsense, Captive Portal, Wifi."
---

## О проекте

Грамотная сегментация беспроводной сети — базовое требование сетевой безопасности. Нельзя допускать смешивания трафика сотрудников и гостей предприятия. Идеальное решение — создание изолированных VLAN с собственными правилами авторизации.

В качестве шлюза и контроллера доступа в моих проектах часто выступает **pfSense**. Его встроенный функционал **Captive Portal** позволяет гибко управлять доступом как для доменных пользователей, так и для временных посетителей.

---

## 1. Корпоративный SSID (VLAN + Доменная авторизация)

Для сотрудников создается отдельная сеть (например, `VLAN 10`), которая имеет доступ к внутренним ресурсам компании. Чтобы избежать утечки паролей от Wi-Fi (WPA2-PSK), авторизация настраивается индивидуально для каждого сотрудника через Active Directory.

**Краткий алгоритм настройки:**
1. **Интеграция с AD:** В меню `System > User Manager > Authentication Servers` добавляется LDAP/RADIUS сервер (контроллер домена Windows Server).
2. **Настройка Captive Portal:** В разделе `Services > Captive Portal` создается зона (Zone) и привязывается к интерфейсу корпоративного VLAN.
3. **Метод аутентификации:** В настройках портала выбирается `Authentication Method: RADIUS Authentication` (или LDAP). 

Теперь при подключении к корпоративному Wi-Fi сотрудник будет перенаправлен на страницу авторизации, где он введет свои стандартные доменные учетные данные. При увольнении сотрудника и блокировке его учетной записи в AD доступ к Wi-Fi отключается автоматически.

---

## 2. Гостевой SSID (VLAN + Система ваучеров)

Для клиентов и подрядчиков создается строго изолированная гостевая сеть (например, `VLAN 20`), имеющая доступ **только в интернет**. Чтобы ограничить время пребывания гостей в сети и вести учет подключений, используется система одноразовых ваучеров.

**Краткий алгоритм настройки:**
1. **Изоляция:** В `Firewall > Rules` для гостевого VLAN разрешается выход только в WAN, доступ к локальным подсетям блокируется (Block RFC1918).
2. **Активация ваучеров:** В настройках зоны Captive Portal (для гостевого VLAN) включается опция `Enable Vouchers`.
3. **Генерация:** Вкладка `Vouchers` позволяет создать "рулон" (Roll) кодов. Я генерирую список 6-значных кодов с лимитом времени, например, 24 часа с момента активации. 
4. **Выдача:** Файл с ваучерами (в формате CSV) распечатывается и передается на стойку регистрации (ресепшн).

---

## 🎨 Кастомизация страницы портала (Custom Portal Page)

Стандартная страница авторизации pfSense выглядит устаревшей. Для гостевой сети я разрабатываю кастомный дизайн с логотипом компании и скриптом перехвата ошибок. 

Вот пример чистого и современного HTML-кода для загрузки в pfSense (раздел `Portal page contents`):

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Гостевой Wi-Fi</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .login-box { background: #fff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 320px; text-align: center; }
        h2 { color: #333; margin-top: 0; margin-bottom: 25px; }
        .error-msg { color: #dc3545; font-weight: bold; margin-bottom: 15px; min-height: 20px; }
        input[type="text"] { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 16px; text-align: center; letter-spacing: 2px; }
        input[type="submit"] { width: 100%; padding: 14px; background-color: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
        input[type="submit"]:hover { background-color: #0056b3; }
        .help-text { font-size: 13px; color: #777; margin-top: 15px; }
    </style>
</head>
<body>
 
    <div class="login-box">
        
        <!-- Company Logo -->
        <img src="captiveportal-logo.png" alt="Логотип" style="max-width: 150px; height: auto; margin-bottom: 15px;">
 
        <h2>Гостевой доступ</h2>
        
        <!-- Error message placeholder -->
        <div class="error-msg" id="portal-error">$PORTAL_MESSAGE$</div>
 
        <script>
            // The script intercepts the pfSense system error, removes duplicates, and translates the text
            var errorDiv = document.getElementById('portal-error');
            var errorText = errorDiv.innerText.toLowerCase();
 
            if (errorText.includes('voucher invalid')) {
                errorDiv.innerText = 'Неверный или просроченный код ваучера.';
            } else if (errorText.trim() !== '') {
                errorDiv.innerText = 'Ошибка подключения. Проверьте код.';
            }
        </script>
 
        <!-- Mandatory pfSense form -->
        <form method="post" action="$PORTAL_ACTION$">
            
            <!-- Hidden field to redirect the user back to their originally requested URL -->
            <input name="redirurl" type="hidden" value="$PORTAL_REDIRURL$">
 
            <!-- Voucher input field (must be named auth_voucher) -->
            <input name="auth_voucher" type="text" placeholder="Код ваучера" required autocomplete="off">
 
            <!-- Submit button (must be name="accept") -->
            <input name="accept" type="submit" value="Подключиться">
            
        </form>
 
        <div class="help-text">Получите код ваучера на стойке регистрации (ресепшн).</div>
    </div>
 
</body>
</html>
```
---

## Выводы
Использование pfSense Captive Portal позволяет решить сразу несколько задач бизнеса. Корпоративная сеть становится безопаснее благодаря привязке к Active Directory — отпадает необходимость менять общий Wi-Fi пароль после увольнения сотрудников. Гостевая сеть, работающая по системе ваучеров, защищает компанию от неконтролируемого использования интернет-канала соседями или прохожими, а брендированная страница авторизации повышает престиж компании в глазах посетителей.