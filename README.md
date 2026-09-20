# Life OS

A private habit tracker, to-do list and journal. Mobile-first, built for Safari on iOS, installable to the Home Screen, and hosted as a static site. Nothing leaves the device: there is no account, no server and no analytics. All data lives in IndexedDB.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then emits dist/
npm run preview    # serve the production build
```

Node 20 or newer.

To try it on a real iPhone while developing, run `npm run dev` and open the network address Vite prints on a phone on the same Wi-Fi. Install it properly with Share → Add to Home Screen, which is when the standalone chrome, the status-bar treatment and the safe-area insets all come into play.

## Deploying to Cloudflare Pages

Free tier, static output, no build plugins needed.

1. Push this folder to a Git repository.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command `npm run build`, output directory `dist`, framework preset "None" (or Vite).
4. Deploy.

`public/_redirects` contains `/* /index.html 200`, which makes `/habits`, `/tasks` and the rest load directly instead of 404ing, since routing happens in the browser.

Or without Git:

```bash
npm run build
npx wrangler pages deploy dist
```

## Architecture

```
src/
├─ db/
│  ├─ db.ts              Dexie schema — the only file that defines tables
│  └─ DataService.ts     every read and write in the app goes through here
├─ types/index.ts        domain types
├─ lib/
│  ├─ date.ts            local-time date keys, formatting, time buckets
│  ├─ habits.ts          progress maths shared by the data layer and UI
│  ├─ haptics.ts         vibration + the spring presets used everywhere
│  ├─ download.ts        file export helpers
│  ├─ router.ts          ~40-line history router
│  └─ cn.ts              class joiner
├─ store/AppContext.tsx  Time Machine cursor, theme, settings
├─ components/
│  ├─ ui/                Pressable, Sheet, SwipeRow, Toggle, Stepper, TimeWheel, Card, Field
│  ├─ nav/               TabBar, DateStrip
│  ├─ widgets/           ActivityRings, StreakRail, PunctualityHeatmap, TimeOfDayChart, HabitTrend
│  └─ *.tsx              HabitRow, HabitEditor, HabitLogSheet, TaskRow, TaskEditor
└─ screens/              Dashboard, Habits, Tasks, Journal, Settings
```

**The DataService rule.** No component imports Dexie or `db`. Screens call `DataService.*` inside `useLiveQuery`, which still gets change tracking because Dexie observes the queries those functions run. Swapping the storage engine means rewriting one file.

### Data model

Six tables: `habits`, `habitEntries`, `tasks`, `journalTemplates`, `journalEntries`, `settings`. Compound indexes on `[habitId+date]` and `[templateId+date]` make "what happened on this day" a single indexed lookup, which is what the Time Machine leans on.

Dates are stored as local-time `YYYY-MM-DD` strings rather than timestamps, so a day never shifts under you when you travel or when the clock crosses midnight.

### Habit types

- **Binary** — one tap.
- **Stepper** — `+`/`−` through the day, against a daily goal.
- **Calculated** — you log a raw amount and the app stores what it converts to. 200 g of chicken at a factor of 0.31 becomes 62 g of protein. The derived value is written to the entry, so editing the factor later does not silently rewrite your history.

### Punctuality engine

Completing a task compares the moment you ticked it against its scheduled time and records `ontime`, `late` or `untimed` along with the signed delay, so the row can say "Done 42 mins late". The grace window is configurable in Settings and defaults to 5 minutes. An unfinished, scheduled task on a day that has passed reads as `missed`.

Backfilled days are judged against the end of that day rather than the current clock. Marking Tuesday's 9am task done on Thursday is recorded as late, because it was — the alternative would quietly launder old misses into wins.

### Export

- **System backup** — `.json` of every table, restorable from Settings.
- **Readable archive** — `.md` grouped by day, habits then tasks then journal, for reading anywhere.

## Notes

- Dark mode follows the system by default and can be pinned in Settings. Dark mode is true `#000` so OLED pixels switch off.
- `prefers-reduced-motion` is respected globally.
- The service worker (`public/sw.js`) caches the app shell so the installed app opens offline. It is registered in production builds only.
- Clearing Safari's website data erases everything. That is the trade for having no server — take a backup now and then.
