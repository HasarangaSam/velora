import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }

      if (typeof token.id !== "string") {
        return token;
      }

      const currentUser = await prisma.user.findUnique({
        where: {
          id: token.id,
        },
        select: {
          role: true,
          sessionVersion: true,
        },
      });

      if (!currentUser) {
        return {};
      }

      if (
        typeof token.sessionVersion === "number" &&
        currentUser.sessionVersion !== token.sessionVersion
      ) {
        return {};
      }

      token.role = currentUser.role;
      token.sessionVersion = currentUser.sessionVersion;

      return token;
    },

    async session({ session, token }) {
      if (
        session.user &&
        typeof token.id === "string" &&
        (token.role === "USER" || token.role === "ADMIN")
      ) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
