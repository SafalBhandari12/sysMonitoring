import type { Request, Response } from "express";
import { apiDetailsSchema, domainSchema } from "../schema/api.schema.js";
import DomainService from "../services/domain.service.js";

class DomainController {
  static async registerDomain(req: Request, res: Response) {
    const data = await domainSchema.parseAsync(req.body);

    const response = await DomainService.registerDomain(data.domain);
    res.json(response);
  }
  static async verifyDomain(req: Request, res: Response) {
    const data = await domainSchema.parseAsync(req.query);
    console.log("Verifying domain:", data.domain);
    const result = await DomainService.verifyDomain(data.domain);
    return res.json(result);
  }
  static async GetVerificationStatus(req: Request, res: Response) {
    const data = await domainSchema.parseAsync(req.query);
    const response = await DomainService.getVerificationStatus(data.domain);
    return res.json(response);
  }
}
export default DomainController;
