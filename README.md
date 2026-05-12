# CSEC 3 Final Project — Cloud Web Application Deployment on Azure

## Scenario
**B — E-Commerce Storefront**: a simple product catalog with browsing and cart functionality (no real payment processing).

## Team
- Member 1: `<name>`
- Member 2: `<name>`
- Member 3 (optional): `<name>`

## Team Work Split (Suggested)
- **Member 1 (Infra Lead)**: deploy resources via `deployment/deploy.azcli`, validate App Service scale settings, capture portal screenshots.
- **Member 2 (App Lead)**: finalize `src/` storefront behavior, push demo-safe data, verify end-to-end flow.
- **Member 3 (Docs/Presentation Lead)**: cost report, changelog quality, architecture diagram polishing, video editing.

## Live Demo
- **App URL**: `<paste your App Service URL here>`
- **Video (unlisted)**: `<paste your YouTube link here>`

## Architecture
- Diagram: `diagram/architecture.png`

### Baseline (minimum requirements)
- **Azure App Service** (2+ instances) hosting the web app
- **Azure SQL Database** storing products and cart/order data
- **Azure Storage Account (Blob)** storing product images or static assets
- (Optional) **Azure Cache for Redis** to speed up cart/session lookups

### Improvements (pick at least two; this repo is set up for these)
- **Scalability**: App Service autoscale rules (CPU-based) + 2+ instances
- **Security**: Managed Identity + Key Vault for secrets (no passwords in code)
- **Monitoring**: Application Insights + basic alerts (availability / failures)

## Repository Structure
See the required course structure:
- `diagram/` — architecture diagram
- `deployment/` — deployment scripts / portal steps and screenshots
- `report/` — cost estimate report and screenshot
- `CHANGELOG.md` — keep-a-changelog format, with entries by each member
- `src/` — starter web app (simple, deployable)

## Deployment
Go to `deployment/README.md`.

## Submission Checklist
- `diagram/architecture.png` completed and clearly labeled
- `deployment/deploy.azcli` reviewed and executed (or GUI screenshots added)
- `deployment/screenshots/` has sequential evidence images
- `report/cost-estimate.md` completed + calculator screenshot inserted
- `CHANGELOG.md` includes dated entries from **every member**
- README has live app URL + unlisted YouTube video URL
- All members can explain architecture, optimizations, and costs

## Local Run (starter app)
Go to `src/README.md`.

## Cleanup (after grading)
Delete the resource group to avoid charges:
- `az group delete -n <rg-name> --yes --no-wait`
