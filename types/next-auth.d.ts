import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

type AppRole = "USER" | "ADMIN" | "MODERATOR";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
    };
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: AppRole;
  }
}
