import { UNPROCESSABLE_ENTITY } from "../lib/AppError.js";

export function getBaseDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;

    return hostname;
  } catch {
    throw new UNPROCESSABLE_ENTITY("Invalid URL format");
  }
}
