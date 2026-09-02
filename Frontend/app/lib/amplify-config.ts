import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

/**
 * Amplify is always configured — even without env vars — so that the app
 * can boot without crashing. When env vars are present (production/staging),
 * Amplify uses cookieStorage so that Cognito sessions persist across
 * full-page navigations (window.location.href redirects).
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: userPoolId || "us-east-1_placeholder",
      userPoolClientId: userPoolClientId || "placeholder_client_id",
      loginWith: {
        email: true,
      },
      // Cookie storage makes tokens available immediately on next page load.
      // Without this, window.location.href clears in-memory tokens and the
      // dashboard's fetchAuthSession() returns nothing → redirects to login.
      ...(userPoolId && userPoolClientId
        ? {
            cookieStorage: {
              domain:
                typeof window !== "undefined"
                  ? window.location.hostname
                  : "localhost",
              path: "/",
              expires: 365,
              sameSite: "lax" as const,
              secure:
                typeof window !== "undefined" &&
                window.location.protocol === "https:",
            },
          }
        : {}),
    },
  },
});