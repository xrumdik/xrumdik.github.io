---
title: "Databasys: Automating Database Backups (MySQL, PostgreSQL)."
date: 2026-08-09
summary: "Backup."
---

## About the project

A robust IT infrastructure is inconceivable without a solid Disaster Recovery strategy. While virtual machine backups cover bare-metal or full-system restores, databases require a more granular approach: generating consistent, scheduled dumps.

To solve this, I utilize **Databasys** — a dedicated **Open Source** solution for centralized database backups, specifically targeting **MySQL** and **PostgreSQL**. The tool is distributed as a Docker container, making its deployment highly predictable and entirely independent of the host operating system.

## Why Synology NAS?

The ideal location for storing database dumps is a dedicated Network Attached Storage (NAS) appliance, isolated from the primary compute nodes. **Synology** hardware fits this role perfectly due to its RAID support, Btrfs file system (with bit-rot protection), and native containerization capabilities.

Deploying Databasys directly on a Synology NAS establishes a pull-based backup scheme: the storage appliance autonomously retrieves dumps from production servers, minimizing overhead on the primary network.

---

## 🛠 Practical Guide: Deploying Databasys on Synology

The launch process consists of two straightforward steps.

### Step 1: Installing Docker on Synology
In modern Synology DSM versions (7.2 and later), the Docker ecosystem has been revamped.
1. Open the **Package Center** in the DSM web interface.
2. Search for and install the official **Container Manager** package (formerly known as Docker).
3. Use File Station to create a shared folder for configurations and dumps, e.g., `/docker/databasys`.

### Step 2: Launching the Container
To maintain declarative infrastructure, using `docker-compose` is the best practice. Via Container Manager (Projects section) or SSH access to the NAS, create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  databasys:
    image: databasys/databasys:latest
    container_name: databasys_backup
    restart: unless-stopped
    environment:
      - DB_TYPE=postgres  # or mysql
      - DB_HOST=192.168.1.100
      - DB_PORT=5432
      - DB_USER=backup_user
      - DB_PASS=SecurePassword123
      - CRON_SCHEDULE=0 2 * * * # Run every night at 02:00 AM
      - RETENTION_DAYS=14       # Keep archives for 14 days
    volumes:
      - /volume1/docker/databasys/backups:/backups
```

Deploy the stack. Databasys will automatically connect to the specified database, generate a compressed dump, and store it on the secure Synology volume, while older archives are purged according to the retention policy.

## Conclusion:
Implementing Databasys via Docker is an elegant and reliable way to handle database backups.

Autonomy: The container ships with all necessary dependencies and clients natively installed (pg_dump, mysqldump).

Security: Dumps are stored on an isolated NAS, protected from potential threats inside the primary network.

Open Source: The absence of licensing restrictions allows you to scale this solution across any number of databases.