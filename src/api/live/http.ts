import { fetch as expoFetch } from 'expo/fetch';

import { accessToken } from '@/auth/session';
import { config } from '@/config';

import { ApiError } from '../types';

/**
 * Calls through the gateway as the signed-in user. A 401 gets one retry with a refreshed token; Strategy's and
 * Coach's problem details (`{code, detail, …}`) become ApiError.
 */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Options = {
  body?: unknown;
  /** Answer `null` for 404 instead of failing ("no current strategy yet"). */
  nullIf404?: boolean;
  signal?: AbortSignal;
  accept?: string;
};

/** A raw response (for streams); the status is checked and problems are thrown. */
export async function send(method: Method, path: string, options: Options = {}) {
  const attempt = async (force: boolean) => {
    let token: string;
    try {
      token = await accessToken(force);
    } catch {
      throw new ApiError('UNAUTHENTICATED', 'Sign in again.', 401);
    }
    try {
      return await expoFetch(`${config.apiUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: options.accept ?? 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch (e) {
      if (options.signal?.aborted) throw new ApiError('ABORTED', 'Stopped.');
      throw new ApiError('NETWORK', e instanceof Error ? e.message : 'The service could not be reached.');
    }
  };

  let response = await attempt(false);
  if (response.status === 401) {
    response = await attempt(true);
  }
  if (!response.ok) {
    throw await problem(response);
  }
  return response;
}

/** A JSON call. */
export async function request<T>(method: Method, path: string, options: Options = {}): Promise<T> {
  try {
    const response = await send(method, path, options);
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (e) {
    if (options.nullIf404 && e instanceof ApiError && e.status === 404) {
      return null as T;
    }
    throw e;
  }
}

async function problem(response: { status: number; text(): Promise<string> }): Promise<ApiError> {
  let body: { code?: string; detail?: string; title?: string } = {};
  try {
    body = JSON.parse(await response.text());
  } catch {
    // Not a problem detail (a proxy's page): keep the status.
  }
  const code = body.code ?? (response.status === 401 ? 'UNAUTHENTICATED' : `HTTP_${response.status}`);
  return new ApiError(code, body.detail ?? body.title ?? `HTTP ${response.status}`, response.status);
}

/** Path segments and query values, encoded. */
export const q = encodeURIComponent;
