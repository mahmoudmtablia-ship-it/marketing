import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const alertPayloadSchema = z.object({
  productId: z.string().min(1),
  targetPrice: z.number().positive().optional(),
});

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const rawPayload = await request.json().catch(() => null);
    const parsedPayload = alertPayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid alert payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId } = parsedPayload.data;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        sources: {
          where: { stockStatus: { not: "OUT_OF_STOCK" } },
          orderBy: [{ price: "asc" }],
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const livePrice = product.sources[0]?.price ?? null;
    const targetPrice = parsedPayload.data.targetPrice ?? (livePrice ? roundCurrency(livePrice * 0.9) : null);

    if (targetPrice === null || targetPrice <= 0) {
      return NextResponse.json({ error: "A valid target price is required for this alert." }, { status: 400 });
    }

    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        userId: currentUser.id,
        productId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    const alert = existingAlert
      ? await prisma.priceAlert.update({
          where: { id: existingAlert.id },
          data: {
            targetPrice,
            isActive: true,
            notifiedAt: null,
          },
          select: {
            id: true,
            targetPrice: true,
            isActive: true,
          },
        })
      : await prisma.priceAlert.create({
          data: {
            userId: currentUser.id,
            productId,
            targetPrice,
            isActive: true,
          },
          select: {
            id: true,
            targetPrice: true,
            isActive: true,
          },
        });

    return NextResponse.json({
      success: true,
      alert,
      livePrice,
      message: "Price alert is active.",
    });
  } catch (error) {
    console.error("[ALERTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to create alert." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedPayload = alertPayloadSchema.safeParse({
      productId: searchParams.get("productId"),
    });

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid alert payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId } = parsedPayload.data;
    await prisma.priceAlert.updateMany({
      where: {
        userId: currentUser.id,
        productId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      active: false,
      productId,
    });
  } catch (error) {
    console.error("[ALERTS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to remove alert." }, { status: 500 });
  }
}
