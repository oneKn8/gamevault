import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@gamevault/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@gamevault/db/schema";

const adapter = DrizzleAdapter(getDb() as any, {
  usersTable: users as any,
  accountsTable: accounts as any,
  sessionsTable: sessions as any,
  verificationTokensTable: verificationTokens as any,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [GitHub, Google, Discord],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const db = getDb();
      const dbUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.id),
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.username = dbUser.username ?? dbUser.name ?? "Player";
        session.user.xp = dbUser.xp;
        session.user.level = dbUser.level;
      }

      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
});
