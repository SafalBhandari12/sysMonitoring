import zod from "zod";

export const apiSchema = zod.object({
  name: zod.string(),
  url: zod.url(),
  method: zod.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: zod.record(zod.string(), zod.string()).optional(),
  body: zod.record(zod.string(), zod.string()).optional(),
});

export const apiDetailsSchema = zod.object({
  url: zod.coerce.string().url(),
});

export type apiSchema = zod.infer<typeof apiSchema>;
export type apiDetailsSchema = zod.infer<typeof apiDetailsSchema>;
