import type { Request, Response } from "express";
import AuthService from "../services/auth.service.js";

class AuthController {
  static async googleLogin(req: Request, res: Response) {
    const { authUrl, oidcData } = await AuthService.initiateGoogleLogin();

    req.session.oidc = oidcData;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.redirect(authUrl);
  }

  static async googleCallback(req: Request, res: Response) {
    if (!req.session.oidc) {
      return res.status(400).json({ error: "Missing OIDC session data" });
    }

    const currentUrl = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get("host")}`,
    );

    const userData = await AuthService.handleGoogleCallback(
      currentUrl.toString(),
      req.session.oidc,
    );

    req.session.sessionId = userData.userId;
    delete req.session.oidc;

    res.json({
      msg: "Login successful",
      user: {
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
      },
    });
  }

  static async getProfile(req: Request, res: Response) {
    const userProfile = await AuthService.getUserProfile(
      req.session.sessionId!,
    );
    return res.json(userProfile);
  }
}

export default AuthController;
