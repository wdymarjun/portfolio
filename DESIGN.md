# DESIGN.md — Render reference analysis → portfolio port

Source: two screen recordings of render.com (V1: stack banner, V2: closing CTA) plus the gallery-chip screenshot.
Everything below was measured from the frames (OpenCV phase-correlation / template matching / high-pass grain σ), except rows marked *(my choice)*.

## 1. Design tokens observed

| Token | Reference (Render) | Portfolio (B&W port) |
|---|---|---|
| Page background | `#0c0c0c` (BGR 12,12,12) | `#0c0c0c` inside banner/CTA, `#000` elsewhere |
| Glow | violet, peak ≈ BGR(183,63,94) | luminance only — same shape, greyscale |
| Glow luma | mid ≈ 63, low ≈ 87 (0-255) | identical (see `bg-glow-*.jpg`) |
| Film grain | pixel-level luma noise, σ ≈ 6.4 (V1) / 7.7 (V2), lag-1 autocorrelation ≈ 0.22, none on flat dark | baked into JPEGs, σ 6.3 / 7.9 measured on output |
| Tile | ~44 px square on a 960 px-wide frame (≈ 72–88 px real), dark fill, 1 px hairline, white glyph | 72 px (banner) / 40–68 px fluid (CTA), radius 14, `rgba(0,0,0,.78)` |
| Headline | tight tracking, sentence case, white | Inter 500, `-0.045em`/`-0.05em` |
| CTA button | white pill, dark text, small chevron | existing `.btn-primary` pill + disc |

## 2. Animation specs

**V1 — stack banner**
- Two rows of tiles, moving in **opposite directions**, constant linear speed **24.5 px/s** (measured; ±24.49 px/s verified in the port).
- Left edge of the rows fades into the dark (mask gradient 0 → 14 %).
- Implementation: CSS `@keyframes` translate by one set width; duration = setWidth / 24.5; JS only clones sets and pauses the track off-screen. Disabled under `prefers-reduced-motion`.

**V2 — closing CTA**
- Tiles are **static**, scattered around the centred headline; there is **no parallax**, only normal page scroll.
- Heading + sub + button centred over the glow, glow brightest at the bottom.
- *(my choice)* tiles fade/rise in once, staggered 55 ms, when the stage enters view.

## 3. Where it was fixed in the portfolio

| Area | Before | After |
|---|---|---|
| Ticker strip | one thin row of text | `#ticker` → V1 banner, two counter-moving tile rows, same 8 discipline labels |
| `#contact` | big text + 4 cells | V2 stage: glow bg, static tiles, copy-email pill (`#copyEmailBtn`), LinkedIn/Unstop/GitHub cells kept below |
| Gallery chips (`.thumb`) | full pill (999 px) | radius = **75 % of a full pill**: `--chip-roundness: .75` × 22 px (half of the 44 px chip height) = 16.5 px |
| Zoom badge | square | round |

Tile glyphs (`Lu`, `C++`, `RE`, `O(n)`, `3D`, `CW`, `∑`, `SV`) are my own typographic abbreviations of the existing discipline labels — no third-party logos are reproduced.

## 4. Files
`bg-glow-banner.jpg`, `bg-glow-cta.jpg` (generated greyscale, grain baked in), `styles.css` (Stack banner / Contact / chip sections), `script.js` (section 4), `index.html`.
