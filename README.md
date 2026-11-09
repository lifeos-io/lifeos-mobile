# lifeos-mobile

The Life OS mobile app: Expo (SDK 58) + React Native + TypeScript, Expo Router.
Design: the Figma file "Life OS — Yörünge (mobil)". The app is dark only, and its UI is in Turkish.

The app runs in one of two data modes, chosen by `EXPO_PUBLIC_DATA` in `.env` (copy `.env.example`):

- **mock** (default): the Figma scenario in memory (`src/api/mock/`), no backend, no sign-in.
- **live**: sign-in with Keycloak (authorization code + PKCE, public client `lifeos-mobile`), then Strategy and
  Coach through the gateway (`src/api/live/`). Tokens are kept in the device's secure store and refreshed before
  they expire; Kule reads Coach's answer as a server-sent event stream.

`src/api/strategy.ts` and `src/api/coach.ts` pick one of the two; both have the same functions and types, so the
screens do not know which one runs. `EXPO_PUBLIC_*` values are inlined into the bundle: restart Metro after
changing `.env`.

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

Metro listens on 8081 by default, which is also Strategy's port. When the backend runs on the same Mac, move
Metro: `LANG=en_US.UTF-8 npx expo run:ios --port 8090` (or `npx expo start --port 8090`).

Checks: `npm run typecheck`, `npm run lint`.

### Live mode against the local stack

1. Start the stack: `cd ../lifeos-infra/local && docker compose up -d` (PostgreSQL, Kafka, Redis, Keycloak).
2. Start the gateway (8080), Strategy (8081) and Coach (8082): `mvn spring-boot:run` in each repo, with JDK 25.
   Coach needs `OPENAI_API_KEY`; without a real key everything works except Kule's answers, which show an error.
3. Give the local user the Figma scenario: `scripts/seed-local.sh` (needs `jq`; user `onurcan` / `lifeos`).
4. Set `EXPO_PUBLIC_DATA=live` in `.env`, start the app and sign in as `onurcan` / `lifeos`.

`localhost` reaches the Mac from the iOS Simulator. On a phone, use the Mac's LAN address for both URLs, and
Keycloak must accept it as the issuer.

## Layout

```
src/app/            routes (Expo Router)
  (tabs)/           Görev (index), Uydular (ideas), Telemetri (evidence), Kule (coach)
  onboarding.tsx    route/ (index, edit, unknown)  week/ (index, step)  proposals/[id]  ideas/[id]  decisions/[id]
                    review/ (index, plan)
src/components/     the design system: Txt, Card, Pill, Button, Field, Chips/Toggle/Stepper, ProgressBar, ScreenHeader,
                    Screen, TabBar, icons
src/theme/          color tokens, text styles, spacing
src/api/            data access: strategy.ts/coach.ts pick mock/ or live/; types, hooks, the React Query client
src/auth/           Keycloak session (sign-in, refresh, sign-out) and the sign-in screen
src/config.ts       EXPO_PUBLIC_* settings
scripts/            seed-local.sh: the Figma scenario for the local user
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
