"use strict";

const icons = {
  dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  book: '<path d="M4 5h16v14H4zM12 5v14M7 9h2m-2 3h2m-2 3h2m6-6h2m-2 3h2m-2 3h2"/>',
  receipt: '<path d="M6 4h12v17l-3-2-3 2-3-2-3 2V4Zm3 5h6m-6 4h6"/>',
  chart: '<path d="M4 4v16h16M8 15l4-5 4 2 4-6"/><circle cx="20" cy="6" r="1"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9a2.8 2.8 0 1 1 4.2 2.4c-1.1.6-1.5 1-1.5 2.1m0 2.7h.01"/>',
  user: '<circle cx="12" cy="8" r="3"/><path d="M6 19v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/>',
  "chevron-right": '<path d="m9 6 6 6-6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  zap: '<path d="m13.5 2.5-9 11H11l-.5 8 9-11H13l.5-8Z"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4m8-4v4M4 11h16m-12 4h2m4 0h2"/>',
  leaf: '<path d="M20 4c-1 5 0 10-4.5 13.3a6 6 0 0 1-8.4-8.4C10.4 4.5 15 5.5 20 4ZM4 20l9-9"/>',
  "arrow-right": '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  "arrow-up-right": '<path d="M6 18 18 6M9 6h9v9"/>',
  "arrow-down-right": '<path d="m6 6 12 12m-9 0h9V9"/>',
  "arrows": '<path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  check: '<path d="m5 12 4 4 10-10"/>'
};

function icon(name, sizeClass = "") {
  return `<span class="${sizeClass}" data-icon="${name}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" focusable="false">${icons[name] ?? ""}</svg></span>`;
}

function populateIcons(root) {
  root.querySelectorAll("[data-icon]:empty").forEach(element => {
    const svg = icon(element.dataset.icon);
    element.innerHTML = svg.slice(svg.indexOf("<svg"), svg.lastIndexOf("</span>"));
    element.setAttribute("aria-hidden", "true");
  });
}

const pages = {
  overview: "Market overview",
  markets: "Market products",
  book: "Order book",
  orders: "My demo orders",
  clearing: "Clearing results",
  guide: "Market guide"
};
const state = {
  route: "overview",
  product: "day",
  date: localDate(),
  hour: 18,
  chart: "price",
  orderFilter: "all",
  role: "buy"
};

const content = document.getElementById("content");
const sidebar = document.getElementById("navigation");
const menuToggle = document.getElementById("menu-toggle");
const backdrop = document.getElementById("mobile-backdrop");
const orderDialog = document.getElementById("order-dialog");
const orderForm = document.getElementById("order-form");
const cancelDialog = document.getElementById("cancel-dialog");
const storageKey = "lex-practice-orders-v1";
let chartCleanup;
let side = "buy";
let cancelId = null;
let memoryOrders;
let toastTimeout;

function newOrderButton(kind = "primary", label = "New demo order", extra = "") {
  return `<button class="button button-${kind}" type="button" data-new-order ${extra}>${icon("plus")}${label}</button>`;
}

function pageHeader(title, description, action = "") {
  return `<div class="page-head"><div><h1 tabindex="-1">${title}</h1><p>${description}</p></div>${action}</div>`;
}

function productButtons() {
  return `<div class="segment" aria-label="Market product">
    ${Object.entries(PRODUCTS).map(([id, product]) => `<button type="button" data-product-filter="${id}" aria-pressed="${id === state.product}">${icon(product.icon)}${product.name}</button>`).join("")}
  </div>`;
}

function hourOptions(selected, short = false) {
  return HOURS.map(hour => `<option value="${hour}" ${hour === selected ? "selected" : ""}>${short ? hourLabel(hour) : blockLabel(hour)}</option>`).join("");
}

function productOptions(selected) {
  return Object.entries(PRODUCTS).map(([id, product]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${product.name}</option>`).join("");
}

function marketFilters({ hour = false, product = true } = {}) {
  return `<div class="filters">
    ${product ? productButtons() : ""}
    <div class="filters-right">
      <div class="date-control">
        <label for="delivery-date">Delivery date</label>
        <span class="date-field"><input id="delivery-date" type="date" value="${state.date}" min="${DEMO_DATE_MIN}" max="${DEMO_DATE_MAX}" required></span>
      </div>
      ${hour ? `<div class="date-control"><label for="delivery-hour">Block</label><span class="select-wrap"><select id="delivery-hour">${hourOptions(state.hour)}</select>${icon("chevron-down")}</span></div>` : ""}
    </div>
  </div>`;
}

function metric({ label, value, unit, note = "", symbol, accent = "" }) {
  return `<article class="metric">
    ${icon(symbol, `metric-icon ${accent}`)}
    <p>${label}</p>
    <div class="metric-value"><strong>${value}</strong><span>${unit}</span></div>
    ${note ? `<div class="metric-note">${note}</div>` : ""}
  </article>`;
}

function dailyChange(now, prior) {
  const percent = fixed((now / prior - 1) * 100, 1);
  if (percent === 0) return "Same as previous day";
  const rising = percent > 0;
  return `<strong class="${rising ? "positive" : "negative"}">${icon(rising ? "arrow-up-right" : "arrow-down-right")}${rising ? "+" : "−"}${Math.abs(percent)}%</strong> vs previous day`;
}

function overviewMetrics(snapshot) {
  const prior = marketSnapshot(state.product, dateAt(state.date, -1));
  const metrics = [
    { label: "Avg. clearing price", value: rate.format(snapshot.average), unit: "LKR/kWh", note: dailyChange(snapshot.average, prior.average), symbol: "activity" },
    { label: "Energy cleared", value: whole.format(snapshot.cleared), unit: "MWh", note: dailyChange(snapshot.cleared, prior.cleared), symbol: "zap", accent: "gold" },
    { label: "Buy volume", value: whole.format(snapshot.demand), unit: "MWh", note: "Sample bids", symbol: "arrow-up-right", accent: "green" },
    { label: "Sell volume", value: whole.format(snapshot.supply), unit: "MWh", note: "Sample offers", symbol: "arrow-down-right", accent: "rose" }
  ];
  return `<div class="metrics" aria-label="Sample market indicators">${metrics.map(metric).join("")}</div>`;
}

function chartCard() {
  const price = state.chart === "price";
  const title = price ? "Clearing price" : "Cleared volume";
  const unit = price ? "LKR/kWh" : "MWh";
  return `<section class="card chart-card" aria-labelledby="chart-title">
    <div class="card-header">
      <div><h2 id="chart-title">${title}</h2><p>${PRODUCTS[state.product].name} · ${dateLabel(state.date)} · ${unit}</p></div>
      <div class="segment chart-modes" aria-label="Chart metric">
        <button type="button" data-chart="price" aria-pressed="${price}">Price</button>
        <button type="button" data-chart="volume" aria-pressed="${!price}">Volume</button>
      </div>
    </div>
    <div class="chart-wrap">
      <canvas id="market-chart" class="market-chart" tabindex="0" aria-label="${title} by hour. Use arrow keys to inspect delivery blocks.">${title} by hour</canvas>
      <div id="chart-tooltip" class="chart-tooltip" aria-hidden="true" hidden></div>
    </div>
    <div class="chart-footer">
      <span class="chart-legend"><span class="legend-dot ${price ? "" : "volume"}"></span>${title} · Sample data</span>
      <span class="chart-point" id="chart-point" aria-live="polite">Times in SLST</span>
    </div>
  </section>`;
}

function depthSide(levels, direction, expanded) {
  const label = direction === "buy" ? "Buy bids" : "Sell offers";
  const total = levels.at(-1).cumulative;
  return `<div class="depth-side ${direction}">
    <h3><span class="legend-dot"></span>${label}</h3>
    <table aria-label="${label}">
      <thead><tr><th scope="col">LKR/kWh</th><th scope="col">MWh</th>${expanded ? '<th scope="col">Cumulative</th>' : ""}</tr></thead>
      <tbody>
      ${levels.map(level => `<tr style="--depth:${fixed(level.cumulative / total * 100, 1)}%"><td>${rate.format(level.price)}</td><td>${volume.format(level.quantity)}</td>${expanded ? `<td>${volume.format(level.cumulative)} MWh</td>` : ""}</tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function depthGrid(book, expanded = false) {
  return `<div class="depth-grid">${depthSide(book.buy, "buy", expanded)}${depthSide(book.sell, "sell", expanded)}</div>`;
}

function orderBook(point) {
  const buy = depthLevels(point, "buy");
  const sell = depthLevels(point, "sell");
  return { buy, sell, spread: fixed(sell[0].price - buy[0].price) };
}

function bookCard(book) {
  return `<section class="card book-card" aria-labelledby="mini-book-title">
    <div class="card-header">
      <div class="book-title-row"><h2 id="mini-book-title">Order book</h2></div>
      <a class="text-link" href="#book">Full order book ${icon("arrow-up-right")}</a>
    </div>
    <div class="book-tools">
      <label for="book-hour">Delivery block</label>
      <span class="select-wrap"><select id="book-hour">${hourOptions(state.hour)}</select>${icon("chevron-down")}</span>
    </div>
    ${depthGrid(book)}
    <div class="spread"><span>Bid–offer spread</span><strong>${rate.format(book.spread)} LKR/kWh</strong></div>
  </section>`;
}

function marketCards(expanded) {
  const cards = Object.entries(PRODUCTS).map(([id, product]) => {
    const snapshot = expanded ? marketSnapshot(id, state.date) : null;
    return `<article class="card product">
      ${icon(product.icon, `product-icon ${product.accent}`)}
      <h3>${product.name}</h3>
      <p>${product.description} ${expanded ? product.detail : ""}</p>
      ${expanded ? `<div class="product-metrics"><p>Avg. clearing price <strong>${rate.format(snapshot.average)} LKR/kWh</strong></p><p>Energy cleared <strong>${whole.format(snapshot.cleared)} MWh</strong></p></div>` : ""}
      <a class="text-link" href="#book" data-open-product="${id}">Explore market ${icon("arrow-right")}</a>
    </article>`;
  });
  return `<div class="products-grid ${expanded ? "full" : "compact"}">${cards.join("")}</div>`;
}

function overview(snapshot) {
  return `<section class="hero" aria-labelledby="hero-title">
    <canvas id="exchange-grid" aria-hidden="true"></canvas>
    <div class="hero-copy">
      <p class="hero-kicker">${icon("zap")} Sri Lanka electricity markets</p>
      <h1 id="hero-title" tabindex="-1">Market overview</h1>
      <p>Explore sample electricity prices, volumes, bids and offers.</p>
    </div>
    ${newOrderButton("gold")}
  </section>
  ${marketFilters()}
  ${overviewMetrics(snapshot)}
  <div class="overview-grid">
    ${chartCard()}
    ${bookCard(orderBook(snapshot.points[state.hour]))}
  </div>
  <section aria-labelledby="products-heading">
    <div class="section-heading"><h2 id="products-heading">Market products</h2><a class="text-link" href="#markets">View all products ${icon("arrow-right")}</a></div>
    ${marketCards(false)}
  </section>`;
}

function bookPage(snapshot) {
  const book = orderBook(snapshot.points[state.hour]);
  const cards = [
    { label: "Best buy bid", value: rate.format(book.buy[0].price), unit: "LKR/kWh", symbol: "arrow-up-right", accent: "green", note: `${volume.format(book.buy[0].quantity)} MWh at this price` },
    { label: "Best sell offer", value: rate.format(book.sell[0].price), unit: "LKR/kWh", symbol: "arrow-down-right", accent: "rose", note: `${volume.format(book.sell[0].quantity)} MWh at this price` },
    { label: "Bid–offer spread", value: rate.format(book.spread), unit: "LKR/kWh", symbol: "arrows", note: "Best sell offer minus best buy bid" }
  ];
  return `${pageHeader("Order book", "Compare sample buy bids and sell offers for a one-hour delivery block.", newOrderButton())}
    ${marketFilters({ hour: true })}
    <div class="metrics metrics-three" aria-label="Sample order book indicators">${cards.map(metric).join("")}</div>
    <section class="card full-book" aria-labelledby="full-depth-title">
      <div class="card-header">
        <div><h2 id="full-depth-title">Market depth</h2><p>${PRODUCTS[state.product].name} · ${dateLabel(state.date)} · ${blockLabel(state.hour)} SLST</p></div>
        <a class="text-link" href="#clearing">Clearing example ${icon("arrow-right")}</a>
      </div>
      ${depthGrid(book, true)}
    </section>`;
}

function ordersFromBrowser() {
  if (memoryOrders) return memoryOrders;
  try {
    const orders = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(orders)) return [];
    return orders.filter(order => order && /^LEX-[0-9A-F]{8}$/.test(order.id)
      && (order.side === "buy" || order.side === "sell")
      && (order.status === "saved" || order.status === "canceled")
      && Object.hasOwn(PRODUCTS, order.product) && validDate(order.date) && HOURS.includes(order.hour)
      && Number.isFinite(order.price) && order.price >= .01 && order.price <= 1000
      && Number.isFinite(order.quantity) && order.quantity >= .01 && order.quantity <= 100000);
  } catch {
    return [];
  }
}

function storeOrders(orders) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(orders));
    memoryOrders = undefined;
  } catch {
    memoryOrders = orders;
  }
}

function ordersPage() {
  const all = ordersFromBrowser();
  const visible = state.orderFilter === "all" ? all : all.filter(order => order.status === state.orderFilter);
  const tabs = Object.entries({ all: "All", saved: "Saved", canceled: "Canceled" });
  const orderRows = visible.map(order => `<tr>
    <td><strong>${order.id}</strong></td>
    <td><span class="pill ${order.side}">${order.side === "buy" ? "Buy bid" : "Sell offer"}</span></td>
    <td>${PRODUCTS[order.product].name}</td>
    <td>${dateLabel(order.date)}<span class="order-subtext">${blockLabel(order.hour)} SLST</span></td>
    <td>${volume.format(order.quantity)} MWh</td>
    <td>${rate.format(order.price)} LKR/kWh</td>
    <td>${lkr(orderValue(order.quantity, order.price))}</td>
    <td><span class="pill ${order.status}">${order.status === "saved" ? "Saved" : "Canceled"}</span></td>
    <td>${order.status === "saved" ? `<button type="button" class="table-action" data-cancel-order="${order.id}" aria-label="Cancel demo order ${order.id}">Cancel</button>` : "—"}</td>
  </tr>`).join("");
  return `${pageHeader("My demo orders", memoryOrders ? "Practice bids and offers for this session. Browser storage is unavailable." : "Review the practice bids and offers saved in this browser.", newOrderButton())}
  <section class="card" aria-label="Your demo orders">
    <div class="orders-toolbar">
      <div class="segment" aria-label="Order status">
        ${tabs.map(([id, name]) => `<button type="button" data-order-filter="${id}" aria-pressed="${id === state.orderFilter}">${name}</button>`).join("")}
      </div>
      <p class="orders-count">${visible.length} ${visible.length === 1 ? "order" : "orders"}</p>
    </div>
    ${orderRows ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable demo order history"><table class="orders-table" aria-label="Demo orders">
      <thead><tr><th scope="col">Order ID</th><th scope="col">Side</th><th scope="col">Market</th><th scope="col">Delivery</th><th scope="col">Energy</th><th scope="col">Limit price</th><th scope="col">Est. value</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
      <tbody>${orderRows}</tbody></table></div>` : `<div class="empty-state">
       ${icon("receipt", "product-icon")}
       <h2>${all.length ? "No orders in this view" : "You haven’t placed a demo order"}</h2>
       <p>${all.length ? "Choose another status to view your practice orders." : "Enter a delivery block, energy quantity and limit price to practice placing an order."}</p>
       ${all.length ? "" : newOrderButton("secondary")}
    </div>`}
  </section>`;
}

function clearingPage(snapshot) {
  const point = snapshot.points[state.hour];
  const cards = [
    { label: "Clearing price", value: rate.format(point.price), unit: "LKR/kWh", symbol: "activity" },
    { label: "Matched energy", value: whole.format(point.cleared), unit: "MWh", symbol: "zap", accent: "gold" }
  ];
  const bars = [
    ["Buy demand", point.demand, "buy"],
    ["Sell supply", point.supply, "sell"],
    ["Matched energy", point.cleared, "matched"]
  ];
  const maximum = Math.max(point.demand, point.supply);
  return `${pageHeader("Clearing results", "See how a fictional auction settles on a price and matches energy for a delivery block.")}
  ${marketFilters({ hour: true })}
  <div class="metrics metrics-three" aria-label="Sample clearing results">
    ${cards.map(metric).join("")}
    ${metric({ label: "Illustrative trade value", value: whole.format(orderValue(point.cleared, point.price)), unit: "LKR", symbol: "receipt", accent: "green" })}
  </div>
  <div class="clearing-layout">
    <section class="card" aria-labelledby="clearing-volume-title">
      <div class="card-header">
        <div><h2 id="clearing-volume-title">Supply and demand</h2><p>${PRODUCTS[state.product].name} · ${dateLabel(state.date)} · ${blockLabel(state.hour)} SLST</p></div>
      </div>
      <div class="clearing-bars">
        ${bars.map(([label, value, color]) => `<div><div class="bar-label"><span>${label}</span><strong>${volume.format(value)} MWh</strong></div><div class="bar-track" aria-hidden="true"><span class="bar-fill ${color}" style="--bar-width:${fixed(value / maximum * 100, 2)}%"></span></div></div>`).join("")}
      </div>
    </section>
    <section class="card">
      <div class="card-header"><div><h2>How to read this result</h2><p>Example auction outcome</p></div></div>
      <div class="clearing-explainer">
        <p>Buyers bid for <strong>${whole.format(point.demand)} MWh</strong> and sellers offer <strong>${whole.format(point.supply)} MWh</strong> in this example.</p>
        <p>The auction matches <strong>${whole.format(point.cleared)} MWh</strong> of compatible bids and offers at <strong>${rate.format(point.price)} LKR/kWh</strong>.</p>
        <p class="info-strip">${icon("info")}<span>These results use a separate fictional auction. Practice orders appear in <a class="text-link" href="#orders">My demo orders</a>.</span></p>
      </div>
    </section>
  </div>`;
}

function guidePage() {
  const buyer = state.role === "buy";
  const steps = [
    ["Choose a market and delivery block", "Pick a market product, set the delivery date and choose the hour in Sri Lanka Standard Time."],
    [buyer ? "Set your buy bid" : "Set your sell offer", buyer
      ? "Enter the MWh you want to buy and the highest price in LKR/kWh you would pay."
      : "Enter the MWh you want to sell and the lowest price in LKR/kWh you would accept."],
    ["Save and review your demo order", "Check the estimated value, save the order and review or cancel it in My demo orders."],
    ["Explore a clearing example", "Open Clearing results to see a sample price and the amount of energy matched for a delivery block."]
  ];
  return `${pageHeader("Market guide", "Learn the basics of the LEX demo as a buyer or seller.")}
  <div class="clearing-layout guide-layout">
    <section class="card">
      <div class="card-header">
        <div><h2>Place a practice order</h2><p>Choose your role</p></div>
        <div class="segment"><button type="button" data-role-filter="buy" aria-pressed="${buyer}">Buyer</button><button type="button" data-role-filter="sell" aria-pressed="${!buyer}">Seller</button></div>
      </div>
      <div class="guide-steps">
        ${steps.map(([title, copy], index) => `<div class="guide-step"><span aria-hidden="true">${index + 1}</span><div><h3>${title}</h3><p>${copy}</p></div></div>`).join("")}
        <div class="guide-actions">
          ${newOrderButton("primary", buyer ? "Practice a buy bid" : "Practice a sell offer", `data-preset-side="${state.role}"`)}
          <a class="button button-secondary" href="#clearing">View clearing example ${icon("arrow-right")}</a>
        </div>
      </div>
    </section>
    <section class="card">
      <div class="card-header"><div><h2>Market terms</h2><p>Prices, quantities and delivery</p></div></div>
      <div class="faq">
        <details open><summary>What is a limit price?</summary><p>It’s the highest price a buyer is willing to pay, or the lowest price a seller is willing to accept.</p></details>
        <details><summary>What is the clearing price?</summary><p>It’s the price established by an auction for the energy matched between buyers and sellers.</p></details>
        <details><summary>How is order value estimated?</summary><p>One MWh equals 1,000 kWh. Multiply your quantity in MWh by 1,000, then multiply by the limit price in LKR/kWh.</p></details>
        <details><summary>What does 23:00–00:00 mean?</summary><p>Delivery starts at 23:00 on the selected day and ends at midnight Sri Lanka time.</p></details>
        <details><summary>Where are practice orders stored?</summary><p>The demo stores practice orders in this browser. It uses fictional market data and involves no payments or settlement.</p></details>
      </div>
    </section>
  </div>`;
}

function footer() {
  return `<footer class="site-footer"><p>${icon("info")} All market prices, volumes and orders are simulated.</p><span>Sri Lanka Standard Time · UTC+05:30</span></footer>`;
}

function render() {
  chartCleanup?.();
  chartCleanup = undefined;
  const snapshot = marketSnapshot(state.product, state.date);
  const views = {
    overview: () => overview(snapshot),
    markets: () => `${pageHeader("Market products", "Explore the three market products in the LEX demonstration.", newOrderButton())}${marketFilters({ product: false })}${marketCards(true)}`,
    book: () => bookPage(snapshot),
    orders: ordersPage,
    clearing: () => clearingPage(snapshot),
    guide: guidePage
  };
  content.innerHTML = views[state.route]() + footer();
  document.title = `${pages[state.route]} | Lanka Energy Exchange`;
  document.getElementById("location-current").textContent = pages[state.route];
  document.querySelectorAll("[data-route]").forEach(link => {
    if (link.dataset.route === state.route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (state.route === "overview") {
    const heroCanvas = document.getElementById("exchange-grid");
    drawExchangeGrid(heroCanvas);
    const heroObserver = new ResizeObserver(() => drawExchangeGrid(heroCanvas));
    heroObserver.observe(heroCanvas);
    const cleanup = attachMarketChart(
      document.getElementById("market-chart"),
      document.getElementById("chart-tooltip"),
      document.getElementById("chart-point"),
      snapshot.points,
      state.chart
    );
    chartCleanup = () => { cleanup(); heroObserver.disconnect(); };
  }
}

function setNavigation(open, returnFocus = false) {
  sidebar.classList.toggle("is-open", open);
  backdrop.hidden = !open;
  document.querySelector(".workspace").inert = open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  if (open) sidebar.querySelector('[aria-current="page"]')?.focus();
  if (returnFocus) menuToggle.focus();
}

function routeFromHash() {
  const hash = location.hash.slice(1);
  return Object.hasOwn(pages, hash) ? hash : "overview";
}

function changePage(focus = false) {
  if (focus && location.hash === "#content") return;
  state.route = routeFromHash();
  setNavigation(false);
  render();
  window.scrollTo(0, 0);
  if (focus) content.querySelector("h1")?.focus({ preventScroll: true });
}

function go(page) {
  if (location.hash === `#${page}`) changePage(true);
  else location.hash = page;
}

function setOrderSide(nextSide) {
  side = nextSide;
  orderDialog.querySelectorAll("[data-side]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.side === side));
  });
  document.getElementById("order-submit").innerHTML = `Save demo ${side === "buy" ? "bid" : "offer"} ${icon("arrow-right")}`;
}

function updateEstimate() {
  const { quantity, price } = orderForm.elements;
  document.getElementById("order-estimate").textContent = quantity.validity.valid && price.validity.valid
    ? lkr(orderValue(quantity.valueAsNumber, price.valueAsNumber)) : "—";
}

function openOrder(presetSide = "buy") {
  const field = orderForm.elements;
  field.market.innerHTML = productOptions(state.product);
  field.date.value = state.date;
  field.hour.innerHTML = hourOptions(state.hour);
  field.quantity.value = "10";
  field.price.value = marketSnapshot(state.product, state.date).points[state.hour].price.toFixed(2);
  setOrderSide(presetSide);
  updateEstimate();
  orderDialog.showModal();
  orderDialog.querySelector(`[data-side="${presetSide}"]`).focus();
}

function flash(message) {
  const toast = document.getElementById("toast");
  toast.hidden = false;
  toast.innerHTML = `${icon("check")}<span>${message}</span>`;
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toast.hidden = true; }, 4800);
}

document.addEventListener("click", event => {
  const action = event.target.closest("button, a");
  if (!action) return;
  const { dataset } = action;
  if (action.id === "menu-toggle") {
    setNavigation(!sidebar.classList.contains("is-open"));
  } else if (dataset.dismiss) {
    document.getElementById(dataset.dismiss).close();
  } else if (dataset.side) {
    setOrderSide(dataset.side);
  } else if (Object.hasOwn(dataset, "newOrder")) {
    openOrder(dataset.presetSide);
  } else if (dataset.cancelOrder) {
    cancelId = dataset.cancelOrder;
    document.getElementById("cancel-copy").textContent = `${cancelId} will appear as canceled in your demo order history.`;
    cancelDialog.returnValue = "";
    cancelDialog.showModal();
  } else if (dataset.openProduct) {
    event.preventDefault();
    state.product = dataset.openProduct;
    go("book");
  } else if (dataset.productFilter || dataset.chart || dataset.orderFilter || dataset.roleFilter) {
    if (dataset.productFilter) state.product = dataset.productFilter;
    if (dataset.chart) state.chart = dataset.chart;
    if (dataset.orderFilter) state.orderFilter = dataset.orderFilter;
    if (dataset.roleFilter) state.role = dataset.roleFilter;
    const selector = Object.entries(dataset).map(([key, value]) => `[data-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}="${value}"]`).join("");
    render();
    content.querySelector(selector)?.focus({ preventScroll: true });
  } else if (action.matches(".sidebar a")) {
    const current = sidebar.classList.contains("is-open") && action.hash === location.hash;
    setNavigation(false);
    if (current) content.querySelector("h1")?.focus({ preventScroll: true });
  }
});

content.addEventListener("change", event => {
  const field = event.target;
  if (field.id === "delivery-date") {
    if (validDate(field.value)) state.date = field.value;
    else field.value = state.date;
  } else if (field.id === "delivery-hour" || field.id === "book-hour") {
    const hour = Number(field.value);
    if (HOURS.includes(hour)) state.hour = hour;
  } else return;
  render();
  document.getElementById(field.id)?.focus({ preventScroll: true });
});

orderForm.addEventListener("input", updateEstimate);
orderForm.addEventListener("submit", event => {
  event.preventDefault();
  const field = orderForm.elements;
  const hour = Number(field.hour.value);
  if (!orderForm.reportValidity() || !validDate(field.date.value)
      || !Object.hasOwn(PRODUCTS, field.market.value) || !HOURS.includes(hour)) return;
  const orders = ordersFromBrowser();
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const id = `LEX-${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  const order = {
    id,
    side,
    product: field.market.value,
    date: field.date.value,
    hour,
    quantity: field.quantity.valueAsNumber,
    price: field.price.valueAsNumber,
    status: "saved"
  };
  storeOrders([order, ...orders]);
  state.orderFilter = "all";
  orderDialog.close();
  go("orders");
  flash(side === "buy" ? "Demo bid saved" : "Demo offer saved");
});

cancelDialog.addEventListener("close", () => {
  if (cancelDialog.returnValue === "cancel" && cancelId) {
    const orders = ordersFromBrowser();
    storeOrders(orders.map(order => order.id === cancelId ? { ...order, status: "canceled" } : order));
    render();
    content.querySelector('[data-order-filter][aria-pressed="true"]')?.focus({ preventScroll: true });
    flash("Demo order canceled");
  }
  cancelId = null;
});

window.addEventListener("hashchange", () => changePage(true));
window.addEventListener("storage", event => {
  if ((event.key === storageKey || event.key === null) && state.route === "orders" && !memoryOrders) render();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) setNavigation(false, true);
});
backdrop.addEventListener("click", () => setNavigation(false, true));
window.matchMedia("(min-width: 741px)").addEventListener("change", event => {
  if (event.matches) setNavigation(false);
});

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
});
function updateClock() {
  const date = new Date();
  const time = document.getElementById("local-clock");
  time.textContent = clock.format(date);
  time.dateTime = date.toISOString();
}

populateIcons(document);
changePage();
updateClock();
setInterval(updateClock, 1000);
