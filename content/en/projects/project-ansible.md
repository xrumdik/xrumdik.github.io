---
title: "Administration with Ansible"
date: 2026-11-13
summary: "Ansible, automation, Linux, Windows Server."
---

## About the project

Once there are more than a dozen servers, updating them by hand takes a long time, and above all there is no certainty that the same thing was done on each one. Fully automatic updates are not always suitable: on important servers you want to see first what exactly will be installed and decide yourself when to reboot.

The goal was to update Linux and Windows servers in one way: with a preview, a clear report and a reboot only where it is needed. Ansible was chosen for this.

## Key features of Ansible

**Open source:** Ansible is free, distributed under the GPL license, installed from the packages of an ordinary distribution and needs no licenses or subscriptions.

**Agentless:** nothing has to be installed on the managed servers. Ansible connects to Linux over SSH and to Windows over WinRM.

**Plain-text playbooks:** actions are described in files (playbooks) in a readable language that reads like instructions and is kept in Git. One playbook can handle dozens of servers.

**Server groups:** servers are collected into groups (Debian, RHEL, Windows, domain controllers). A playbook can be run on a group, on one server, or on a group except a few servers, after first checking whom it will affect.

**Password vault:** the built-in Ansible Vault encrypts passwords, so they are never stored in plain text.

**Repeatability:** a playbook can be run again and again with the same result. It does nothing extra.

## Example 1: updating Linux

Linux uses three separate playbooks that are run in turn:

1. **Check.** It installs nothing and only shows which packages will be updated, counting them per server. For each package, the old and the new version are visible.
2. **Install.** The list of packages is saved before and after the update, so the report shows what was updated, what was newly installed and what was removed. The server is not rebooted; it only reports whether a reboot is needed and why (for example, the kernel was updated).
3. **Reboot.** Only the servers that need it are rebooted, one at a time. Confirmation is requested before each one. If a server does not come back up, the others are left alone. After boot, you can check that the required services are running and see the kernel version before and after.

The connection is set up securely: Ansible signs in over SSH with a key, under an ordinary account without administrator rights, and gets administrator rights through `su`. The passwords are kept in Vault.

## Example 2: updating Windows Server

Windows follows the same scheme of three playbooks: check, install, reboot.

- **Check** finds critical updates, security updates and cumulative rollups. If the network has WSUS, updates are taken from it.
- **Install** produces a list of installed updates and errors. No reboot is performed, and whether one is needed is determined from indicators in the system itself.
- **Reboot** goes the same way as on Linux: only where required, one server at a time, with confirmation and a check of the services after startup.

Ansible connects to Windows through a service domain account. Domain controllers are handled separately: their administrator password is not stored anywhere and is entered manually at run time.

## What improved

**Predictability:** before installing, you can see exactly what will be updated, and afterwards there is a report for every server.

**One way for different systems:** Linux and Windows are updated by the same scheme, with the same steps and reports.

**Controlled reboot:** it is done only where needed, one server at a time and with confirmation, so a failure of one server does not bring down all the others.

**Security:** passwords are stored encrypted, servers do not need root login over SSH, and the domain controller administrator password is not saved at all.

**Less routine:** instead of going through servers one by one, one command for a group. The playbooks are kept in Git, so changes are visible and can be rolled back.

## Summary

**What got harder:** a separate control machine is needed, and protecting it is critical: whoever gains access to it gains access to all the servers, so access is restricted and the master password is also kept off that machine. The playbooks need maintenance, and for Windows, WinRM and the service account's permissions must be set up in advance.

**Result:** Linux and Windows servers are updated by a clear scheme on a free, open source solution: first a preview, then installation, then a reboot only where it is really required.
