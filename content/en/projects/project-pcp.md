---
title: "pfSense: Configuring Captive Portal for Corporate and Guest Wi-Fi Networks."
date: 2026-08-07
summary: "Pfsense, Captive Portal, Wifi."
---

## About the project

# pfSense: Configuring Captive Portal for Corporate and Guest Wi-Fi Networks

Proper wireless network segmentation is a fundamental requirement for network security. Mixing employee and guest traffic is an unacceptable risk. The ideal solution is creating strictly isolated VLANs with their own dedicated authorization rules.

In my projects, I frequently use **pfSense** as the gateway and access controller. Its built-in **Captive Portal** functionality provides highly flexible access management for both domain users and temporary visitors.

---

## 1. Corporate SSID (VLAN + Domain Authentication)

A dedicated network (e.g., `VLAN 10`) is created for employees, granting them access to internal corporate resources. To eliminate the risk of shared Wi-Fi passwords (WPA2-PSK) leaking, authorization is configured individually for each employee via Active Directory.

**Configuration Overview:**
1. **AD Integration:** Navigate to `System > User Manager > Authentication Servers` and add your LDAP/RADIUS server (Windows Server Domain Controller).
2. **Captive Portal Setup:** In `Services > Captive Portal`, create a new Zone and bind it to the corporate VLAN interface.
3. **Authentication Method:** Set the portal to use `RADIUS Authentication` (or LDAP).

Now, when connecting to the corporate Wi-Fi, employees are redirected to a login page where they enter their standard domain credentials. If an employee leaves the company and their AD account is disabled, their Wi-Fi access is revoked automatically.

---

## 2. Guest SSID (VLAN + Voucher System)

For clients and contractors, a strictly isolated guest network is deployed (e.g., `VLAN 20`) with access **only to the Internet**. To limit connection time and keep an audit log of guest access, a one-time voucher system is utilized.

**Configuration Overview:**
1. **Isolation:** In `Firewall > Rules` for the guest VLAN, only outbound WAN traffic is allowed, while access to local subnets is explicitly blocked (Block RFC1918).
2. **Enabling Vouchers:** Within the Captive Portal zone settings for the guest VLAN, check the `Enable Vouchers` option.
3. **Generation:** Go to the `Vouchers` tab to create a new Roll. I typically generate 6-digit codes with a specific time limit, such as 24 hours from activation.
4. **Distribution:** The voucher list is exported as a CSV file, printed, and handed over to the front desk (reception) for distribution to visitors.

---

## 🎨 Custom Portal Page Customization

The default pfSense login page looks outdated. For the guest network, I design a custom, responsive HTML page featuring the company logo and an error-handling script.

Here is an example of a clean, modern HTML template ready to be uploaded to pfSense (`Portal page contents` section):

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Guest Wi-Fi</title>
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
        <img src="captiveportal-logo.png" alt="Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;">
 
        <h2>Guest Access</h2>
        
        <!-- Error message placeholder -->
        <div class="error-msg" id="portal-error">$PORTAL_MESSAGE$</div>
 
        <script>
            // The script intercepts the pfSense system error, removes duplicates, and translates the text
            var errorDiv = document.getElementById('portal-error');
            var errorText = errorDiv.innerText.toLowerCase();
 
            if (errorText.includes('voucher invalid')) {
                errorDiv.innerText = 'Invalid or expired voucher code.';
            } else if (errorText.trim() !== '') {
                errorDiv.innerText = 'Connection error. Please check your code.';
            }
        </script>
 
        <!-- Mandatory pfSense form -->
        <form method="post" action="$PORTAL_ACTION$">
            
            <!-- Hidden field to redirect the user back to their originally requested URL -->
            <input name="redirurl" type="hidden" value="$PORTAL_REDIRURL$">
 
            <!-- Voucher input field (must be named auth_voucher) -->
            <input name="auth_voucher" type="text" placeholder="Voucher Code" required autocomplete="off">
 
            <!-- Submit button (must be name="accept") -->
            <input name="accept" type="submit" value="Connect">
            
        </form>
 
        <div class="help-text">Please request a voucher code at the reception desk.</div>
    </div>
 
</body>
</html>
```
## Conclusion
Deploying a pfSense Captive Portal solves multiple business challenges at once. The corporate network becomes significantly more secure through Active Directory binding, eliminating the nightmare of changing a shared Wi-Fi password every time an employee departs. Simultaneously, the voucher-based guest network protects the company's bandwidth from unauthorized use by neighbors or passersby, while a beautifully branded login page enhances the company's professional image.