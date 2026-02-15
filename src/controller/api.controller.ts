import type { Request, Response } from "express";
import { apiDetailsSchema, apiSchema } from "../schema/api.schema.js";
import ApiService from "../services/api.service.js";
import { UNPROCESSABLE_ENTITY } from "../lib/AppError.js";

class ApiController {
  static async RegisterApi(req: Request, res: Response) {
    const data = apiSchema.safeParse(req.body);
    if (!data.success) {
      throw new UNPROCESSABLE_ENTITY(JSON.stringify(data.error.issues));
    }
    const response = await ApiService.RegisterApi(data.data);
    res.json(response);
  }

  static async getDetails(req: Request, res: Response) {
    const data = apiDetailsSchema.safeParse(req.query);
    if (!data.success) {
      throw new UNPROCESSABLE_ENTITY(JSON.stringify(data.error.issues));
    }

    const details = await ApiService.GetDetails(data.data.url);
    res.json(details);
  }
}
export default ApiController;
