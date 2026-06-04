# Agent Instructions

## Lighthouse CI

```bash
npm run build && npm run lhci         # Run audits and check assertions
npm run lhci:results                  # Print performance scores from last run
```

Configures LHCI to run against `dist/` with assertions: performance ≥ 95, LCP < 1.5s.
Configuration in `.lighthouserc.cjs`. Key routes: `/`, `/portfolio`, `/projects/*`, `/personal`.

HTML reports are in `.lighthouseci/*.html` — open in a browser for full details.
