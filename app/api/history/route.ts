import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const historyPayloadSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json().catch(() => null);
    const parsedPayload = historyPayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid history payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({
        success: true,
        tracked: false,
        reason: "unauthenticated",
      });
    }

    const { productId } = parsedPayload.data;
    const recentEntry = await prisma.browsingHistory.findFirst({
      where: {
        userId: currentUser.id,
        productId,
      },
      orderBy: {
        viewedAt: "desc",
      },
      select: {
        id: true,
        viewedAt: true,
      },
    });

    const withinThirtyMinutes =
      recentEntry && Date.now() - recentEntry.viewedAt.getTime() < 1000 * 60 * 30;

    const historyEntry = withinThirtyMinutes
      ? await prisma.browsingHistory.update({
          where: { id: recentEntry.id },
          data: { viewedAt: new Date() },
          select: { id: true, viewedAt: true },
        })
      : await prisma.browsingHistory.create({
          data: {
            userId: currentUser.id,
            productId,
          },
          select: { id: true, viewedAt: true },
        });

    return NextResponse.json({
      success: true,
      tracked: true,
      historyEntry,
    });
  } catch (error) {
    console.error("[HISTORY_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "History tracking failed." }, { status: 500 });
  }
}
