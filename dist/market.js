"use strict";

const PRODUCTS = {
  day: {
    name: "Day-ahead",
    description: "Schedule electricity for hourly blocks on the next delivery day.",
    detail: "The demo represents an auction held ahead of the delivery day.",
    icon: "calendar",
    accent: "gold",
    priceOffset: 0,
    volumeFactor: 1
  },
  intra: {
    name: "Intraday",
    description: "Explore electricity bids and offers for same-day delivery.",
    detail: "The demo shows how participants could adjust their positions within the delivery day.",
    icon: "activity",
    accent: "",
    priceOffset: 2.1,
    volumeFactor: 0.5
  },
  green: {
    name: "Green energy",
    description: "Explore sample electricity offers from renewable generators.",
    detail: "The demo uses wind, solar and hydro profiles to illustrate renewable supply.",
    icon: "leaf",
    accent: "green",
    priceOffset: -2.4,
    volumeFactor: 0.61
  }
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DEMO_DATE_MIN = "2020-01-01";
const DEMO_DATE_MAX = "2100-12-31";
const TIME_ZONE = "Asia/Colombo";
const DAY_MS = 86_400_000;
const priceCurve = [26.5, 25.2, 24.2, 24.8, 24.3, 25.9, 29.7, 31.1, 30.2, 32.2, 31.7, 30.3, 28.0, 28.9, 29.5, 31.6, 33.1, 37.3, 40.6, 42.1, 39.4, 35.1, 32.4, 28.8];
const demandCurve = [44, 42, 37, 35, 37, 45, 58, 68, 73, 68, 63, 58, 53, 55, 56, 60, 66, 77, 88, 91, 85, 73, 61, 49];
const supplyCurve = [42, 39, 39, 41, 40, 43, 52, 61, 69, 72, 74, 78, 74, 74, 71, 66, 61, 62, 70, 71, 65, 62, 56, 47];

const whole = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });
const volume = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 });
const rate = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const calendarDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
});
const displayDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC", day: "numeric", month: "short", year: "numeric"
});

function localDate() {
  const parts = Object.fromEntries(calendarDate.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateAt(date, offset = 0) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

function validDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || date < DEMO_DATE_MIN || date > DEMO_DATE_MAX || !Number.isFinite(Date.parse(date))) return false;
  return dateAt(date) === date;
}

function dateLabel(date) {
  return displayDate.format(new Date(`${date}T12:00:00Z`));
}

function hourLabel(hour) {
  return `${String(hour % 24).padStart(2, "0")}:00`;
}

function blockLabel(hour) {
  return `${hourLabel(hour)}–${hourLabel(hour + 1)}`;
}

function fixed(number, places = 2) {
  return Number(number.toFixed(places));
}

function seededNoise(seed) {
  const wave = Math.sin(seed * 12.9898 + 64.442) * 43758.5453;
  return wave - Math.floor(wave);
}

function marketSnapshot(product, date) {
  const config = PRODUCTS[product];
  const seed = Math.floor(Date.parse(date) / DAY_MS);
  const dayPrice = (seededNoise(seed * 1.73) - .52) * 2.2;
  const dayVolume = .94 + seededNoise(seed * 2.13) * .12;
  const points = HOURS.map(hour => {
    const sunProfile = hour >= 6 && hour <= 18 ? Math.sin((hour - 6) / 12 * Math.PI) : 0;
    const noise = seededNoise(seed * 23 + hour * 71 + config.priceOffset * 111);
    const demand = Math.max(1, Math.round((demandCurve[hour] + (noise - .5) * 6) * config.volumeFactor * dayVolume));
    const supplyFactor = product === "green" ? .77 + sunProfile * .5 : 1;
    const supply = Math.max(1, Math.round((supplyCurve[hour] + (.5 - noise) * 7) * config.volumeFactor * dayVolume * supplyFactor));
    const cleared = Math.max(1, Math.round(Math.min(demand, supply) * (.89 + noise * .1)));
    const middayDiscount = product === "green" ? sunProfile * 2.8 : 0;
    const price = fixed(priceCurve[hour] + config.priceOffset + dayPrice + (noise - .5) * 1.1 - middayDiscount);
    return { hour, price, demand, supply, cleared, noise };
  });

  const sum = key => points.reduce((total, point) => total + point[key], 0);
  return {
    points,
    average: fixed(sum("price") / points.length),
    cleared: sum("cleared"),
    demand: sum("demand"),
    supply: sum("supply")
  };
}

function depthLevels(point, side) {
  const weights = [.19, .17, .15, .14, .115, .095, .08, .06];
  const total = side === "buy" ? point.demand : point.supply;
  const direction = side === "buy" ? -1 : 1;
  const firstOffset = side === "buy" ? .15 + .3 * point.noise : .18 + .22 * point.noise;
  let remaining = total;

  return weights.map((weight, index) => {
    const quantity = index === weights.length - 1 ? remaining : fixed(total * weight, 1);
    remaining = fixed(remaining - quantity, 1);
    const price = fixed(point.price + direction * (firstOffset + index * (.19 + point.noise * .07)));
    return { price, quantity, cumulative: fixed(total - remaining, 1) };
  });
}

function orderValue(quantity, price) {
  return fixed(quantity * 1000 * price);
}

function lkr(amount) {
  return `LKR ${volume.format(amount)}`;
}
