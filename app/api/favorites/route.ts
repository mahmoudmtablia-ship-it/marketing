import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const favoritePayloadSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const rawPayload = await request.json().catch(() => null);
    const parsedPayload = favoritePayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid favorite payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId } = parsedPayload.data;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: currentUser.id,
          productId,
        },
      },
      update: {},
      create: {
        userId: currentUser.id,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      saved: true,
      product,
    });
  } catch (error) {
    console.error("[FAVORITES_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to save favorite." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedPayload = favoritePayloadSchema.safeParse({
      productId: searchParams.get("productId"),
    });

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid favorite payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId } = parsedPayload.data;
    await prisma.favorite.deleteMany({
      where: {
        userId: currentUser.id,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      saved: false,
      productId,
    });
  } catch (error) {
    console.error("[FAVORITES_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to remove favorite." }, { status: 500 });
  }
}
