# Architecture Diagram Guide (Scenario B: E-Commerce Storefront)

Use this as the source for your final `diagram/architecture.png` in draw.io.

## What to include in the final PNG
- Public internet users
- App Service (2+ instances)
- Azure SQL Database
- Azure Storage (Blob)
- Optional Redis cache
- App Insights
- Key Vault + Managed Identity
- Security boundary (public vs private resources)

## Suggested labels and protocols
- Browser -> Web App: `HTTPS 443`
- Web App -> SQL: `TDS 1433 (private access preferred)`
- Web App -> Blob Storage: `HTTPS 443`
- Web App -> Redis: `TLS 6380`
- Web App -> Key Vault: `HTTPS 443 (Managed Identity)`
- Web App -> App Insights: telemetry/events

## Mermaid draft (for planning only)
```mermaid
flowchart LR
  U[Users / Browser] -->|HTTPS 443| WAF[Optional WAF / Front Door]
  U -->|HTTPS 443| APP[Azure App Service\n(Web App, 2+ instances)]
  WAF -->|HTTPS 443| APP

  subgraph Public_Zone[Public Boundary]
    APP
  end

  subgraph Private_Zone[Private/Managed Services Boundary]
    SQL[Azure SQL Database]
    BLOB[Azure Storage Blob]
    REDIS[Azure Cache for Redis\n(Optional)]
    KV[Azure Key Vault]
    AI[Application Insights]
  end

  APP -->|TDS 1433| SQL
  APP -->|HTTPS 443| BLOB
  APP -->|TLS 6380| REDIS
  APP -->|Managed Identity + HTTPS| KV
  APP -->|Telemetry| AI

  AUTO[Autoscale Rule\nCPU >70% out / <30% in] -.-> APP
```

## Baseline vs Improved (for your diagram callouts)
- **Baseline**: App Service (2 instances) + SQL + Blob Storage
- **Improved 1 (Scalability)**: Autoscale policy on App Service Plan
- **Improved 2 (Security)**: Key Vault + Managed Identity (remove hardcoded secrets)
- **Improved 3 (Operations)**: Application Insights dashboards + alerts
