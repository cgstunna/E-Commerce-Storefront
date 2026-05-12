# Azure Portal Screenshot Checklist (if using GUI evidence)

Store screenshots in `deployment/screenshots/` with names:
`01-...png`, `02-...png`, etc.

## Required capture sequence
- `01-resource-group.png` - Resource Group creation summary
- `02-app-service-plan.png` - Plan tier + region
- `03-app-service.png` - Web App creation + runtime
- `04-app-service-scale.png` - Instance count >= 2
- `05-autoscale-rule.png` - CPU scale in/out rules
- `06-sql-server-db.png` - SQL server + DB overview
- `07-storage-account.png` - Storage account settings
- `08-blob-container.png` - Blob container created
- `09-key-vault-mi.png` - Key Vault and App Service identity
- `10-app-insights.png` - Application Insights overview
- `11-redis-optional.png` - Redis resource overview (if enabled)
- `12-resource-group-final.png` - final resource list

## Tips
- Keep browser zoom readable
- Include URL bar/resource name when possible
- Add 1-line caption below each image in deployment docs
