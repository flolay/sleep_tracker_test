# Sleep Analyzer

Track your child's sleep and predict when they'll be tired next, based on age-appropriate wake windows.

## Features

- Enter your child's birth date — age is computed automatically
- Log sleep start/end times with one tap
- Circular countdown timer shows time until next tired window
- Color-coded urgency (blue → amber → coral → red)
- Sleep history grouped by day with totals
- Built-in wake window reference table
- Works offline (PWA) — add to home screen on your phone
- Dark mode by default, auto light mode support

## Wake Windows

| Age | Wake Window | Naps/day |
|-----|------------|----------|
| 0–4 weeks | 30–60 min | 4–5 |
| 4–12 weeks | 60–90 min | 4–5 |
| 3–4 months | 75–120 min | 3–4 |
| 5–7 months | 2–3 hours | 2–3 |
| 7–10 months | 2.5–3.5 hours | 2–3 |
| 10–14 months | 3–4 hours | 1–2 |
| 14–24 months | 4–6 hours | 1 |
| 2–3 years | 5.5–6.5 hours | 0–1 |

## Running Locally

Just open `index.html` in your browser. No build step needed.

Or use any static server:
```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Go to Settings → Pages → Source: Deploy from branch `main`
3. Your app will be live at `https://<username>.github.io/sleep_analyzer/`

## Accessing from Your Phone

Once deployed to GitHub Pages:
1. Open the URL on your phone's browser
2. Tap "Add to Home Screen" (iOS Safari share menu / Android Chrome menu)
3. The app will work like a native app — full screen, offline capable

## Tech Stack

Vanilla HTML, CSS, JavaScript. No framework, no dependencies. Data stored in localStorage.
