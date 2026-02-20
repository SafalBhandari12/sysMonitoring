import zod from "zod";

export const pathSchema = zod
  .string()
  .regex(/^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/, "Invalid path format");

export const uuidSchema = zod.object({ domainId: zod.uuid() });

export const apiDetailsSchema = zod.object({
  name: zod.string(),
  path: pathSchema,
  method: zod.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: zod.record(zod.string(), zod.string()).optional(),
  body: zod.record(zod.string(), zod.string()).optional(),
});

export const domainSchema = zod.object({
  domain: zod
    .string()
    .trim()
    .transform((value) => {
      try {
        // user pasted URL
        const url = new URL(
          value.startsWith("http") ? value : `https://${value}`,
        );
        return url.hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return value.toLowerCase();
      }
    })
    .refine(
      (value) => {
        const fqdnRegex =
          /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
        return fqdnRegex.test(value);
      },
      { message: "Invalid domain" },
    ),
});

export type apiDetailsSchema = zod.infer<typeof apiDetailsSchema>;
export type domainSchema = zod.infer<typeof domainSchema>;
