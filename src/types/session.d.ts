import "express-session";

declare module "express-session" {
  interface SessionData {
    oidc?: {
      oidcState: string;
      oidcNonce: string;
      oidcCodeVerifier: string;
    };
    sessionId?: string;     
  }
}
