import { Redirect } from 'expo-router';

/**
 * Keycloak's redirect (lifeos://auth). The login sheet normally takes it before the router sees it; if a link
 * opens it anyway, it leads home.
 */
export default function AuthRedirect() {
  return <Redirect href="/" />;
}
