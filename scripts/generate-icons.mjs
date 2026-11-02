// Generates placeholder PNG icons from inline SVG. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const face = (pad) => `
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <ellipse cx="256" cy="286" rx="170" ry="158" fill="#fff"/>
    <ellipse cx="190" cy="40" rx="0" ry="0"/>
    <circle cx="200" cy="270" r="20" fill="#3b2f3f"/><circle cx="312" cy="270" r="20" fill="#3b2f3f"/>
    <circle cx="206" cy="263" r="6" fill="#fff"/><circle cx="318" cy="263" r="6" fill="#fff"/>
    <ellipse cx="160" cy="312" rx="26" ry="16" fill="#b5dcff"/><ellipse cx="352" cy="312" rx="26" ry="16" fill="#b5dcff"/>
    <path d="M222 318 Q256 356 290 318" stroke="#3b2f3f" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M256 130 q-14 -50 18 -70 q4 40 -18 70z" fill="#8be28b"/>
  </g>`;
const svg = (pad, round) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fc4ff"/><stop offset="1" stop-color="#3d9be9"/></linearGradient></defs>
  <rect width="512" height="512" ${round ? 'rx="112"' : ""} fill="url(#g)"/>${face(pad)}</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", svg(0, true));
const out = async (name, size, pad, round) => sharp(Buffer.from(svg(pad, round))).resize(size, size).png().toFile(`public/icons/${name}`);
await out("icon-192.png", 192, 0, true);
await out("icon-512.png", 512, 0, true);
await out("maskable-512.png", 512, 70, false); // safe-zone padding, full-bleed bg
await out("apple-touch-icon.png", 180, 0, false); // iOS applies its own mask
console.log("icons generated");
