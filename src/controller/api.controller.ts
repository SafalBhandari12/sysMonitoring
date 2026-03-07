import type { Request, Response } from "express";
import {
  apiDetailsSchema,
  domainSchema,
  uuidSchema,
} from "../schema/schema.js";
import ApiService from "../services/api.service.js";
class ApiController {
  static async addApi(req: Request, res: Response) {
    const domainId = await uuidSchema.parseAsync(req.params);
    const apiDetails = await apiDetailsSchema.parseAsync(req.body);
    const userId = req.session.sessionId!;
    const response = await ApiService.addApi({
      domainId: domainId.domainId,
      apiDetails: apiDetails,
      userId,
    });
    return res.json({ msg: "Api Added Successfully", data: response });
  }
}
export default ApiController;
