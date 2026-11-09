import { useEffect, useSyncExternalStore } from 'react';

import { config } from '@/config';

import { getStatus, onStatusChange, restore, type AuthStatus } from './session';

let restoring: Promise<void> | null = null;

/** Where the user stands; the mock needs no sign-in and is always signed in. */
export function useAuthStatus(): AuthStatus {
  const live = config.data === 'live';
  const status = useSyncExternalStore(onStatusChange, getStatus);
  useEffect(() => {
    if (live) restoring ??= restore();
  }, [live]);
  return live ? status : 'signedIn';
}
