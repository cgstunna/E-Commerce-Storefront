# Video Demo Outline (10–15 minutes)

## 1) Architecture Walkthrough (3 min)
- Show `diagram/architecture.png`
- Explain baseline: App Service (2+), SQL, Blob
- Explain improvements:
  - Autoscale rule
  - Key Vault + Managed Identity
  - App Insights (and Redis optional)
- Point out public/private boundary

## 2) Live Demo (5 min)
- Open deployed app URL
- Browse catalog
- Add items to cart
- Checkout (demo)
- Show recent orders page
- Show Azure Portal resources in the resource group
- Show deployment script `deployment/deploy.azcli`

## 3) Cost Review (2 min)
- Open `report/cost-estimate.md`
- Show pricing calculator screenshot
- Explain one cost-saving plan (e.g., off-hours scale down)

## 4) Conclusion (2 min)
- Challenges faced
- Key technical learnings
- Future improvements
