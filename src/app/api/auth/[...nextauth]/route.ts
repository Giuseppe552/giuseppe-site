import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      const ownerEmail = process.env.OWNER_EMAIL;
      if (profile?.email && ownerEmail && profile.email === ownerEmail) {
        (token as any).role = "owner";
      }

      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).refreshToken = account.refresh_token;
        (token as any).expiresAt = (account.expires_at ?? 0) * 1000;
      }

      if ((token as any).expiresAt && Date.now() < (token as any).expiresAt - 60_000) {
        return token;
      }

      if ((token as any).refreshToken) {
        try {
          const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: String((token as any).refreshToken),
          });

          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          const refreshed = await res.json();
          if (!res.ok) throw refreshed;

          (token as any).accessToken = refreshed.access_token;
          (token as any).expiresAt = Date.now() + refreshed.expires_in * 1000;
          if (refreshed.refresh_token) {
            (token as any).refreshToken = refreshed.refresh_token;
          }
          return token;
        } catch {
          return { ...token, error: "RefreshAccessTokenError" as const };
        }
      }

      return { ...token, error: "NoRefreshToken" as const };
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).error = (token as any).error;
      (session as any).role = (token as any).role ?? "user";
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
