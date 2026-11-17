"use strict";

function fitCanvas(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return null;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function drawExchangeGrid(canvas) {
  const surface = fitCanvas(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const sx = width / 670;
  const sy = height / 166;
  ctx.scale(sx, sy);

  const fade = ctx.createLinearGradient(0, 0, 670, 0);
  fade.addColorStop(0, "rgba(255, 210, 155, 0)");
  fade.addColorStop(.35, "rgba(255, 210, 155, .09)");
  fade.addColorStop(1, "rgba(255, 210, 155, .2)");
  ctx.strokeStyle = fade;
  ctx.lineWidth = .7;
  for (let x = 17; x <= 670; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 166);
    ctx.stroke();
  }
  for (let y = 10; y <= 166; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(670, y);
    ctx.stroke();
  }

  const trace = (vertices, color, weight = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.beginPath();
    vertices.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  };

  const tower = (x, ground, size, opacity) => {
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(size, size);
    ctx.globalAlpha = opacity;
    const gold = "#ffcd89";
    const steel = "#ffb577";
    trace([[-28, 0], [-16, -40], [-9, -96], [0, -121], [9, -96], [16, -40], [28, 0]], gold, 1.16);
    trace([[-28, 0], [16, -40], [-16, -40], [12, -65], [-12, -65], [9, -96], [-9, -96], [0, -112], [9, -96]], steel, .8);
    trace([[28, 0], [-16, -40], [12, -65], [-9, -96]], steel, .8);
    trace([[-32, -79], [-13, -89], [13, -89], [32, -79], [-32, -79]], gold);
    trace([[-39, -51], [-16, -61], [16, -61], [39, -51], [-39, -51]], gold);
    trace([[-31, -79], [-31, -72]], gold);
    trace([[31, -79], [31, -72]], gold);
    trace([[-38, -51], [-38, -43]], gold);
    trace([[38, -51], [38, -43]], gold);
    ctx.restore();
  };

  ctx.strokeStyle = "rgba(255, 193, 129, .31)";
  ctx.lineWidth = .85;
  for (const lift of [0, 10, 24]) {
    ctx.beginPath();
    ctx.moveTo(177, 103 + lift);
    ctx.bezierCurveTo(251, 110 + lift, 311, 111 + lift, 405, 65 + lift);
    ctx.bezierCurveTo(486, 114 + lift, 520, 115 + lift, 588, 96 + lift);
    ctx.bezierCurveTo(620, 108 + lift, 652, 114 + lift, 680, 106 + lift);
    ctx.stroke();
  }
  tower(196, 165, .38, .25);
  tower(446, 158, 1.16, .67);
  tower(593, 162, .61, .45);

  trace([[207, 147], [256, 112], [299, 112], [323, 91], [359, 91]], "rgba(247, 176, 111, .32)", 1);
  trace([[322, 124], [357, 107], [380, 107], [415, 65], [455, 65], [499, 30], [531, 30], [548, 16], [617, 16]], "rgba(255, 199, 135, .4)", 1.15);
  trace([[489, 122], [529, 94], [567, 94], [600, 69], [637, 69], [668, 45]], "rgba(255, 199, 135, .44)", 1);
  for (const [x, y] of [[256, 112], [323, 91], [415, 65], [499, 30], [548, 16], [600, 69], [637, 69]]) {
    ctx.fillStyle = "rgba(255, 208, 148, .65)";
    ctx.beginPath();
    ctx.arc(x, y, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function attachMarketChart(canvas, tooltip, pointText, points, mode) {
  const isPrice = mode === "price";
  const key = isPrice ? "price" : "cleared";
  const accent = isPrice ? "#9c3f61" : "#a76519";
  const rgb = isPrice ? "156, 63, 97" : "167, 101, 25";
  const values = points.map(point => point[key]);
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const step = isPrice ? 6 : 20;
  const low = isPrice ? Math.floor((minimum - 1) / step) * step : 0;
  const high = Math.ceil((maximum + step / 4) / step) * step;
  let hovered = null;
  let plot;

  const describe = index => {
    const value = isPrice ? `${rate.format(values[index])} LKR/kWh` : `${volume.format(values[index])} MWh`;
    return { block: blockLabel(index), value };
  };
  const draw = () => {
    const surface = fitCanvas(canvas);
    if (!surface) return;
    const { ctx, width, height } = surface;
    const left = 31;
    const right = width - 9;
    const top = 13;
    const bottom = height - 26;
    const toX = index => left + index / (values.length - 1) * (right - left);
    const toY = value => bottom - (value - low) / (high - low) * (bottom - top);
    plot = { left, right, toX, width };
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#756674";
    for (let label = low; label <= high; label += step) {
      const y = toY(label);
      ctx.strokeStyle = label === low ? "#e6dbe3" : "#eee7ec";
      ctx.setLineDash(label === low ? [] : [3, 4]);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.fillText(String(label), 1, y);
    }
    ctx.setLineDash([]);
    const indices = width > 395 ? [0, 4, 8, 12, 16, 20, 23] : [0, 6, 12, 18, 23];
    indices.forEach((index, position) => {
      ctx.textAlign = position === 0 ? "left" : position === indices.length - 1 ? "right" : "center";
      ctx.fillText(hourLabel(index), toX(index), bottom + 15);
    });

    if (isPrice) {
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, `rgba(${rgb}, .24)`);
      gradient.addColorStop(1, `rgba(${rgb}, .015)`);
      ctx.beginPath();
      values.forEach((value, index) => index ? ctx.lineTo(toX(index), toY(value)) : ctx.moveTo(toX(index), toY(value)));
      const line = new Path2D();
      values.forEach((value, index) => index ? line.lineTo(toX(index), toY(value)) : line.moveTo(toX(index), toY(value)));
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.35;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(line);
    } else {
      const barWidth = Math.max(3, (right - left) / values.length * .66);
      values.forEach((value, index) => {
        const x = Math.max(left, Math.min(right - barWidth, toX(index) - barWidth / 2));
        ctx.fillStyle = index === hovered ? accent : `rgba(${rgb}, .55)`;
        ctx.beginPath();
        ctx.roundRect(x, toY(value), barWidth, bottom - toY(value), [3, 3, 0, 0]);
        ctx.fill();
      });
    }

    if (hovered === null) return;
    const x = toX(hovered);
    const y = toY(values[hovered]);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `rgba(${rgb}, .6)`;
    ctx.lineWidth = 1;
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, 4.4, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const select = index => {
    if (hovered === index || !plot) return;
    hovered = index;
    draw();
    const summary = describe(index);
    tooltip.replaceChildren();
    const block = document.createElement("strong");
    block.textContent = summary.block;
    tooltip.append(block, summary.value);
    tooltip.style.left = `${Math.min(plot.width - 112, Math.max(6, plot.toX(index) + 14))}px`;
    tooltip.hidden = false;
    pointText.textContent = `${summary.block} · ${summary.value}`;
  };

  const reset = () => {
    tooltip.hidden = true;
    hovered = null;
    draw();
  };

  canvas.addEventListener("pointermove", event => {
    if (!plot || event.pointerType === "touch") return;
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const index = Math.round((x - plot.left) / (plot.right - plot.left) * (points.length - 1));
    select(Math.max(0, Math.min(points.length - 1, index)));
  });
  canvas.addEventListener("pointerleave", reset);
  canvas.addEventListener("blur", reset);
  canvas.addEventListener("keydown", event => {
    const shifts = { ArrowLeft: -1, ArrowRight: 1 };
    let next = (hovered ?? 0) + (shifts[event.key] ?? 0);
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = points.length - 1;
    else if (!(event.key in shifts)) return;
    event.preventDefault();
    select(Math.max(0, Math.min(points.length - 1, next)));
  });
  canvas.addEventListener("click", event => {
    if (!plot) return;
    const position = event.clientX - canvas.getBoundingClientRect().left;
    select(Math.max(0, Math.min(points.length - 1, Math.round((position - plot.left) / (plot.right - plot.left) * (points.length - 1)))));
  });

  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  draw();
  return () => observer.disconnect();
}
