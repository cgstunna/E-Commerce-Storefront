# Team Execution Plan (Scenario B)

## Sprint Plan (Fast Track)

### Phase 1 - Foundation (Day 1)
- Confirm scenario choice: **B E-Commerce Storefront**
- Finalize architecture in `diagram/architecture.png`
- Decide optimization pair (recommended):
  - Autoscale (scalability)
  - Key Vault + Managed Identity (security)

### Phase 2 - Deployment (Day 2)
- Run `deployment/deploy.azcli`
- Deploy app code to App Service
- Validate:
  - App accessible publicly
  - SQL connected
  - App Service has at least 2 instances

### Phase 3 - Evidence + Costing (Day 3)
- Capture Azure Portal screenshots in `deployment/screenshots/`
- Build pricing estimate and complete `report/cost-estimate.md`
- Add dated `CHANGELOG.md` entries for each member

### Phase 4 - Presentation (Day 4)
- Rehearse using `report/video-demo-outline.md`
- Keep video between 10 and 15 minutes
- Ensure each member explains a technical section

## Member Responsibilities (Fill In)
- Member A: `<name>` - `<infra/deployment ownership>`
- Member B: `<name>` - `<application/demo ownership>`
- Member C: `<name>` - `<docs/report/video ownership>`

## Quality Gate Before Submission
- Architecture diagram has boundaries + protocols + optimization highlights
- Deployment method is reproducible (CLI script or clean GUI evidence)
- Cost report matches deployed resources
- Demo works end-to-end without manual fixes
- README links are valid (demo + video)
