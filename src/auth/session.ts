import {
  AuthRequest,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  makeRedirectUri,
  refreshAsync,
  type DiscoveryDocument,
} from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

import { config, type SignInProvider } from '@/config';

/**
 * The signed-in user's Keycloak tokens: authorization code flow with PKCE against the public client
 * `lifeos-mobile`, kept in the device's secure store and refreshed shortly before the access token expires.
 */

type Tokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Epoch milliseconds. */
  expiresAt: number;
};

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

const STORE_KEY = 'lifeos.tokens';
/** Refresh this long before the access token expires. */
const EXPIRY_MARGIN_MS = 30_000;

let tokens: Tokens | null = null;
let status: AuthStatus = 'loading';
let discovery: DiscoveryDocument | null = null;
let refreshing: Promise<string> | null = null;
const listeners = new Set<(status: AuthStatus) => void>();

function setStatus(next: AuthStatus) {
  status = next;
  listeners.forEach((listener) => listener(next));
}

export function getStatus(): AuthStatus {
  return status;
}

export function onStatusChange(listener: (status: AuthStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function getDiscovery(): Promise<DiscoveryDocument> {
  discovery ??= await fetchDiscoveryAsync(config.authUrl);
  return discovery;
}

async function store(next: Tokens | null) {
  tokens = next;
  if (next) {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next));
  } else {
    await SecureStore.deleteItemAsync(STORE_KEY);
  }
}

function fromResponse(response: {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}): Tokens {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    idToken: response.idToken,
    expiresAt: Date.now() + (response.expiresIn ?? 300) * 1000,
  };
}

/** Reads the stored session at start-up. */
export async function restore(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(STORE_KEY);
    tokens = saved ? (JSON.parse(saved) as Tokens) : null;
  } catch {
    tokens = null;
  }
  setStatus(tokens ? 'signedIn' : 'signedOut');
}

/**
 * Opens Keycloak's login page, or with a `provider` goes straight to that identity provider through Keycloak
 * (`kc_idp_hint`); resolves true once signed in, false when the user cancels.
 */
export async function signIn(provider?: SignInProvider): Promise<boolean> {
  const doc = await getDiscovery();
  const redirectUri = makeRedirectUri({ scheme: 'lifeos', path: 'auth' });
  const request = new AuthRequest({
    clientId: config.clientId,
    redirectUri,
    scopes: ['openid'],
    usePKCE: true,
    extraParams: provider ? { kc_idp_hint: provider } : undefined,
  });
  const result = await request.promptAsync(doc);
  if (result.type !== 'success') {
    return false;
  }
  const response = await exchangeCodeAsync(
    {
      clientId: config.clientId,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    doc,
  );
  await store(fromResponse(response));
  setStatus('signedIn');
  return true;
}

/** Ends the Keycloak session (best effort) and forgets the tokens. */
export async function signOut(): Promise<void> {
  const refreshToken = tokens?.refreshToken;
  await store(null);
  setStatus('signedOut');
  if (refreshToken) {
    try {
      const doc = await getDiscovery();
      if (doc.endSessionEndpoint) {
        await fetch(doc.endSessionEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `client_id=${encodeURIComponent(config.clientId)}&refresh_token=${encodeURIComponent(refreshToken)}`,
        });
      }
    } catch {
      // Signed out locally either way.
    }
  }
}

/**
 * A valid access token, refreshed when it is about to expire (or when `force`, after a 401). Throws when there is
 * no session left; the user is then signed out.
 */
export async function accessToken(force = false): Promise<string> {
  if (!tokens) {
    throw new Error('Not signed in.');
  }
  if (!force && tokens.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return tokens.accessToken;
  }
  refreshing ??= refresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function refresh(): Promise<string> {
  const refreshToken = tokens?.refreshToken;
  if (!refreshToken) {
    await signOut();
    throw new Error('Session expired.');
  }
  try {
    const response = await refreshAsync({ clientId: config.clientId, refreshToken }, await getDiscovery());
    // Keycloak may rotate the refresh token; keep the old one when it does not.
    await store(fromResponse({ ...response, refreshToken: response.refreshToken ?? refreshToken }));
    return tokens!.accessToken;
  } catch (e) {
    await signOut();
    throw e;
  }
}
