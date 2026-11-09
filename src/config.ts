/**
 * Build-time settings (`EXPO_PUBLIC_*`, from `.env`; see `.env.example`).
 *
 * - `EXPO_PUBLIC_DATA`: `mock` (default) answers from the in-memory scenario, no backend or sign-in;
 *   `live` calls the services through the gateway as the signed-in user.
 * - `EXPO_PUBLIC_API_URL`: the gateway. The iOS Simulator reaches the Mac's localhost; a phone needs the Mac's
 *   LAN address, and Keycloak must then issue tokens for that same host.
 * - `EXPO_PUBLIC_AUTH_URL`: the Keycloak realm (the tokens' issuer).
 */
export const config = {
  data: process.env.EXPO_PUBLIC_DATA === 'live' ? ('live' as const) : ('mock' as const),
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  authUrl: process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:8180/realms/lifeos',
  /** Public client with PKCE in the realm (lifeos-infra/local/keycloak/realm-lifeos.json). */
  clientId: 'lifeos-mobile',
};
