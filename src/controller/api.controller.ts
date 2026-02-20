import type { Request, Response } from "express";
import { apiDetailsSchema, } from "../schema/api.schema.js";
import ApiService from "../services/api.service.js";
import { UNPROCESSABLE_ENTITY } from "../lib/AppError.js";

class ApiController {

  // static async getDetails(req: Request, res: Response) {
  //   const data = await apiUrlSchema.parseAsync(req.query);

  //   const details = await ApiService.GetDetails(data.url);
  //   res.json(details);
  // }
}
export default ApiController;
