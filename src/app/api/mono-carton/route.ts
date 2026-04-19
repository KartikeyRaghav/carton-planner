import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateMonoCarton } from "@/lib/mono-carton-calculator";
import { checkSubscriptionAccess } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
} from "@/lib/api-response";

const inputSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  gsm: z.number().positive(),
  paperRate: z.number().positive(),
  sheetQty: z.number().positive(),
  wastageShts: z.number().min(0),
  unitsPerSheet: z.number().positive(),
  noOfPlates: z.number().min(0),
  plateRate: z.number().min(0),
  perColourCost: z.number().min(0),
  noOfColours: z.number().min(0),
  rateOfInk: z.number().min(0),
  includePantone: z.boolean(),
  noOfPantoneColours: z.number().min(0),
  printPerColour: z.number().min(0),
  uvCoating: z.boolean(),
  uvCoatingRate: z.number().min(0),
  dripOff: z.boolean(),
  dripOffRate: z.number().min(0),
  warnish: z.boolean(),
  warnishRate: z.number().min(0),
  lamination: z.boolean(),
  laminationRate: z.number().min(0),
  wastagePercent: z.number().min(0),
  dieCost: z.number().min(0),
  dieSetting: z.number().min(0),
  dieCutting: z.number().min(0),
  includeEmbossing: z.boolean(),
  embossingBlockCost: z.number().min(0),
  embossingPerBoxCost: z.number().min(0),
  includeMatPack: z.boolean(),
  matPackLaminationRate: z.number().min(0),
  matPackWastage: z.number().min(0),
  includeLeafing: z.boolean(),
  leafingBlockCost: z.number().min(0),
  leafingPerBoxCost: z.number().min(0),
  stipping: z.number().min(0),
  shorting: z.number().min(0),
  sidePasting: z.number().min(0),
  lockBottom: z.number().min(0),
  noOfPkt: z.number().positive(),
  bagRate: z.number().min(0),
  boxRate: z.number().min(0),
  ccPcChargesPercent: z.number().min(0),
  marginPercent: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const access = await checkSubscriptionAccess(userId);
    if (!access.hasAccess) {
      return apiForbidden(
        `Access denied: ${access.reason}. Please subscribe to continue.`,
      );
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const results = calculateMonoCarton(parsed.data);
    console.log(results);
    const record = await prisma.monoCartonCalculation
    
.create({
      data: {
        userId: Number(userId),
        packagingFormat: parsed.data.bagRate != 0 ? "bag" : "box",
        inputs: parsed.data as any,
        results: results as any,
        grandTotal: results.grandTotal,
        costPerUnit: results.costPerUnit,
        sheetCost: results.sheetCost,
      },
    });
    console.log(record);

    // Update device last_active
    const deviceId = req.headers.get("x-device-id");
    if (deviceId) {
      await prisma.deviceSession.updateMany({
        where: { deviceId, userId: Number(userId) },
        data: { lastActive: new Date() },
      });
    }

    return apiSuccess({ calculation: record, results }, 201);
  } catch (error) {
    console.error("Mono carton calculate error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

    const [calculations, total] = await Promise.all([
      prisma.monoCartonCalculation.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.monoCartonCalculation.count({ where: { userId: Number(userId) } }),
    ]);

    return apiSuccess({
      calculations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get mono carton calculations error:", error);
    return apiError("Internal server error", 500);
  }
}
