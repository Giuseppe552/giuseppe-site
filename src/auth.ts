// src/auth.ts
// NextAuth v4-compatible auth() helper for App Router
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function auth() {
	// Wrap getServerSession so callers can simply await auth()
	return getServerSession(authOptions as NextAuthOptions);
}

// Optional: named re-exports if you need these elsewhere later
export type { NextAuthOptions };

// If you want to use route handlers via this file, you could also:
// export const { GET, POST } = handlers;
