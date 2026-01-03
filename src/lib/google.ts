// src/lib/google.ts
import { google } from "googleapis";

/**
 * Create an authenticated Calendar client from an OAuth access_token.
 * (We don’t need to construct OAuth2Client here because we’re using a Bearer token.)
 */
export function getCalendar(accessToken: string) {
  const auth = new google.auth.OAuth2(); // stub; we’ll inject token manually
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}
