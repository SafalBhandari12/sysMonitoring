import type { methodEnum } from "../generated/prisma/enums.js";

export const getResponse = async (
  url: string,
  method: methodEnum,
  headers?: any,
  body?: any,
) => {
  const startTime = Date.now();
  const response = await fetch(url + `?_t=${Date.now()}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
    cache: "no-cache",
  });
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const statusCode = response.status;
  const responseBody = await response.json();
  console.log(statusCode, totalTime, responseBody);
  return { statusCode, totalTime, responseBody };
};
