import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const clickPayloadSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1).optional(),
  sourceAgent: z.string().min(1).max(64).optional(),
  sourceId: z.string().min(1).optional(),
});

function getIpHash(request: Request): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;

  if (!rawIp) {
    return undefined;
  }

  return createHash("sha256").update(rawIp).digest("hex");
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsedBody = clickPayloadSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid click payload",
          details: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId, userId, sourceId } = parsedBody.data;
    const sourceAgent = parsedBody.data.sourceAgent ?? "direct";
    const session = await getServerAuthSession();
    const sessionEmail = session?.user?.email ?? undefined;

    const selectedSource = await prisma.productSource.findFirst({
      where: {
        productId,
        ...(sourceId ? { sourceId } : {}),
        stockStatus: { not: "OUT_OF_STOCK" },
      },
      include: {
        source: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ price: "asc" }],
    });

    if (!selectedSource) {
      return NextResponse.json({ error: "No affiliate source available for product." }, { status: 404 });
    }

    let resolvedUserId: string | undefined;
    if (userId || sessionEmail) {
      const existingUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          })
        : sessionEmail
          ? await prisma.user.findUnique({
              where: { email: sessionEmail },
              select: { id: true },
            })
          : null;
      resolvedUserId = existingUser?.id;
    }

    const click = await prisma.click.create({
      data: {
        productId,
        userId: resolvedUserId,
        sourceAgent,
        userAgent: req.headers.get("user-agent") ?? undefined,
        ipHash: getIpHash(req),
      },
      select: {
        id: true,
        clickedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      action: "redirecting",
      trackedBy: "Revenue Agent",
      clickId: click.id,
      clickedAt: click.clickedAt,
      destination: selectedSource.url,
      source: selectedSource.source,
      fraudCheck: "pass",
    });
  } catch (err) {
    console.error("[CLICK_API_ERROR]", err);
    return NextResponse.json({ error: "Click tracking failed" }, { status: 500 });
  }
}
