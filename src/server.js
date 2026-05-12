import express from "express";
import sql from "mssql";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

function getSqlConfigFromEnv() {
  const server = process.env.SQL_SERVER;
  const database = process.env.SQL_DATABASE;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  if (!server || !database || !user || !password) return null;

  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
}

const PRODUCTS_PER_TYPE = 12;
const CATALOG_TYPES = [
  "Mouse",
  "Keyboard",
  "Headset",
  "Webcam",
  "Mechanical Keyboard",
  "Gaming Mousepad",
  "Monitor",
  "SSD",
  "RAM Kit",
  "CPU Cooler",
  "PC Case",
  "Power Supply",
  "Graphics Card",
  "Motherboard",
  "Desk Mat",
  "Monitor Arm",
  "Microphone",
  "Speaker",
  "USB Hub",
  "Docking Station"
];
const CATALOG_SIZE = CATALOG_TYPES.length * PRODUCTS_PER_TYPE;

function buildCatalog(count = CATALOG_SIZE) {
  const brands = ["Logitech", "Razer", "Corsair", "HyperX", "SteelSeries", "ASUS", "MSI", "Samsung", "Kingston", "NZXT"];
  const suffixes = ["MK2", "V2", "SE", "Pro", "X", "Plus", "Core", "Elite"];
  const nouns = CATALOG_TYPES;
  const priceRanges = {
    Mouse: [900, 5500],
    Keyboard: [1200, 7500],
    Headset: [1500, 9000],
    Webcam: [1800, 8000],
    "Mechanical Keyboard": [2500, 12000],
    "Gaming Mousepad": [400, 2200],
    Monitor: [6500, 28000],
    SSD: [1800, 14000],
    "RAM Kit": [2200, 11000],
    "CPU Cooler": [1500, 9500],
    "PC Case": [2800, 12000],
    "Power Supply": [2500, 11000],
    "Graphics Card": [12000, 90000],
    Motherboard: [5000, 26000],
    "Desk Mat": [500, 2800],
    "Monitor Arm": [1500, 7000],
    Microphone: [1800, 11000],
    Speaker: [1400, 9000],
    "USB Hub": [700, 3800],
    "Docking Station": [2500, 14000]
  };

  const products = [];
  let i = 1;
  for (const n of nouns) {
    for (let idx = 0; idx < PRODUCTS_PER_TYPE && i <= count; idx += 1) {
      const brand = brands[(idx + i - 1) % brands.length];
      const suffix = suffixes[(idx + Math.floor(i / 2)) % suffixes.length];
      const model = `${n.replaceAll(" ", "")}-${String(100 + (i % 900)).padStart(3, "0")}`;
      const display = `${brand} ${n} ${model} ${suffix}`;
      const [minPrice, maxPrice] = priceRanges[n] || [1000, 10000];
      const span = maxPrice - minPrice;
      const step = 50;
      const seeded = ((i * 15485863) % 997) / 997;
      const rawPrice = minPrice + Math.floor(seeded * span);
      const price = Math.round(rawPrice / step) * step;
      products.push({
        sku: `SKU-${String(i).padStart(3, "0")}`,
        name: display,
        type: n,
        price,
        stock: 8 + ((i * 11) % 120)
      });
      i += 1;
    }
  }
  return products;
}

function escapeSqlString(s) {
  return String(s).replaceAll("'", "''");
}

const inMemoryProducts = buildCatalog(CATALOG_SIZE);
const inMemoryOrders = [];
let sqlPoolPromise = null;

async function ensureSqlPool() {
  const cfg = getSqlConfigFromEnv();
  if (!cfg) return null;
  if (!sqlPoolPromise) {
    sqlPoolPromise = sql.connect(cfg);
  }
  return sqlPoolPromise;
}

async function ensureSchema(pool) {
  await pool.request().query(`
    IF OBJECT_ID('dbo.Products', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Products (
        Sku NVARCHAR(40) NOT NULL PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Price INT NOT NULL,
        Stock INT NOT NULL
      );
    END
  `);

  await pool.request().query(`
    IF COL_LENGTH('dbo.Products', 'Category') IS NULL
    BEGIN
      ALTER TABLE dbo.Products ADD Category NVARCHAR(100) NOT NULL CONSTRAINT DF_Products_Category DEFAULT 'General';
    END
  `);

  await pool.request().query(`
    IF OBJECT_ID('dbo.Orders', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Orders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ItemsJson NVARCHAR(MAX) NOT NULL,
        Total INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `);

  const countResult = await pool.request().query(`SELECT COUNT(1) AS Cnt FROM dbo.Products`);
  const currentCount = Number(countResult.recordset?.[0]?.Cnt || 0);
  const perCategoryResult = await pool.request().query(`
    SELECT ISNULL(MIN(Cnt), 0) AS MinCnt
    FROM (
      SELECT Category, COUNT(1) AS Cnt
      FROM dbo.Products
      GROUP BY Category
    ) x
  `);
  const minPerCategory = Number(perCategoryResult.recordset?.[0]?.MinCnt || 0);

  if (currentCount < CATALOG_SIZE || minPerCategory < PRODUCTS_PER_TYPE) {
    // Keep demo data consistent with the generated storefront size.
    await pool.request().query(`DELETE FROM dbo.Products`);
    const values = inMemoryProducts
      .map(
        (p) =>
          `('${escapeSqlString(p.sku)}','${escapeSqlString(p.name)}','${escapeSqlString(p.type)}',${Number(p.price)},${Number(
            p.stock
          )})`
      )
      .join(",");
    await pool.request().query(`INSERT INTO dbo.Products (Sku, Name, Category, Price, Stock) VALUES ${values}`);
  }
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      --bg: #0a0f1f;
      --panel: #111a33;
      --panel-2: #0f1730;
      --line: #263866;
      --text: #e8eeff;
      --muted: #9baad6;
      --accent: #6ea8ff;
      --accent-2: #4d7dff;
      --danger: #ffb8bf;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Inter, Segoe UI, Roboto, Arial, sans-serif;
      margin: 0;
      background: radial-gradient(1200px 700px at 20% -10%, #1b2e63 0%, var(--bg) 60%);
      color: var(--text);
    }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 30px 18px; }
    .card {
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 14px 30px rgba(0,0,0,0.25);
    }
    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: 0.2px; }
    p { margin: 6px 0 14px; color: var(--muted); }
    label { display:block; margin: 10px 0 6px; color: #d7e0ff; font-size: 13px; }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      outline: none;
    }
    input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(110,168,255,0.15); }
    button {
      margin-top: 0;
      padding: 10px 13px;
      border-radius: 12px;
      border: 0;
      background: linear-gradient(180deg, var(--accent), var(--accent-2));
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
    button:hover { filter: brightness(1.06); }
    .row { display:flex; gap: 12px; align-items: end; }
    .row > div { flex: 1; }
    table { width:100%; border-collapse: collapse; margin-top: 10px; background: rgba(255,255,255,0.01); border-radius: 12px; overflow: hidden; }
    th, td { text-align:left; padding: 11px; border-bottom: 1px solid var(--line); }
    .muted { color: var(--muted); font-size: 12px; }
    a { color: #bfd2ff; }
    .pill {
      display:inline-block;
      padding: 6px 11px;
      border-radius: 999px;
      background: rgba(110,168,255,0.1);
      border: 1px solid rgba(110,168,255,0.35);
      color:#cfe0ff;
      font-size: 12px;
      font-weight: 600;
    }
    .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 10px; }
    .tile {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      transition: transform .12s ease, border-color .12s ease;
    }
    .tile:hover { transform: translateY(-2px); border-color: #3f5ea5; }
    .tile h3 { margin: 0 0 6px; font-size: 16px; min-height: 40px; }
    .price { font-weight: 800; font-size: 18px; color: #d7e6ff; }
    .actions { display:flex; gap: 8px; align-items:center; margin-top: 12px; }
    .actions form { margin: 0; }
    .smallbtn {
      padding: 8px 11px;
      border-radius: 10px;
      border: 1px solid #3e5ea8;
      background: linear-gradient(180deg, #5f95ff, #4574ef);
      color:#f3f7ff;
      font-weight:700;
      cursor:pointer;
    }
    .smallbtn:hover { filter: brightness(1.08); }
    .type-chip { opacity: 0.88; }
    .type-chip.active {
      opacity: 1;
      border-color: #8cb6ff;
      box-shadow: 0 0 0 2px rgba(110,168,255,0.2);
    }
    .qty-input, .qty-input-cart { width: 68px !important; text-align: center; }
    .top-actions { display:flex; gap:8px; justify-content:flex-end; flex-wrap: wrap; }
    .top-link-btn {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid #3e5ea8;
      background: linear-gradient(180deg, #5f95ff, #4574ef);
      color: #f3f7ff;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }
    .top-link-btn:hover { filter: brightness(1.08); }
    .footer-note { margin-top: 16px; text-align: center; }
    @media (max-width: 1080px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 860px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) {
      .grid { grid-template-columns: 1fr; }
      .row { flex-direction: column; align-items: stretch; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      ${body}
    </div>
    <p class="muted footer-note">CSEC 3 Cloud Computing — Final Project demo app.</p>
  </div>
</body>
</html>`;
}

function parseCartFromCookie(req) {
  const cookie = String(req.headers.cookie || "");
  const match = cookie.split(";").map((s) => s.trim()).find((p) => p.startsWith("cart="));
  if (!match) return {};
  const raw = match.slice("cart=".length);
  try {
    const json = decodeURIComponent(raw);
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return {};
    const cleaned = {};
    for (const [sku, qty] of Object.entries(obj)) {
      const n = Number(qty);
      if (Number.isFinite(n) && n > 0 && n < 100) cleaned[String(sku)] = Math.floor(n);
    }
    return cleaned;
  } catch {
    return {};
  }
}

function setCartCookie(res, cart) {
  const json = encodeURIComponent(JSON.stringify(cart));
  // Not secure/authenticated; this is a simple demo cart.
  res.setHeader("Set-Cookie", `cart=${json}; Path=/; HttpOnly; SameSite=Lax`);
}

function cartCount(cart) {
  return Object.values(cart).reduce((a, b) => a + Number(b || 0), 0);
}

function cartTotal(cart, products) {
  const bySku = new Map(products.map((p) => [p.sku, p]));
  let total = 0;
  for (const [sku, qty] of Object.entries(cart)) {
    const p = bySku.get(sku);
    if (p) total += p.price * qty;
  }
  return total;
}

function cartItemsWithProducts(cart, products) {
  const bySku = new Map(products.map((p) => [p.sku, p]));
  return Object.entries(cart)
    .map(([sku, qty]) => ({ sku, qty: Number(qty), product: bySku.get(sku) }))
    .filter((x) => x.product);
}

function normalizeQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(99, Math.floor(n)));
}

async function loadProducts() {
  try {
    const pool = await ensureSqlPool();
    if (!pool) return inMemoryProducts;
    await ensureSchema(pool);
    const result = await pool.request().query(`SELECT Sku, Name, Category, Price, Stock FROM dbo.Products ORDER BY Sku ASC`);
    return (result.recordset || []).map((r) => ({
      sku: r.Sku,
      name: r.Name,
      type: r.Category || "General",
      price: r.Price,
      stock: r.Stock
    }));
  } catch {
    return inMemoryProducts;
  }
}

app.get("/", async (req, res) => {
  let storageMode = "in-memory";
  try {
    const pool = await ensureSqlPool();
    if (pool) storageMode = "azure-sql";
  } catch {
    storageMode = "in-memory (sql connection failed)";
  }

  const products = await loadProducts();
  const cart = parseCartFromCookie(req);
  const count = cartCount(cart);
  const types = Array.from(new Set(products.map((p) => p.type))).sort((a, b) => a.localeCompare(b));

  res.send(
    page(
      "Storefront",
      `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <h1>E-Commerce Storefront</h1>
        <div class="top-actions">
          <a class="top-link-btn" href="/cart">🛒 <span>View cart (<span id="cart-count">${count}</span>)</span></a>
          <a class="top-link-btn" href="/orders">📦 <span>Recent orders</span></a>
        </div>
      </div>
      <p>Browse products and add them to your cart.</p>
      <div class="row" style="margin: 10px 0 6px;">
        <div>
          <label for="search">Search products</label>
          <input id="search" type="text" placeholder="Type product name..." />
        </div>
        <div>
          <label for="sort">Sort</label>
          <select id="sort">
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
          </select>
        </div>
      </div>
      <div id="type-filters" style="display:flex; gap:8px; flex-wrap: wrap; margin: 8px 0 12px;">
        ${types
          .map(
            (t) =>
              `<button type="button" class="smallbtn type-chip" data-type="${escapeHtml(t.toLowerCase())}">${escapeHtml(
                t
              )}</button>`
          )
          .join("")}
      </div>
      <p id="category-meta" class="muted" style="margin: 0 0 8px;"></p>
      <div class="grid">
        ${products
          .map(
            (p) => `
            <div class="tile" data-name="${escapeHtml(p.name.toLowerCase())}" data-price="${Number(p.price)}" data-type="${escapeHtml(
              String(p.type || "General").toLowerCase()
            )}">
              <h3>${escapeHtml(p.name)}</h3>
              <div class="muted">${escapeHtml(p.sku)} · Type: ${escapeHtml(String(p.type || "General"))} · Stock: ${Number(
                p.stock
              )}</div>
              <div class="actions">
                <div class="price">₱${Number(p.price)}</div>
                <input type="number" min="1" max="${Number(p.stock)}" value="1" style="width:70px;" class="qty-input" />
                <form method="post" action="/cart/add">
                  <input type="hidden" name="sku" value="${escapeHtml(p.sku)}" />
                  <input type="hidden" name="qty" value="1" />
                  <button class="smallbtn" type="submit">Add to cart</button>
                </form>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
      <div id="toast" style="position:fixed; right:16px; bottom:16px; background:#1b2a4f; border:1px solid #3d5ba6; color:#e6eaf2; padding:10px 12px; border-radius:10px; display:none;"></div>
      <script>
        const grid = document.querySelector('.grid');
        const search = document.getElementById('search');
        const sort = document.getElementById('sort');
        const typeFilters = document.getElementById('type-filters');
        const categoryMeta = document.getElementById('category-meta');
        const cartCountEl = document.getElementById('cart-count');
        const toast = document.getElementById('toast');
        let activeType = '';
        let visibleLimit = 20;

        function showToast(msg) {
          toast.textContent = msg;
          toast.style.display = 'block';
          clearTimeout(window.__toastTimer);
          window.__toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 1400);
        }

        function applyFilterAndSort() {
          const term = (search.value || '').trim().toLowerCase();
          const cards = [...grid.querySelectorAll('.tile')];
          const typeCards = cards.filter(c => activeType && c.dataset.type === activeType);
          const visible = typeCards.filter(c => c.dataset.name.includes(term));
          const mode = sort.value;
          visible.sort((a, b) => {
            if (mode === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
            if (mode === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
            if (mode === 'name-asc') return a.dataset.name.localeCompare(b.dataset.name);
            return 0;
          });
          for (const c of cards) c.style.display = 'none';
          for (const node of visible) grid.appendChild(node);
          for (let i = 0; i < visible.length; i += 1) {
            visible[i].style.display = i < visibleLimit ? '' : 'none';
          }
          const label = activeType ? activeType.replaceAll('-', ' ') : 'category';
          categoryMeta.textContent = 'Showing ' + Math.min(visible.length, visibleLimit) + ' of ' + visible.length + ' products in ' + label + '.';
          moreBtn.style.display = visible.length > visibleLimit ? '' : 'none';
        }

        async function apiAdd(sku, qty) {
          const r = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku, qty })
          });
          return r.json();
        }

        grid.addEventListener('submit', async (e) => {
          const form = e.target.closest('form[action="/cart/add"]');
          if (!form) return;
          e.preventDefault();
          const sku = form.querySelector('input[name="sku"]').value;
          const qtyInput = form.parentElement.querySelector('.qty-input');
          const qty = Math.max(1, Number(qtyInput?.value || 1));
          try {
            const data = await apiAdd(sku, qty);
            if (!data.ok) {
              showToast(data.error || 'Unable to add item');
              return;
            }
            cartCountEl.textContent = String(data.count);
            showToast('Added to cart');
          } catch {
            showToast('Network error');
          }
        });

        search.addEventListener('input', () => {
          visibleLimit = 20;
          applyFilterAndSort();
        });
        sort.addEventListener('change', applyFilterAndSort);
        typeFilters.addEventListener('click', (e) => {
          const btn = e.target.closest('.type-chip');
          if (!btn) return;
          activeType = btn.dataset.type || '';
          visibleLimit = 20;
          for (const b of typeFilters.querySelectorAll('.type-chip')) b.classList.remove('active');
          btn.classList.add('active');
          applyFilterAndSort();
        });
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'smallbtn';
        moreBtn.textContent = 'Load more';
        moreBtn.style.marginTop = '12px';
        moreBtn.addEventListener('click', () => {
          visibleLimit += 20;
          applyFilterAndSort();
        });
        grid.insertAdjacentElement('afterend', moreBtn);

        const firstChip = typeFilters.querySelector('.type-chip');
        if (firstChip) {
          firstChip.classList.add('active');
          activeType = firstChip.dataset.type || '';
        }
        applyFilterAndSort();
      </script>
      `
    )
  );
});

app.post("/cart/add", async (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const qty = normalizeQuantity(req.body.qty || 1);
  const products = await loadProducts();
  const product = products.find((p) => p.sku === sku);
  if (!product) {
    res.status(400).send(page("Error", `<h1>Unknown product</h1><p><a href="/">Back</a></p>`));
    return;
  }

  const cart = parseCartFromCookie(req);
  const nextQty = (cart[sku] || 0) + qty;
  if (nextQty > Number(product.stock)) {
    res.redirect("/cart?error=stock");
    return;
  }
  cart[sku] = nextQty;
  setCartCookie(res, cart);
  res.redirect("/cart");
});

app.get("/api/cart", async (req, res) => {
  const products = await loadProducts();
  const cart = parseCartFromCookie(req);
  const items = cartItemsWithProducts(cart, products).map((x) => ({
    sku: x.sku,
    qty: x.qty,
    name: x.product.name,
    price: x.product.price,
    lineTotal: x.product.price * x.qty
  }));
  res.json({
    ok: true,
    count: cartCount(cart),
    total: cartTotal(cart, products),
    items
  });
});

app.post("/api/cart/add", async (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const qty = normalizeQuantity(req.body.qty || 1);
  const products = await loadProducts();
  const product = products.find((p) => p.sku === sku);
  if (!product) {
    res.status(400).json({ ok: false, error: "Unknown product" });
    return;
  }
  const cart = parseCartFromCookie(req);
  const nextQty = (cart[sku] || 0) + qty;
  if (nextQty > Number(product.stock)) {
    res.status(400).json({ ok: false, error: "Insufficient stock" });
    return;
  }
  cart[sku] = nextQty;
  setCartCookie(res, cart);
  res.json({ ok: true, count: cartCount(cart) });
});

app.post("/api/cart/update", async (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const qty = normalizeQuantity(req.body.qty || 1);
  const products = await loadProducts();
  const product = products.find((p) => p.sku === sku);
  if (!product) {
    res.status(400).json({ ok: false, error: "Unknown product" });
    return;
  }
  if (qty > Number(product.stock)) {
    res.status(400).json({ ok: false, error: "Insufficient stock" });
    return;
  }
  const cart = parseCartFromCookie(req);
  cart[sku] = qty;
  setCartCookie(res, cart);
  res.json({ ok: true, count: cartCount(cart) });
});

app.post("/api/cart/remove", (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const cart = parseCartFromCookie(req);
  delete cart[sku];
  setCartCookie(res, cart);
  res.json({ ok: true, count: cartCount(cart) });
});

app.post("/cart/remove", (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const cart = parseCartFromCookie(req);
  delete cart[sku];
  setCartCookie(res, cart);
  res.redirect("/cart");
});

app.get("/cart", async (req, res) => {
  const products = await loadProducts();
  const cart = parseCartFromCookie(req);
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const items = Object.entries(cart)
    .map(([sku, qty]) => ({ sku, qty, product: bySku.get(sku) }))
    .filter((x) => x.product);

  const total = cartTotal(cart, products);

  const error = req.query.error === "stock" ? "Requested quantity exceeds available stock." : "";

  res.send(
    page(
      "Cart",
      `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <h1>Your cart</h1>
        <span class="pill">Items: ${cartCount(cart)}</span>
      </div>
      <p><a href="/">Continue shopping</a></p>
      ${error ? `<p style="color:#ffb4b4;">${escapeHtml(error)}</p>` : ""}
      ${
        items.length === 0
          ? `<p>Your cart is empty.</p>`
          : `
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th></th></tr></thead>
          <tbody>
            ${items
              .map(
                ({ sku, qty, product }) => `
                <tr>
                  <td>${escapeHtml(product.name)}</td>
                  <td>${escapeHtml(sku)}</td>
                  <td>
                    <form method="post" action="/cart/update" style="display:flex; gap:8px; align-items:center;">
                      <input type="hidden" name="sku" value="${escapeHtml(sku)}" />
                      <input type="number" name="qty" value="${Number(qty)}" min="1" max="${Number(product.stock)}" style="width:72px;" class="qty-input-cart" />
                      <button class="smallbtn" type="submit">Update</button>
                    </form>
                  </td>
                  <td>₱${Number(product.price * qty)}</td>
                  <td>
                    <form method="post" action="/cart/remove">
                      <input type="hidden" name="sku" value="${escapeHtml(sku)}" />
                      <button class="smallbtn" type="submit">Remove</button>
                    </form>
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin-top:12px;"><b>Total:</b> ₱${Number(total)}</p>
        <form method="post" action="/checkout">
          <button type="submit">Checkout (demo)</button>
        </form>
      `
      }
      <div id="toast" style="position:fixed; right:16px; bottom:16px; background:#1b2a4f; border:1px solid #3d5ba6; color:#e6eaf2; padding:10px 12px; border-radius:10px; display:none;"></div>
      <script>
        const toast = document.getElementById('toast');
        function showToast(msg) {
          toast.textContent = msg;
          toast.style.display = 'block';
          clearTimeout(window.__toastTimer);
          window.__toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 1400);
        }

        async function apiPost(url, payload) {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return r.json();
        }

        document.addEventListener('submit', async (e) => {
          const upd = e.target.closest('form[action="/cart/update"]');
          const rem = e.target.closest('form[action="/cart/remove"]');
          if (!upd && !rem) return;
          e.preventDefault();
          try {
            if (upd) {
              const sku = upd.querySelector('input[name="sku"]').value;
              const qty = Number(upd.querySelector('input[name="qty"]').value || 1);
              const data = await apiPost('/api/cart/update', { sku, qty });
              if (!data.ok) {
                showToast(data.error || 'Update failed');
                return;
              }
              location.reload();
              return;
            }
            if (rem) {
              const sku = rem.querySelector('input[name="sku"]').value;
              const data = await apiPost('/api/cart/remove', { sku });
              if (!data.ok) {
                showToast(data.error || 'Remove failed');
                return;
              }
              location.reload();
            }
          } catch {
            showToast('Network error');
          }
        });
      </script>
      `
    )
  );
});

app.post("/cart/update", async (req, res) => {
  const sku = String(req.body.sku || "").trim();
  const qty = normalizeQuantity(req.body.qty);
  const products = await loadProducts();
  const product = products.find((p) => p.sku === sku);

  if (!product) {
    res.redirect("/cart");
    return;
  }

  if (qty > Number(product.stock)) {
    res.redirect("/cart?error=stock");
    return;
  }

  const cart = parseCartFromCookie(req);
  cart[sku] = qty;
  setCartCookie(res, cart);
  res.redirect("/cart");
});

app.post("/checkout", async (req, res) => {
  const products = await loadProducts();
  const cart = parseCartFromCookie(req);
  const items = Object.entries(cart).map(([sku, qty]) => ({ sku, qty }));
  const total = cartTotal(cart, products);

  if (items.length === 0) {
    res.redirect("/cart");
    return;
  }

  try {
    const pool = await ensureSqlPool();
    if (!pool) {
      for (const item of items) {
        const p = inMemoryProducts.find((x) => x.sku === item.sku);
        if (!p || Number(item.qty) > Number(p.stock)) {
          res.redirect("/cart?error=stock");
          return;
        }
      }
      for (const item of items) {
        const p = inMemoryProducts.find((x) => x.sku === item.sku);
        p.stock -= Number(item.qty);
      }
      inMemoryOrders.unshift({ items, total, createdAt: new Date().toISOString() });
      setCartCookie(res, {});
      res.redirect("/orders");
      return;
    }

    if (pool) {
      await ensureSchema(pool);
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        for (const item of items) {
          const stockCheck = await new sql.Request(tx)
            .input("Sku", sql.NVarChar(40), item.sku)
            .query(`SELECT Stock FROM dbo.Products WITH (UPDLOCK, ROWLOCK) WHERE Sku = @Sku`);
          const row = stockCheck.recordset?.[0];
          if (!row || Number(item.qty) > Number(row.Stock)) {
            await tx.rollback();
            res.redirect("/cart?error=stock");
            return;
          }
        }

        for (const item of items) {
          await new sql.Request(tx)
            .input("Sku", sql.NVarChar(40), item.sku)
            .input("Qty", sql.Int, Number(item.qty))
            .query(`UPDATE dbo.Products SET Stock = Stock - @Qty WHERE Sku = @Sku`);
        }

        await new sql.Request(tx)
          .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(items))
          .input("Total", sql.Int, total)
          .query(`INSERT INTO dbo.Orders (ItemsJson, Total) VALUES (@ItemsJson, @Total)`);

        await tx.commit();
      } catch (e) {
        try {
          await tx.rollback();
        } catch {}
        throw e;
      }

      setCartCookie(res, {});
      res.redirect("/orders");
    }
  } catch {
    inMemoryOrders.unshift({ items, total, createdAt: new Date().toISOString(), note: "sql failed" });
    setCartCookie(res, {});
    res.redirect("/orders");
  }
});

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.get("/orders", async (_req, res) => {
  try {
    const pool = await ensureSqlPool();
    if (pool) {
      await ensureSchema(pool);
      const result = await pool
        .request()
        .query(`SELECT TOP (20) Id, Total, ItemsJson, CreatedAt FROM dbo.Orders ORDER BY CreatedAt DESC`);

      const rows = result.recordset || [];
      res.send(
        page(
          "Orders",
          `
          <h1>Recent orders</h1>
          <p>Latest checkouts stored in Azure SQL (demo orders only).</p>
          <table>
            <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Time (UTC)</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (r) => {
                    let itemsText = "";
                    try {
                      const parsed = JSON.parse(String(r.ItemsJson || "[]"));
                      itemsText = parsed.map((x) => `${x.sku} x${x.qty}`).join(", ");
                    } catch {
                      itemsText = "n/a";
                    }
                    return `<tr><td>${Number(r.Id)}</td><td>${escapeHtml(itemsText)}</td><td>₱${Number(
                      r.Total
                    )}</td><td>${new Date(r.CreatedAt).toISOString()}</td></tr>`;
                  }
                )
                .join("")}
            </tbody>
          </table>
          <p style="margin-top:14px;"><a href="/">Back to catalog</a></p>
          `
        )
      );
      return;
    }
  } catch {
    // fall through
  }

  const rows = inMemoryOrders.slice(0, 20);
  res.send(
    page(
      "Orders",
      `
      <h1>Recent orders</h1>
      <p>Latest checkouts stored in memory (set SQL env vars to use Azure SQL).</p>
      <table>
        <thead><tr><th>#</th><th>Items</th><th>Total</th><th>Time (UTC)</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r, i) =>
                `<tr><td>${i + 1}</td><td>${escapeHtml(
                  r.items.map((x) => `${x.sku} x${x.qty}`).join(", ")
                )}</td><td>₱${Number(r.total)}</td><td>${escapeHtml(r.createdAt)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
      <p style="margin-top:14px;"><a href="/">Back to catalog</a></p>
      `
    )
  );
});

app.listen(PORT, () => {
  // Avoid noisy logs; App Service captures stdout anyway.
  console.log(`Listening on port ${PORT}`);
});

