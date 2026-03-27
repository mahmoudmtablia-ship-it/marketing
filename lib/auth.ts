import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export type AppRole = "USER" | "ADMIN" | "MODERATOR";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              passwordHash: true,
            },
          });

          if (user?.passwordHash && verifyPassword(password, user.passwordHash)) {
            return {
              id: user.id,
              email: user.email ?? email,
              name: user.name ?? "User",
              image: user.image ?? undefined,
              role: user.role as AppRole,
            };
          }
        } catch (error) {
          console.error("[AUTH_DB_LOOKUP_ERROR]", error);
        }

        const adminEmail = process.env.AUTH_ADMIN_EMAIL;
        const adminPassword = process.env.AUTH_ADMIN_PASSWORD;
        const userEmail = process.env.AUTH_USER_EMAIL;
        const userPassword = process.env.AUTH_USER_PASSWORD;

        if (email === adminEmail && password === adminPassword) {
          return { id: "bootstrap-admin", email, name: "Admin", role: "ADMIN" as AppRole };
        }

        if (email === userEmail && password === userPassword) {
          return { id: "bootstrap-user", email, name: "User", role: "USER" as AppRole };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user.role as AppRole | undefined) ?? "USER";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | undefined) ?? "";
        session.user.role = (token.role as AppRole | undefined) ?? "USER";
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
