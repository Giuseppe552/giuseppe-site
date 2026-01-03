// src/lib/auth.ts
import Google from "next-auth/providers/google";

/**
 * We request Calendar scopes + offline access so we get a refresh_token.
 * Token fields are persisted in the JWT and rotated automatically.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // IMPORTANT: scopes & offline + consent to obtain refresh_token reliably
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
        },
      },
    }),
  ],

  session: { strategy: "jwt" as const },

  callbacks: {
    /** Persist tokens on first sign-in */
    async jwt({ token, account, profile }: {
      token: Record<string, any>;
      account?: { access_token?: string; refresh_token?: string; expires_at?: number } | null;
      profile?: { email?: string } | null;
    }) {
      // Initial sign-in
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token; // may be undefined if Google didn’t send (already granted)
        token.expires_at = account.expires_at ? account.expires_at * 1000 : Date.now() + 1000 * 60 * 50; // ms
      }
      if (profile && (profile as any).email) token.email = (profile as any).email;

      // Refresh if expired (1 min skew)
      const needsRefresh = token.expires_at && Date.now() > (token.expires_at as number) - 60_000;
      if (needsRefresh && token.refresh_token) {
        try {
          const refreshed = await refreshGoogleToken(String(token.refresh_token));
          token.access_token = refreshed.access_token;
          token.expires_at = Date.now() + refreshed.expires_in * 1000;
          if (refreshed.refresh_token) token.refresh_token = refreshed.refresh_token; // sometimes rotates
        } catch (e) {
          // If refresh fails, drop access so the client can re-auth
          delete token.access_token;
          delete token.expires_at;
          // keep refresh_token; user can try again
        }
      }

      return token;
    },

    async session({ session, token }: { session: any; token: Record<string, any> }) {
      // expose both snake_case and camelCase for convenience
      (session as any).access_token = token.access_token;
      (session as any).accessToken = token.access_token;
      (session as any).expires_at = token.expires_at;
      (session as any).expiresAt = token.expires_at;
      (session.user as any).email = token.email;
      return session;
    },
  },
};

/** Exchange refresh_token -> new access_token */
async function refreshGoogleToken(refresh_token: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh Google token: ${err}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  };
}
