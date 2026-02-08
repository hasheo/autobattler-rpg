# Autobattler RPG (JavaScript)

A 10-day autobattler RPG simulation implemented in **JavaScript**.

## Features
- 10-day loop with preparation + battle phases per day.
- Daily income scales with level.
- Spend gold to level up or buy items.
- Inventory cap of 6 items.
- Item rarity + tier system.
- Automatic upgrades: buy 3 identical items of the same tier to create the next tier.
- Items grant stats and tier-based abilities.
- Automatic battle simulation.
- Fatigue phase after 3 minutes (180 seconds): both players take exponential damage (2, 4, 8, 16, ...).

## Run the game (Node.js)

```bash
npm start
```

## Test the code

```bash
npm test
```

Smoke tests currently verify:
- economy scaling (`incomeForLevel`, `levelUpCost`)
- item tier stat growth
- 3-copy upgrade rule for item tiers
- battle returns a valid winner value
- inventory cap constant is 6

## Try it online

This repo now includes a browser demo at `web/index.html`.

You can run it online in either of these ways:
- **GitHub Pages**: serve the repo (or just the `web/` folder) as static files, then open `web/index.html`.
- **StackBlitz / CodeSandbox**: import the repository URL and open `web/index.html`.

For local browser testing:

```bash
python3 -m http.server 8080
```

Then open: `http://localhost:8080/web/index.html`
