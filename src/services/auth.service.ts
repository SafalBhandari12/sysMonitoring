import * as oidc from "openid-client";
import { getOidConfig } from "../utils/openId.js";
import { config } from "../utils/config.js";
import prisma from "../utils/prisma.js";

class AuthService {
  static async initiateGoogleLogin() {
    const oidConfig = await getOidConfig();

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();

    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const oidcData = {
      oidcState: state,
      oidcNonce: nonce,
      oidcCodeVerifier: codeVerifier,
    };

    const authUrl = oidc.buildAuthorizationUrl(oidConfig, {
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      authUrl: authUrl.href,
      oidcData,
    };
  }

  static async handleGoogleCallback(
    callbackUrl: string,
    oidcSessionData: {
      oidcCodeVerifier: string;
      oidcNonce: string;
      oidcState: string;
    },
  ) {
    const oidcConfig = await getOidConfig();

    const currentUrl = new URL(callbackUrl);
    const tokens = await oidc.authorizationCodeGrant(oidcConfig, currentUrl, {
      pkceCodeVerifier: oidcSessionData.oidcCodeVerifier,
      expectedNonce: oidcSessionData.oidcNonce,
      expectedState: oidcSessionData.oidcState,
    });

    const userInfo = await oidc.fetchUserInfo(
      oidcConfig,
      tokens.access_token,
      tokens.claims()!.sub,
    );

    console.log("User Info:", userInfo);

    const user = await prisma.user.upsert({
      where: { email: userInfo.email! },
      update: {
        name: userInfo.name ?? null,
        avatarUrl: userInfo.picture ?? null,
      },
      create: {
        email: userInfo.email!,
        name: userInfo.name ?? null,
        avatarUrl: userInfo.picture ?? null,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return {
      email: user?.email,
      name: user?.name,
      avatarUrl: user?.avatarUrl,
    };
  }
}

export default AuthService;
