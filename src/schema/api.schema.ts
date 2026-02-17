import zod from "zod";

export const apiDetailsSchema = zod.object({
  name: zod.string(),
  url: zod.url(),
  method: zod.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: zod.record(zod.string(), zod.string()).optional(),
  body: zod.record(zod.string(), zod.string()).optional(),
});

export const apiUrlSchema = zod.object({
  url: zod.coerce.string().pipe(zod.url()),
});

export type apiDetailsSchema = zod.infer<typeof apiDetailsSchema>;
export type apiUrlSchema = zod.infer<typeof apiUrlSchema>;
