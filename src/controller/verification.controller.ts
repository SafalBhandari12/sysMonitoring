import type { Request, Response } from "express";
import { apiUrlSchema } from "../schema/api.schema.js";
import ApiService from "../services/api.service.js";
import prisma from "../utils/prisma.js";
import { NotFoundError } from "../lib/AppError.js";
import VerificationService from "../services/verification.service.js";

class VerificationController {
  static async verifyDomain(req: Request, res: Response) {
    const data = await apiUrlSchema.parseAsync(req.query);
    const result = await ApiService.verifyDomain(data.url);
    return res.json(result);
  }
  static async GetVerificationStatus(req: Request, res: Response) {
    const data = await apiUrlSchema.parseAsync(req.query);
    const { url } = data;
    const baseDomain = VerificationService.getBaseDomain(url);
    const api = await prisma.api.findUnique({
      where: { url: baseDomain },
      select: { verificationStatus: true, verificationCode: true },
    });
    if (!api) {
      throw new NotFoundError("API not found");
    }
    const domain = VerificationService.extractDomain(url);
    if (api.verificationStatus === "VERIFIED") {
      res.json({
        url: baseDomain,
        status: api.verificationStatus,
        domain,
        message: "Your domain is verified",
      });
    } else {
      res.json({
        url: baseDomain,
        status: api.verificationStatus,
        domain,
        method: "DNX TXT Record",
        instructions: [
          "1. Go to your domain's DNS provider (GoDaddy, Cloudflare, etc.)",
          "2. Add a new TXT record with these values:",
          `   - Name/Host: ${domain}`,
          `   - Value: monitoring-verify=${api.verificationCode}`,
          "3. Wait 5-30 minutes for DNS propagation",
          "4. Click 'Verify' button to confirm",
        ],
        recordName: domain,
        recordValue: `monitoring-verify=${api.verificationCode}`,
      });
    }
  }
}
export default VerificationController;
