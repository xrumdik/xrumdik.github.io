---
title: "Keycloak: single sign-on for web applications"
date: 2026-11-12
summary: "Keycloak, SSO, 2FA, Nextcloud, Mailcow."
---

## About the project

When a company has several web applications (cloud storage, email, monitoring), each one has its own accounts and its own passwords. Users get confused, and when an employee leaves, the administrator has to disable access in every service separately.

The goal was to have one login everywhere, managed from one place. Keycloak was chosen for this: a single sign-on system with **open source code** (Apache 2.0 license). It is free, runs on your own servers and does not tie the company to someone else's cloud.

## How it works

The application no longer checks the password itself. Instead, a "Sign in with Keycloak" button appears on its login page. Then everything goes like this:

1. The user clicks the button, and the application redirects them to the Keycloak login page.
2. Keycloak checks the username, the password and, if enabled, the second factor.
3. After a successful check, Keycloak sends the application a confirmation: "this person has passed the check, here are their name and email". They talk to each other over the standard OpenID Connect protocol through an API.
4. The application lets the user in. It never sees or stores the password.

If a user has already signed in to one application, they get into another one without entering the password again.

## Example: connecting Nextcloud

1. In Keycloak, a separate realm is created for the company and users are added.
2. A "client" is created for Nextcloud: a record that tells Keycloak this application can be trusted. It holds the Nextcloud address, and Keycloak issues a secret key.
3. The "OpenID Connect user backend" app is installed in Nextcloud. It is enough to enter the Keycloak address, the client name and the secret key there: Nextcloud picks up the remaining settings on its own.
4. A Keycloak button appears on the Nextcloud login page.

Users who already exist in Nextcloud are linked to the Keycloak login by matching usernames, and their files and settings are kept. It is best to keep the local administrator login as a fallback until everything has been verified.

## Example: connecting Mailcow

Mailcow has built-in Keycloak support: under System → Configuration → Access → Identity Provider, choose Keycloak and enter the address and the details of the client created in advance in Keycloak.

A peculiarity of Mailcow is that mailboxes are created automatically: on a user's first sign-in through Keycloak, a mailbox is created for them from a predefined template. The domain must already exist in Mailcow. Mailboxes that already exist are switched to Keycloak sign-in manually.

## Two-factor authentication

The main convenience is that the second factor is enabled once in Keycloak and immediately applies to all connected applications. There is no need to set it up separately for each application.

On first sign-in the user sees a QR code, scans it with an authenticator app on their phone (for example, FreeOTP or Google Authenticator) and from then on enters a one-time code after the password. Making the second factor mandatory is set in Keycloak for everyone or for selected groups.

## What improved

**One sign-in:** one username and one password for all applications, and signing in to the next application without entering them again.

**Security:** only Keycloak knows the password, and the applications never see it. The second factor protects all services at once.

**Access management:** users and permissions (by group) are managed in one place. A departed employee only has to be disabled once, and loses access everywhere.

**Less load on support:** no more multiple passwords that have to be reset and recovered.

**Open source:** no paid licenses, data stays on your own servers, and if needed, other applications that support OpenID Connect can be connected.

## Summary

**What got harder:** Keycloak becomes the point that sign-in to all applications depends on, so it needs backups and careful operation.

**Result:** users sign in to all company services through one page, the second factor is enabled once for everyone, and access is managed from one place on a fully open solution.
