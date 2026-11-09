import { config } from '@/config';

import * as live from './live/coach';
import * as mock from './mock/coach';

/** The Coach calls the app makes: canned answers or the real service (EXPO_PUBLIC_DATA). */
export const coach: typeof mock = config.data === 'live' ? live : mock;
