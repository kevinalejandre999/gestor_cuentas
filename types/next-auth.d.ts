import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      lastName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    lastName?: string | null;
  }
}
