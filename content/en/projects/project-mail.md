---
title: "Enterprise Email Setup: Securing Your Domain (SPF, DKIM, DMARC)."
date: 2026-08-08
summary: "DNS, Email."
---

## About the project

The SMTP protocol, used for transmitting email, was designed in the 1980s without any built-in protection against sender spoofing. Any spammer could send an email with your CEO's address in the "From" field.

To combat spam and phishing, modern email providers (Google, Microsoft, Yahoo) require mandatory verification that a server is authorized to send emails on behalf of your domain. This is achieved using a triad of DNS records: SPF, DKIM, and DMARC.

---

## What is DKIM used for?

**DKIM (DomainKeys Identified Mail)** acts as a digital signature for your emails. 
It operates on asymmetric cryptography: the private key is stored on your mail server (e.g., Mailcow), and the public key is published in your domain's DNS zone. When the server sends an email, it signs the headers and body with the private key.

The receiving server retrieves the public key from your DNS to verify the signature. If it matches, it guarantees two things:
1. The email was genuinely authorized by the domain owner's server.
2. The email content and attachments **were not altered** or tampered with during transit.

---

## SPF: The Difference Between Tilde (~) and Hyphen (-)

**SPF (Sender Policy Framework)** is simply a whitelist of IP addresses and servers authorized to send mail for your domain.

Let's look at an example record: `v=spf1 include:_spf.mx.cloudflare.net ~all`
Here, we authorize Cloudflare servers to send mail (useful when using Cloudflare Email Routing), and at the end, there is the crucial `~all` modifier.

What is the difference between `~` (SoftFail) and `-` (Fail)?
*   **`-all` (Hard Fail):** If an email originates from a server not listed in the SPF record, the receiving server will **immediately reject** it at the connection level. It’s highly secure but can break email forwarding when a message passes through third-party transit servers.
*   **`~all` (Soft Fail):** If the server doesn't match, the email **will be accepted** but will receive a negative spam score (likely landing in the "Junk" folder or flagged as suspicious). I often use `~all` during server migrations or complex forwarding setups to ensure legitimate mail isn't lost.

---

## My DMARC Configuration: Strict Enforcement

DMARC is the policy layer that tells other servers what to do if SPF or DKIM checks fail. In my projects, once the infrastructure is fully verified, I deploy a strict policy:

`v=DMARC1; p=reject; aspf=s; adkim=s; sp=quarantine;`

Here is why I use these exact parameters:
*   **`p=reject` (Policy = Reject):** The golden rule. If someone attempts to spoof my domain and the email fails authentication, it is **dropped entirely**. It won't even reach the spam folder. Attackers simply cannot impersonate the domain.
*   **`aspf=s` and `adkim=s` (Strict Alignment):** The `s` stands for strict alignment. This dictates that the domain in the technical return-path must *exactly* match the domain in the visible "From" header. This prevents sophisticated attacks where a spammer uses a valid SPF for a subdomain but spoofs the primary domain in the visible address.
*   **`sp=quarantine` (Subdomain Policy):** This applies to subdomains. If an unauthenticated email originates from a subdomain (e.g., `marketing.my-domain.com`), it is not rejected outright but sent to quarantine (Spam folder). This provides a safety net just in case a department connects a new SaaS mailing tool to a subdomain without notifying IT.

---

## Conclusion

Properly configuring the SPF, DKIM, and DMARC triad is not just a checkbox for a system administrator. It is the absolute guarantee that corporate emails will reach the inbox and that the domain's reputation is shielded from spoofing and phishing attacks. Enforcing strict policies (`p=reject`) requires meticulous initial setup but delivers 100% protection against sender address forgery.