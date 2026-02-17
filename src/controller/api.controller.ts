import type { Request, Response } from "express";
import { apiDetailsSchema, apiUrlSchema } from "../schema/api.schema.js";
import ApiService from "../services/api.service.js";
import { UNPROCESSABLE_ENTITY } from "../lib/AppError.js";

class ApiController {
  static async RegisterApi(req: Request, res: Response) {
    const data = await apiDetailsSchema.parseAsync(req.body);

    const response = await ApiService.RegisterApi(data);
    res.json(response);
  }

  static async getDetails(req: Request, res: Response) {
    const data = await apiUrlSchema.parseAsync(req.query);

    const details = await ApiService.GetDetails(data.url);
    res.json(details);
  }
}
export default ApiController;