import { DomainVerificationStatus } from "../generated/prisma/enums.js";
import {
  BadRequestError,
  CONFLICT_ERROR,
  NotFoundError,
} from "../lib/AppError.js";
import prisma from "../utils/prisma.js";
import dns from "dns/promises";
dns.setServers(["8.8.8.8"]);

class DomainService {
  static async registerDomain(domain: string) {
    const existingDomain = await prisma.domain.findFirst({
      where: {
        domain,
      },
    });
    if (existingDomain) {
      throw new CONFLICT_ERROR("API with the same URL already exists");
    }
    const response = await prisma.domain.create({
      data: {
        domain,
      },
      select: {
        id: true,
        domain: true,
        verificationCode: true,
        verificationStatus: true,
      },
    });
    return response;
  }
  static async verifyDomain(domain: string) {
    const domainDetails = await prisma.domain.findFirst({
      where: { domain: domain },
    });
    console.log(domainDetails);
    if (!domainDetails) {
      throw new NotFoundError("Domain not found");
    }
    if (
      domainDetails.verificationStatus === DomainVerificationStatus.VERIFIED
    ) {
      throw new CONFLICT_ERROR("Domain already verified");
    }
    let isVerified = false;
    try {
      // Use the input as the hostname for DNS lookup
      const txtRecords = await dns.resolveTxt(domain);
      console.log(`TXT records for ${domain}:`, txtRecords);
      const expectedToken = `monitoring-verify=${domainDetails.verificationCode}`;
      for (const record of txtRecords) {
        if (record.join("") === expectedToken) {
          isVerified = true;
        }
      }
    } catch (error) {
      console.error(`DNS lookup failed for ${domain}:`, error);
      throw new BadRequestError("DNS lookup failed");
    }

    const ATTEMPT_MULTIPLIER = 5; // 5 minutes base
    const nextAttempt = isVerified
      ? new Date()
      : new Date(
          Date.now() +
            (domainDetails.verificationAttempts + 1) *
              ATTEMPT_MULTIPLIER *
              60 *
              1000,
        );

    const updateData = {
      lastVerificationAttempt: new Date(),
      verificationAttempts: domainDetails.verificationAttempts + 1,
      verificationStatus: isVerified
        ? DomainVerificationStatus.VERIFIED
        : DomainVerificationStatus.FAILED,
      verifiedAt: isVerified ? new Date() : null,
      nextVerificationAt: nextAttempt,
    };
    const updated = await prisma.domain.update({
      where: { domain },
      data: {
        ...updateData,
      },
      select: {
        id: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    });
    return updated;
  }
  static async getVerificationStatus(domain: string) {
    const api = await prisma.domain.findUnique({
      where: { domain: domain },
      select: { verificationStatus: true, verificationCode: true },
    });
    if (!api) {
      throw new NotFoundError("API not found");
    }
    if (api.verificationStatus === "VERIFIED") {
      return {
        status: api.verificationStatus,
        domain,
        message: "Your domain is verified",
      };
    } else {
      return {
        status: api.verificationStatus,
        domain,
        method: "DNX TXT Record",
        instructions: [
          "1. Go to your domain's DNS provider (GoDaddy, Cloudflare, etc.)",
          "2. Add a new TXT record with these values:",
          `   - Name/Host: ${domain}`,
          `   - Value: monitoring-verify=${api.verificationCode}`,
          "3. Wait 5-30 minutes for DNS propagation",
          "4. Click 'Verify' button to confirm",
        ],
        recordName: domain,
        recordValue: `monitoring-verify=${api.verificationCode}`,
      };
    }
  }
  static async cronJobDomainVerification() {
    const MAX_ATTEMPTS = 20;

    const domainsToVerify = await prisma.domain.findMany({
      where: {
        verificationStatus: DomainVerificationStatus.PENDING,
        verificationAttempts: {
          lt: MAX_ATTEMPTS,
        },
        nextVerificationAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        nextVerificationAt: "asc",
      },
      take: 1000,
      select: {
        domain: true,
      },
    });

    if (domainsToVerify.length === 0) {
      console.log("No domains to verify at this time");
      return;
    }
    console.log(`Verifying ${domainsToVerify.length} domains`);

    // Process domains in batches of 10 in parallel
    const BATCH_SIZE = 100;
    for (let i = 0; i < domainsToVerify.length; i += BATCH_SIZE) {
      const batch = domainsToVerify.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (domain) => {
          try {
            await this.verifyDomain(domain.domain);
          } catch (error) {
            console.error(`Error verifying domain ${domain.domain}:`, error);
          }
        }),
      );
    }
  }
}
export default DomainService;
