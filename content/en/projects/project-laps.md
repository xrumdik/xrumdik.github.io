---
title: "Windows LAPS: unique local administrator passwords"
date: 2026-11-09
summary: "Security, Windows LAPS, Active Directory."
---

## About the project

In most domains the local administrator has the same password on every computer: it was set in the system image and has not changed since. Learning it on one PC is enough for an attacker to reach all the others. Such a password is usually kept in a spreadsheet or in the administrator's head.

The goal was to give every computer its own password that changes on a schedule and is stored where access can be controlled. The built-in Windows LAPS was chosen for this: it is part of Windows 10/11 and Windows Server 2019 and later once the cumulative update of April 11, 2023 is installed, and needs no separate installation.

## Key benefits

**A unique password on every PC:** compromising one computer does not open the others. The attack in which the same password hash is reused across all machines stops working.

**Automatic rotation:** the password changes on a schedule (30 days in this project), and nobody has to remember or write it down. Length and complexity are set by policy.

**Rotation after use:** if someone has signed in to a PC as the local administrator, the password is considered known. After a set time LAPS changes it on its own and ends the local administrator's session. A user working under a domain account is not interrupted.

**Encrypted storage in Active Directory:** the password lives in the computer's attributes in AD rather than in a separate system. Encryption is available at domain functional level 2016 and higher.

**Access control:** only a dedicated group can read passwords (`LAPS-Readers` in this project); everyone else cannot see them. To see an encrypted password, two permissions are needed: reading the attribute and the right to decrypt.

**Built-in solution:** no agent, no license and no separate server. Everything is configured with Group Policy and the usual AD tools, and the password is shown on the LAPS tab in Active Directory Users and Computers.

**Renaming does not interfere:** if the administrator account name is not set, LAPS finds the built-in account by its SID (ending in -500), so renaming the administrator has no effect.

## What was needed

| Item | Value |
| --- | --- |
| Domain controller | Windows Server 2019 Standard |
| Solution | Built-in Windows LAPS |
| Updates | Cumulative update of 11.04.2023 or later on the controller and on all PCs |
| Clients | Windows 10/11 |
| Password encryption | Domain functional level 2016+, check with: `(Get-ADDomain).DomainMode` |
| OU structure | A top-level OU containing department OUs and computers; everything is configured on the top-level OU and inherited |

## Setup step by step

**Step 1. Extend the AD schema.** Done once, on the domain controller. The account must be a member of the Schema Admins group.

```powershell
Import-Module LAPS
Update-LapsADSchema -Verbose -Confirm:$false
```

**Step 2. Permissions on the OU.** Also done once, on the top-level OU. Permissions are inherited by all nested OUs. First, the right for computers to write their own password to AD, then the right for the support group to read passwords (without it only domain administrators can see them):

```powershell
Set-LapsADComputerSelfPermission -Identity "OU=Computers,DC=contoso,DC=local"
Set-LapsADReadPasswordPermission -Identity "OU=Computers,DC=contoso,DC=local" -AllowedPrincipals "CONTOSO\LAPS-Readers"
```

Replace the OU path and domain name with your own.

**Step 3. Group Policy.** Link the GPO to the top-level OU with computers. The settings are under Computer Configuration → Policies → Administrative Templates → System → LAPS:

| Setting | Value |
| --- | --- |
| Configure password backup directory | Enabled, with Active Directory selected. The default is Disabled, and LAPS does not work |
| Password Settings | Uppercase, lowercase, digits and special characters; length 15–20; age 30 days |
| Name of administrator account to manage | Not configured: the built-in administrator is found by SID |
| Enable password encryption | Enabled |
| Configure authorized password decryptors | `CONTOSO\LAPS-Readers`; if not configured, only domain administrators can decrypt |
| Post-authentication actions | Reset the password and log off the managed account, grace period 8–24 hours |
| Do not allow password expiration time longer than required by policy | Enabled |

The policy templates are already present on an updated Windows Server 2019. If a central store is used, copy `LAPS.admx` and `en-US\LAPS.adml` to the `PolicyDefinitions` folder in SYSVOL.

**Step 4. Apply and verify.** On a test computer, in PowerShell as administrator:

```powershell
gpupdate /force
Invoke-LapsPolicyProcessing
```

Without `Invoke-LapsPolicyProcessing` the password is written during background processing, about once an hour. The other computers pick up the policy on their own.

## How to confirm it works

A successful run is visible in three places:

- **Event log on the computer:** Applications and Services Logs → Microsoft → Windows → LAPS → Operational, event 10018 (the password was written to AD).
- **ADUC on the controller:** the computer's properties, LAPS tab, showing the account name, the password and its expiration time.
- **PowerShell on the controller:** `Get-LapsADPassword -Identity PC_NAME -AsPlainText`.

Two more commands are handy for daily work: `Reset-LapsPassword` on the computer changes the password immediately, and `Set-LapsADPasswordExpirationTime -Identity PC_NAME` on the controller forces a change at the next processing.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| The LAPS tab is there but empty | The computer has not sent its password yet | Run `Invoke-LapsPolicyProcessing` on the PC, then check the LAPS log |
| `Invoke-LapsPolicyProcessing` is not recognized | The PC lacks the update that includes Windows LAPS | Install the latest cumulative update |
| "Access denied" in the log | The computer has no write permission | Run `Set-LapsADComputerSelfPermission` on the right OU |
| The GPO is missing from `gpresult /r /scope computer` | The PC is in another OU, or inheritance is blocked on the department OU | Check `Get-GPInheritance`; if blocked, link the GPO to that OU too |
| The password is visible only in encrypted form | The account is not among the decryptors | Add it to the `LAPS-Readers` group |

If the cause cannot be found, `Get-LapsDiagnostics` on the computer collects an archive of logs.

## Summary

**What got harder:** extending the AD schema is irreversible, so it should be done deliberately and after testing in a lab. To write a new password, the computer must be able to reach a domain controller.

**Result:** every computer has its own local administrator password. It changes by itself, is stored encrypted in AD and is visible only to those who are allowed to see it. No new servers or separate licenses were needed.

**What changed in security:** before, one password opened every computer, and a leak from any machine put the whole domain at risk. Now a password obtained from one PC fits only that PC and expires over time. Compromising one machine does not let an attacker move to the others, and passwords are no longer kept in spreadsheets or system images. Access to them is limited to one group, and the password changes automatically after each use.
