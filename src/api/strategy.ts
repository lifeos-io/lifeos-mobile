import { config } from '@/config';

import * as live from './live/strategy';
import * as mock from './mock/strategy';

export type { IdeaTransition } from './mock/strategy';

/** The Strategy calls the app makes: the in-memory scenario or the real service (EXPO_PUBLIC_DATA). */
export const strategy: typeof mock = config.data === 'live' ? live : mock;
