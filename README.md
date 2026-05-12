# CSEC 3 Final Project — Cloud Web Application Deployment on Azure

## Scenario
**E-Commerce Storefront**: a simple product catalog with browsing and cart functionality (no real payment processing).

## Team
- JAVE A. BACSAIN
- CARL GERALD J. PARRO
- MARC JUSTIN N. PRESTADO

## Run locally

**Prerequisite:** [Node.js](https://nodejs.org/) **20 or newer** (see `src/package.json`).

From the **repository root** (`CloudCom`), go into the app folder and install dependencies first, then start the server:

```bash
cd src
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

- **`npm run dev`** — runs the app with file watching (good for development).
- **`npm start`** — runs `node server.js` without watch (closer to how App Service runs it).

Optional Azure SQL variables (`SQL_SERVER`, `SQL_DATABASE`, `SQL_USER`, `SQL_PASSWORD`) are described in `src/README.md`; if they are unset, the app still runs using in-memory storage.
