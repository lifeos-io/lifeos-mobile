import { router, type Href } from 'expo-router';

/**
 * Back to the previous screen, or to `fallback` when there is none: a screen opened from a deep link or a
 * notification starts a stack of its own.
 */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
