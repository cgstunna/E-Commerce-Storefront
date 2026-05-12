# Deployment Guide (Azure CLI)

This project is designed to be deployed using **Azure CLI** (Method A: Code).  
No secrets should be committed to the repo.

## Prerequisites
- Azure account (Azure for Students recommended)
- Azure CLI installed
- Logged in:

```bash
az login
```

## Quick start
1. Review and edit variables at the top of `deployment/deploy.azcli` (resource names, region).
2. Run the script:

```bash
cd deployment
az account show
./deploy.azcli
```

> On Windows PowerShell, you may need:
> - `Set-ExecutionPolicy -Scope Process Bypass`
> - `.\deploy.azcli`

## What gets deployed
**Baseline resources (minimum 3 Azure services):**
- Resource Group
- App Service Plan + App Service (configured for **2 instances**)
- Azure SQL Server + Azure SQL Database
- Storage Account (Blob container for product images/static files)
- (Optional, Scenario B) Azure Cache for Redis

**Optimizations (at least two):**
- Autoscale rules for App Service Plan (scale out based on CPU)
- Application Insights (telemetry)
- Managed Identity + Key Vault (recommended; enabled by script as “optional block”)

## Scenario B mapping
This deployment supports **E-Commerce Storefront** requirements:
- App Service: web catalog + cart app
- Azure SQL: products + demo order records
- Azure Storage: product media/static assets
- Redis (optional): cache/session acceleration for cart

## Screenshots (if you also want GUI evidence)
If your instructor expects portal screenshots, place them in:
- `deployment/screenshots/`

Name them sequentially, e.g. `01-resource-group.png`, `02-app-service.png`, etc.

## Outputs to record for README
After deployment, capture:
- Web app URL
- Resource group name + region
- Cost estimate screenshot (Pricing Calculator)
