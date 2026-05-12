# Cost Estimate Report (Azure Pricing Calculator)

> Replace placeholders with your actual estimate. Keep this to **1–2 pages**.

## Architecture Summary
This deployment hosts a simple **E-Commerce Storefront** on Azure (product catalog + cart; no real payment processing).

**Resources included:**
- Azure App Service Plan + Web App (configured for 2 instances; autoscale enabled)
- Azure SQL Server + Azure SQL Database (products + demo orders)
- Azure Storage Account (Blob) (product images / static assets)
- (Optional) Azure Cache for Redis (cart/session caching)
- Application Insights (monitoring)
- (Optional) Key Vault + Managed Identity (security)

## Itemized Monthly Cost Breakdown (Estimated)
Fill this table using the Azure Pricing Calculator and your chosen region/SKU.

| Resource | Region | SKU / Tier | Estimated Monthly Cost |
|---|---|---:|---:|
| App Service Plan | `<region>` | `<B1/S1/etc>` | `$<amount>` |
| App Service (Web App) | `<region>` | Included in plan | `$0` |
| Azure SQL Database | `<region>` | `<S0 / Basic / serverless>` | `$<amount>` |
| Storage Account (Blob) | `<region>` | `<LRS/ZRS + usage>` | `$<amount>` |
| Azure Cache for Redis (optional) | `<region>` | `<Basic C0/etc>` | `$<amount>` |
| Application Insights | `<region>` | Pay-as-you-go | `$<amount>` |
| Key Vault (optional) | `<region>` | Standard | `$<amount>` |
| **Total** |  |  | **$<total>** |

## Azure Pricing Calculator Screenshot
Add a screenshot image file to `report/` and reference it here.

- Screenshot file: `report/<your-screenshot>.png`

## Cost Optimization Notes
Describe at least one realistic cost reduction:

- **Scale down off-hours**: reduce App Service instance count at night/weekends; estimate savings based on reduced instance-hours.
- **Use smaller tiers for demo**: B1/Free where possible, then document why production would need higher tiers.
- **Database right-sizing**: start with Basic/S0; consider serverless (auto-pause) if usage is intermittent.
