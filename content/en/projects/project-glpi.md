---
title: "GLPI: From Chaos to Transparent ITIL"
date: 2026-08-10
summary: "Implementation of Gestionnaire Libre de Parc Informatique."
---

## About the project

# GLPI: From Chaos to Transparent ITIL

Every IT department eventually faces growing pains. Requests from users get lost in instant messengers, emails, and phone calls. Asset tracking is maintained in fragmented Excel spreadsheets, and software compliance on workstations remains a mystery until the first audit.

The way out of this chaos is transitioning to ITIL service management framework, and **GLPI (Gestionnaire Libre de Parc Informatique)** is the ideal tool for this. It is a powerful **Open Source** solution providing enterprise-grade functionality without expensive proprietary licenses. The entire system runs reliably on Linux, providing high stability and data security.
The two main pillars of order in GLPI are a transparent Helpdesk and total asset control.

## Unified Ticket Management System (Helpdesk)

The first step toward ITIL is establishing a Single Point of Contact (SPOC). GLPI allows eliminating informal, "on-the-fly" requests and streamlining all support operations.

* **Centralization:** All incidents and service requests are recorded in a single portal. Users track issue statuses, while engineers receive clearly defined tasks.
* **Routing & SLA Control:** Tickets are automatically dispatched across support tiers. Service Level Agreements (SLA) are enforced — enabling precise tracking of response and resolution times.
* **Knowledge Base:** An integrated Wiki allows accumulating experience and offering self-service guides for common issues (e.g., password resets, VPN setup).

## Hardware & Software Inventory: Standardization

The second major value proposition of GLPI is total control over IT assets. The system unifies the inventory of all computers, servers, network hardware, and software into a single, standardized view.

You get a complete picture:
1. **Hardware:** Precise PC specifications (CPU, RAM capacity, drives, serial numbers).
2. **Software:** Lists of installed applications, OS versions, and license compliance tracking.
3. **Lifecycle & Financials:** Asset movement history (who received which monitor and when), warranty terms, and statuses (in repair, in stock, decommissioned).

Helpdesk tickets link directly to specific hardware items, giving full visibility into the service and failure history of each device.

## Integration and Automation: AD and GPO

To prevent the system from becoming just another manual database, GLPI easily integrates into the corporate environment.

* **Active Directory (AD) Integration:** No manual user creation required. GLPI syncs with your directory service. Employees authenticate via domain credentials (SSO), and access rights auto-update upon employee offboarding or role changes.
* **Automated Data Collection:** Inventory happens automatically. You simply configure **GLPI Agent** deployment across Windows workstations using **Group Policy Objects (GPO)**. The agent installs silently on user PCs and regularly transmits detailed hardware and software audit data to the Linux server. No manual office walk-throughs or physical asset tag logging required.

**Summary:** Implementing GLPI transforms the IT department from a reactive "firefighting team" into a proactive service unit. Chaos is replaced by measurable metrics, Excel spreadsheets become a thing of the past, and IT leadership receives a transparent tool to manage processes, budgets, and service quality.