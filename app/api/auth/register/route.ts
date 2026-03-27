import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const registerPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const parsedPayload = registerPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid registration payload",
          details: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parsedPayload.data;
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        emailVerified: new Date(),
        wallet: {
          create: {
            pendingBalance: 0,
            availableBalance: 0,
            totalEarned: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error("[REGISTER_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
