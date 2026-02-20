import type { Request, Response } from "express";
import {
  apiDetailsSchema,
  domainSchema,
  uuidSchema,
} from "../schema/schema.js";
import ApiService from "../services/api.service.js";
class ApiController {
  static async addApi(req: Request, res: Response) {
    const paramsResult = await uuidSchema.parseAsync(req.params);
    const bodyResult = await apiDetailsSchema.parseAsync(req.body);
    const response = await ApiService.addApi({
      domainId: paramsResult.domainId,
      apiDetails: bodyResult,
    });
    return res.json({ msg: "Api Added Successfully", data: response });
  }
}
export default ApiController;
