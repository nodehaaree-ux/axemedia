import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",        type: "email"    },
        password: { label: "Fjalëkalimi",  type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id:       String(user.id),
          name:     user.name,
          email:    user.email,
          role:     user.role,
          clientId: user.clientId ? String(user.clientId) : null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role     = (user as { role: string; clientId: string | null }).role;
        token.id       = user.id;
        token.clientId = (user as { role: string; clientId: string | null }).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role     = token.role     as string;
      session.user.id       = token.id       as string;
      session.user.clientId = token.clientId as string | null;
      return session;
    },
  },

  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET ?? "axemedia-dev-secret",
};
