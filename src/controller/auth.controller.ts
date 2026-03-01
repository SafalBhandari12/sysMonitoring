import type { Request, Response } from "express";
import * as oidc from "openid-client";
import { getOidConfig } from "../utils/openId.js";
import { config } from "../utils/config.js";
import prisma from "../utils/prisma.js";

class AuthController {
  static async googleLogin(req: Request, res: Response) {
    const oidConfig = await getOidConfig();

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();

    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    req.session.oidc = {
      oidcState: state,
      oidcNonce: nonce,
      oidcCodeVerifier: codeVerifier,
    };

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const authUrl = oidc.buildAuthorizationUrl(oidConfig, {
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(authUrl.href);
  }
  static async googleCallback(req: Request, res: Response) {
    const oidcConfig = await getOidConfig();

    if (!req.session.oidc) {
      return res.status(400).json({ error: "Missing OIDC session data" });
    }
    const { oidcCodeVerifier, oidcNonce, oidcState } = req.session.oidc;
    console.log("OIDC Session Data:", req.session.oidc);

    const currentUrl = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get("host")}`,
    );
    const tokens = await oidc.authorizationCodeGrant(oidcConfig, currentUrl, {
      pkceCodeVerifier: oidcCodeVerifier,
      expectedNonce: oidcNonce,
      expectedState: oidcState,
    });
    const userInfo = await oidc.fetchUserInfo(
      oidcConfig,
      tokens.access_token,
      tokens.claims()!.sub,
    );

    const user = await prisma.user.upsert({
      where: { email: userInfo.email! },
      update: {
        name: userInfo.name ?? null,
        avatarUrl: userInfo.profile ?? null,
      },
      create: {
        email: userInfo.email!,
        name: userInfo.name ?? null,
        avatarUrl: userInfo.profile ?? null,
      },
    });

    req.session.sessionId = user.id;
    delete req.session.oidc;

    res.redirect("/dashboard");
  }
}

export default AuthController;
