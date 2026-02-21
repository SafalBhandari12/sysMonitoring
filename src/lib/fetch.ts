import { apiStatusEnum, type methodEnum } from "../generated/prisma/enums.js";
import prisma from "../utils/prisma.js";

export const getResponse = async (
  url: string,
  method: methodEnum,
  headers?: any,
  body?: any,
) => {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutMs = 60000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: headers ? JSON.parse(headers) : undefined,
      body: body ? JSON.stringify(body) : null,
      cache: "no-cache",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: apiStatusEnum.UP,
        statusCode: response.status,
        responseTime,
      };
    } else {
      return {
        status: apiStatusEnum.DOWN,
        statusCode: response.status,
        responseTime,
      };
    }
  } catch (e: any) {
    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;

    if (e.name === "AbortError") {
      return {
        status: apiStatusEnum.TIMEOUT,
        statusCode: 408,
        responseTime,
      };
    }

    return {
      status: apiStatusEnum.DOWN, // DNS failure, network error, etc.
      statusCode: 0,
      responseTime,
    };
  }
};
export const hitApi = async () => {
  try {
    // Fetch up to 100 APIs with their domain information
    const apisToProcess = await prisma.api.findMany({
      where: {
        processingStatus: false,
        domain: {
          verificationStatus: {
            equals: "VERIFIED",
          },
        },
      },
      include: {
        domain: {
          select: {
            domain: true,
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    console.log(`Processing ${apisToProcess.length} APIs in batches of 10`);

    // Process APIs in batches of 10 in parallel
    for (let i = 0; i < apisToProcess.length; i += 10) {
      const batch = apisToProcess.slice(i, i + 10);

      const processPromises = batch.map(async (apiData) => {
        const { id, path, method, headers, body, domain } = apiData;

        try {
          // Construct full URL by combining domain and path
          const url = `https://${domain.domain}${path}`;

          // Mark API as processing (outside transaction for safety)
          await prisma.api.update({
            where: { id },
            data: { processingStatus: true },
          });

          // Fetch the API (outside transaction to avoid timeout issues)
          const response = await getResponse(url, method, headers, body);
          const isUp = response.status === apiStatusEnum.UP;

          // Store response and update stats in a transaction
          await prisma.$transaction(async (tx) => {
            // Store response in ApiResponse table
            await tx.apiResponse.create({
              data: {
                apiId: id,
                responseTime: response.responseTime,
                statusCode: response.statusCode,
                status: response.status,
              },
            });

            // Update daily stats
            const dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);

            const existing = await tx.dailyStats.findFirst({
              where: {
                apiId: id,
                date: dayStart,
              },
            });

            if (!existing) {
              await tx.dailyStats.create({
                data: {
                  apiId: id,
                  date: dayStart,
                  upCount: isUp ? 1 : 0,
                  totalCount: 1,
                  upTime: isUp ? 100 : 0,
                },
              });
            } else {
              const newUpCount = existing.upCount + (isUp ? 1 : 0);
              const newTotalCount = existing.totalCount + 1;

              await tx.dailyStats.update({
                where: { id: existing.id },
                data: {
                  upCount: newUpCount,
                  totalCount: newTotalCount,
                  upTime: (newUpCount / newTotalCount) * 100,
                },
              });
            }
          });

          // Mark API as done processing
          await prisma.api.update({
            where: { id },
            data: { processingStatus: false },
          });

          console.log(`Successfully processed API: ${url}`);
        } catch (e) {
          console.error(`Error processing API with id ${id}:`, e);
          // Reset processing status on error
          await prisma.api.update({
            where: { id },
            data: { processingStatus: false },
          });
        }
      });

      // Wait for all 10 APIs in the batch to complete
      await Promise.all(processPromises);
    }
  } catch (e) {
    console.error("Error in hitApi:", e);
  }
};

export const processApiForUptime = async () => {
  const apis = await prisma.api.findMany({ select: { id: true } });
  for (const api of apis) {
    await calculateUptime(api.id);
  }
};

export const calculateUptime = async (apiId: string) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // 1) Get sums for uptime calculation (efficient aggregate)
    const sums = await prisma.dailyStats.aggregate({
      where: {
        apiId,
        date: { gte: ninetyDaysAgo },
      },
      _sum: {
        upCount: true,
        totalCount: true,
      },
    });

    const upCountSum = sums._sum.upCount ?? 0;
    const totalCountSum = sums._sum.totalCount ?? 0;
    const uptimePercentage =
      totalCountSum > 0 ? Math.round((upCountSum / totalCountSum) * 100) : 0;

    // 2) Compute p90, p99 and average responseTime from ApiResponse for last 90 days
    const percentileResult = (
      await prisma.$queryRaw<
        {
          p90: number | string | null;
          p99: number | string | null;
          avg: number | string | null;
        }[]
      >`
      SELECT
        percentile_cont(0.90) WITHIN GROUP (ORDER BY "responseTime") AS p90,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY "responseTime") AS p99,
        AVG("responseTime") AS avg
      FROM "ApiResponse"
      WHERE "apiId" = ${apiId}
        AND "createdAt" >= ${ninetyDaysAgo};
    `
    )[0] ?? { p90: null, p99: null, avg: null };

    // Postgres may return numeric types as strings depending on driver
    const rawP90 =
      percentileResult.p90 === null ? 0 : Number(percentileResult.p90);
    const rawP99 =
      percentileResult.p99 === null ? 0 : Number(percentileResult.p99);
    const rawAvg =
      percentileResult.avg === null ? 0 : Number(percentileResult.avg);

    const p90 = Number.isFinite(rawP90) ? Math.round(rawP90) : 0;
    const p99 = Number.isFinite(rawP99) ? Math.round(rawP99) : 0;
    const averageResponseTime = Number.isFinite(rawAvg)
      ? Math.round(rawAvg)
      : 0;

    // 3) Update the Api row
    await prisma.api.update({
      where: { id: apiId },
      data: {
        upTime: uptimePercentage, // int percent
        p90,
        p99,
        // ensure your schema contains this field; previously you were using averageResponseTime
        averageResponseTime,
      },
    });

    console.log(
      `Uptime (90d): ${uptimePercentage}% — p90: ${p90} ms, p99: ${p99} ms, avg: ${averageResponseTime} ms`,
    );
  } catch (e) {
    console.error("calculateUptime error:", e);
  }
};
