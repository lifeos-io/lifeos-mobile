# lifeos-mobile

The Life OS mobile app: Expo (SDK 58) + React Native + TypeScript, Expo Router.
Design: the Figma file "Life OS — Yörünge (mobil)". The app is dark only, and its UI is in Turkish.

For now every screen runs on **mock data** (`src/api/mock/`). Connecting the app to the backend replaces the mock
answers in `src/api/` with calls through the gateway; the screens keep the same types.

## Run

Needs Node 22.13+ (`.nvmrc`), Xcode and CocoaPods. The app runs as a development build (`expo run:ios`), not in
Expo Go.

```bash
nvm use
npm install
LANG=en_US.UTF-8 npm run ios      # builds ios/ (generated, not in git), installs on a simulator, starts Metro
npm start                         # later runs: Metro only, the installed build reloads
```

CocoaPods fails with an encoding error unless the locale is UTF-8 (`LANG=en_US.UTF-8`).

Checks: `npm run typecheck`, `npm run lint`.

## Layout

```
src/app/            routes (Expo Router)
  (tabs)/           Görev (index), Uydular (ideas), Telemetri (evidence), Kule (coach)
  onboarding.tsx    route.tsx  proposals/[id]  ideas/[id]  decisions/[id]  review/ (index, plan)
src/components/     the design system: Txt, Card, Pill, Button, ProgressBar, ScreenHeader, Screen, TabBar, icons
src/theme/          color tokens, text styles, spacing
src/api/            data access (mock for now) and the React Query client
```

| Design word | Meaning | Backend |
| --- | --- | --- |
| Görev, varış noktası | goal | Strategy goal |
| Rota, aşama | strategy version, phases | Strategy |
| Rota düzeltmesi | change proposal | Strategy proposal / Coach recommendation |
| İtki, adım, yakıt | weekly plan, actions, capacity | Strategy weekly plan |
| Uydu | idea | Strategy idea |
| Manevra | decision | Strategy decision |
| Telemetri | evidence | Strategy evidence |
| Yer kontrolü | weekly review | Strategy weekly review |
| Kule | coach | Coach chat |

Fonts: the design's own families are unknown; Unbounded (display) and Manrope (body) stand in for them.
