# Domain Authority Verification System

## Overview

This document outlines how to implement a domain verification system to ensure that users registering APIs have ownership/authority over the domains they're monitoring.

## Verification Method

### DNS TXT Record Verification

Users add a DNS TXT record to their domain to prove ownership.

**How it works:**

- User registers an API with domain `example.com`
- System generates a unique verification token (e.g., `verify_abc123xyz`)
- User adds a DNS TXT record: `monitoring-verify=abc123xyz` to their domain
- System performs DNS lookup to confirm the record exists
- Upon successful verification, API is marked as `VERIFIED`

**Advantages:**

- No server access needed
- Industry standard (similar to Google, Cloudflare verification)
- Secure and reliable
- Prevents domain spoofing and unauthorized registration

---

## Implementation Steps

### Step 1: Update Prisma Schema

Add verification fields to the `Api` model:

```prisma
enum verificationStatusEnum {
  PENDING
  VERIFIED
  FAILED
}

model Api {
  id String @id @default(uuid())

  name String
  url String @unique  
  method methodEnum
  headers Json?
  body Json?

  upTime Int @default(0)
  averageResponseTime Int @default(0)

  // Verification fields
  verificationStatus verificationStatusEnum @default(PENDING)
  verificationToken String @unique @default(cuid())
  verificationAttempts Int @default(0)
  lastVerificationAttempt DateTime?
  verifiedAt DateTime?

  response ApiResponse[]
  dailyStats DailyStats[]
  processingStatus Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run: `npx prisma migrate dev --name add_domain_verification`

### Step 2: Create Verification Service

Create `src/services/verification.service.ts`:

```typescript
import dns from "dns/promises";

class VerificationService {
  // Extract domain from URL
  static extractDomain(url: string): string {
    const urlObj = new URL(url);
    return urlObj.hostname;
  }

  // Verify via DNS TXT record
  static async verifyDNS(domain: string, token: string): Promise<boolean> {
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const expectedRecord = `monitoring-verify=${token}`;

      for (const record of txtRecords) {
        if (record.join("") === expectedRecord) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`DNS verification failed for ${domain}:`, error);
      return false;
    }
  }
}

export default VerificationService;
```

### Step 3: Update API Service

Update `src/services/api.service.ts` to handle verification:

```typescript
static async RegisterApi(data: apiSchema) {
  const { method, name, url, body, headers } = data;

  const existingApi = await prisma.api.findFirst({
    where: { url },
  });

  if (existingApi) {
    throw new CONFLICT_ERROR("API with the same URL already exists");
  }

  // Create API in PENDING verification state
  const response = await prisma.api.create({
    data: {
      method,
      name,
      url,
      body: body ?? Prisma.JsonNull,
      headers: headers ?? Prisma.JsonNull,
      verificationStatus: "PENDING",
      // verificationToken is auto-generated via @default(cuid())
    },
    select: {
      id: true,
      method: true,
      name: true,
      url: true,
      verificationToken: true,
      verificationStatus: true,
      createdAt: true,
    },
  });

  return response;
}

static async VerifyDomain(apiId: string) {
  const api = await prisma.api.findUnique({
    where: { id: apiId },
  });

  if (!api) {
    throw new NOT_FOUND_ERROR("API not found");
  }

  if (api.verificationStatus === "VERIFIED") {
    throw new CONFLICT_ERROR("API is already verified");
  }

  const domain = VerificationService.extractDomain(api.url);
  const isVerified = await VerificationService.verifyDNS(domain, api.verificationToken);

  const updateData: any = {
    lastVerificationAttempt: new Date(),
    verificationAttempts: api.verificationAttempts + 1,
  };

  if (isVerified) {
    updateData.verificationStatus = "VERIFIED";
    updateData.verifiedAt = new Date();
  } else {
    updateData.verificationStatus = "FAILED";
  }

  const updated = await prisma.api.update({
    where: { id: apiId },
    data: updateData,
    select: {
      id: true,
      verificationStatus: true,
      verificationToken: true,
      verifiedAt: true,
    },
  });

  return updated;
}
```

### Step 4: Create Verification Schema

Create `src/schema/verification.schema.ts`:

```typescript
import zod from "zod";

export const verifyDomainSchema = zod.object({
  apiId: zod.string().uuid(),
});

export const getVerificationInstructionsSchema = zod.object({
  apiId: zod.string().uuid(),
});

export type verifyDomainSchema = zod.infer<typeof verifyDomainSchema>;
export type getVerificationInstructionsSchema = zod.infer<
  typeof getVerificationInstructionsSchema
>;
```

### Step 5: Create Verification Controller

Create `src/controller/verification.controller.ts`:

```typescript
import type { Request, Response } from "express";
import {
  verifyDomainSchema,
  getVerificationInstructionsSchema,
} from "../schema/verification.schema.js";
import ApiService from "../services/api.service.js";
import VerificationService from "../services/verification.service.js";
import { UNPROCESSABLE_ENTITY, NOT_FOUND_ERROR } from "../lib/AppError.js";
import prisma from "../utils/prisma.js";

class VerificationController {
  static async VerifyDomain(req: Request, res: Response) {
    const data = verifyDomainSchema.safeParse(req.body);

    if (!data.success) {
      throw new UNPROCESSABLE_ENTITY(JSON.stringify(data.error.issues));
    }

    const result = await ApiService.VerifyDomain(data.data.apiId);
    res.json(result);
  }

  static async GetVerificationInstructions(req: Request, res: Response) {
    const data = getVerificationInstructionsSchema.safeParse(req.query);

    if (!data.success) {
      throw new UNPROCESSABLE_ENTITY(JSON.stringify(data.error.issues));
    }

    const { apiId } = data.data;

    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { url: true, verificationToken: true, verificationStatus: true },
    });

    if (!api) {
      throw new NOT_FOUND_ERROR("API not found");
    }

    const domain = VerificationService.extractDomain(api.url);

    res.json({
      apiId,
      status: api.verificationStatus,
      domain,
      method: "DNS TXT Record",
      instructions: [
        "1. Go to your domain's DNS provider (GoDaddy, Cloudflare, etc.)",
        "2. Add a new TXT record with these values:",
        `   - Name/Host: ${domain}`,
        `   - Value: monitoring-verify=${api.verificationToken}`,
        "3. Wait 5-30 minutes for DNS propagation",
        "4. Click 'Verify' button to confirm",
      ],
      recordName: domain,
      recordValue: `monitoring-verify=${api.verificationToken}`,
    });
  }
}

export default VerificationController;
```

### Step 6: Add Routes

Add to your Express routes:

```typescript
import VerificationController from "./controller/verification.controller.js";

router.post(
  "/verify-domain",
  asyncHandler(VerificationController.VerifyDomain),
);
router.get(
  "/verify-instructions",
  asyncHandler(VerificationController.GetVerificationInstructions),
);
```

---

## Frontend Flow

### 1. Register API

```javascript
// POST /api/register
const response = await fetch("http://localhost:3000/api/register", {
  method: "POST",
  body: JSON.stringify({
    name: "My API",
    url: "https://example.com/api",
    method: "GET",
  }),
});
const { id, verificationToken, verificationStatus } = await response.json();
// Returns: { id: "...", verificationToken: "abc123", verificationStatus: "PENDING" }
```

### 2. Get Verification Instructions

```javascript
// GET /api/verify-instructions?apiId=...
const instructions = await fetch(
  "http://localhost:3000/api/verify-instructions?apiId=api123",
).then((r) => r.json());

// Shows user:
// 1. Where to add DNS record
// 2. What value to add
// 3. When to click Verify
```

### 3. Verify Domain

```javascript
// POST /api/verify-domain
const result = await fetch("http://localhost:3000/api/verify-domain", {
  method: "POST",
  body: JSON.stringify({
    apiId: "api123",
  }),
});
const { verificationStatus } = await result.json();
// Returns: { verificationStatus: "VERIFIED" or "FAILED" }
```

---

## Database Queries

After implementation, you can query verified APIs:

```typescript
// Get all verified APIs
const verified = await prisma.api.findMany({
  where: { verificationStatus: "VERIFIED" },
});

// Get pending verification
const pending = await prisma.api.findMany({
  where: { verificationStatus: "PENDING" },
});

// Get failed verification
const failed = await prisma.api.findMany({
  where: { verificationStatus: "FAILED" },
});
```

---

## Security Considerations

1. **Rate limiting**: Limit verification attempts per API (e.g., max 5 per hour)
2. **Token rotation**: Consider rotating tokens after certain attempts
3. **SSL/TLS**: Always use HTTPS for verification endpoints
4. **Logging**: Log all verification attempts for audit trails
5. **Timeout**: Set reasonable timeouts for DNS/HTTP lookups (5-10 seconds)
6. **CORS**: Restrict verification endpoints if needed

---

## Optional Enhancements

1. **Multiple verification attempts**: Allow users to retry verification multiple times before marking as failed
2. **Webhook verification**: User provides webhook URL, we send verification requests
3. **Email verification**: Send verification link to domain's email address
4. **File verification**: Place verification file at `/.well-known/monitoring-verify.txt`
5. **Batch verification**: Allow users to verify multiple domains at once
6. **Re-verification**: Periodically re-verify domains to ensure continued ownership
7. **Verification history**: Track all verification attempts and results

---

## Implementation Summary

| Component   | File                                        | Purpose                                       |
| ----------- | ------------------------------------------- | --------------------------------------------- |
| Schema      | `prisma/schema.prisma`                      | Database model with verification fields       |
| Service     | `src/services/verification.service.ts`      | DNS, meta tag, certificate verification logic |
| API Service | `src/services/api.service.ts`               | Updated with verification methods             |
| Schema      | `src/schema/verification.schema.ts`         | Zod validation for verification requests      |
| Controller  | `src/controller/verification.controller.ts` | HTTP endpoints for verification               |
| Routes      | Express app                                 | Routes for verify and instructions endpoints  |
