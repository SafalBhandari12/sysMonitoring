import * as oidc from "openid-client";
import { config } from "./config.js";

const GOOGLE_ISSUER_URL = new URL("https://accounts.google.com");

export async function getOidConfig(): Promise<oidc.Configuration> {
  return oidc.discovery(
    GOOGLE_ISSUER_URL,
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
  );
}
