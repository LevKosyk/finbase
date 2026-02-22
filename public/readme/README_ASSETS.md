# README GIF Assets

This directory should contain demo GIFs referenced in the root `README.md`.

## Required Files

| File | Content | Target Size |
|---|---|---|
| `dashboard.gif` | Dashboard overview: KPI cards, chart, tasks, FOP health | < 2 MB |
| `documents.gif` | Document generation + PDF/XLSX export flow | < 2 MB |
| `statistics.gif` | Statistics page: charts, period comparison, AI insights | < 2 MB |
| `hero-logo.png` | Project logo icon (square, transparent background) | 160×160 px |

## Recording Instructions

### Option A: macOS (built-in)

1. Open the app at `http://localhost:3000/dashboard`
2. Use **Screenshot.app** → Record Selected Portion (⌘⇧5)
3. Record a 10–15 second walkthrough of each section
4. Convert `.mov` → `.gif` using:

```bash
# Install ffmpeg + gifsicle
brew install ffmpeg gifsicle

# Convert (adjust crop/fps as needed)
ffmpeg -i dashboard.mov -vf "fps=12,scale=800:-1:flags=lanczos" -c:v gif dashboard_raw.gif
gifsicle -O3 --lossy=80 dashboard_raw.gif -o dashboard.gif
```

### Option B: Chrome DevTools

1. Open DevTools → Performance tab → ⚙ → Enable screenshots
2. Record interaction, then export frames
3. Combine frames into GIF with ffmpeg (see above)

### Option C: Dedicated tools

- [Kap](https://getkap.co/) (macOS, free) — records directly to GIF
- [LICEcap](https://www.cockos.com/licecap/) (cross-platform)
- [ScreenToGif](https://www.screentogif.com/) (Windows)

## Quality Checklist

- [ ] GIFs loop seamlessly (or stop on last frame)
- [ ] No personal/real financial data visible
- [ ] Dark mode variant captured (optional)
- [ ] File size under 2 MB each (GitHub renders large GIFs poorly)
- [ ] Resolution: 800px wide minimum
