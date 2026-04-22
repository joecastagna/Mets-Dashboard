# Mets Command Center

A live, real-time New York Mets stats dashboard with 80+ metrics. Powered by the MLB Stats API.

## Live Dashboard

**[Open Dashboard](https://joecastagna.github.io/Mets-Dashboard/)**

> `https://joecastagna.github.io/Mets-Dashboard/`

Open that link in any browser — desktop, phone, or tablet. No login or install required.

---

## What It Shows

The dashboard has three modes that switch automatically based on game state:

**Live Game — Batting** (when the Mets are at bat)
- Current batter's AVG / OBP / SLG / OPS / wOBA / wRC+ / ISO / BABIP
- Statcast: Exit Velocity, Launch Angle, Barrel%, Hard Hit%
- xBA / xSLG / xwOBA, Sprint Speed, Pull/Center/Oppo%
- Live count, base runners, outs, run expectancy, leverage index
- Win probability chart, strike zone pitch map, spray chart

**Live Game — Pitching** (when the Mets are pitching)
- ERA / FIP / xFIP / SIERA / WHIP / K/9 / BB/9
- Stuff+ / Location+ / Pitching+
- Full pitch arsenal: velocity, spin rate, whiff%, usage%
- SwStr% / CSW% / Zone% / Chase% / Contact% / F-Strike%
- Live strike zone map and velocity trend

**Pre-Game** (before first pitch)
- Predicted win probability and run totals
- Starting pitcher matchup analysis
- Full projected lineup with advanced stats
- Head-to-head record, key batter vs. pitcher matchups
- Team radar chart comparison, park factor, weather

**Post-Game** (after the final out)
- Win probability timeline
- Full box score with WPA
- Key moments by inning
- Pitcher deep-dive and bullpen usage
- Last 10 games record, next game preview

---

## Running Locally

```bash
git clone https://github.com/joecastagna/Mets-Dashboard.git
cd Mets-Dashboard
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.
