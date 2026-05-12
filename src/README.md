# Starter App (E-Commerce Storefront)

This is a minimal Node.js web app you can deploy to **Azure App Service**.

## What it does
- Shows a simple **product catalog**
- Lets you **add/remove items** in a cart (no real payment processing)
- Stores data in **Azure SQL** (or falls back to in-memory if SQL env vars are missing)

## Local Run
1. Install dependencies:

```bash
cd src
npm install
```

2. Start:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables (Azure)
The Azure CLI script sets these app settings:
- `SQL_SERVER`
- `SQL_DATABASE`
- `SQL_USER`
- `SQL_PASSWORD`

If they are missing, the app still runs (demo-friendly).
