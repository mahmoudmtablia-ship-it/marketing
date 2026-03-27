import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const session = await getServerAuthSession();
    const sessionEmail = session?.user?.email ?? undefined;
    const sessionUserId = session?.user?.id ?? undefined;

    if (sessionEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: sessionEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (dbUser) {
        return dbUser;
      }
    }

    if (sessionUserId && !sessionUserId.startsWith("bootstrap-")) {
      return prisma.user.findUnique({
        where: { id: sessionUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }

    return null;
  } catch (error) {
    console.error("[CURRENT_USER_RESOLUTION_ERROR]", error);
    return null;
  }
}
