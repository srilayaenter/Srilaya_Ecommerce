import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID  ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, role: user.role, totpEnabled: user.totpEnabled };
      },
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "PhoneOTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp:   { label: "OTP",   type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const phone = credentials.phone.replace(/\s/g, "").slice(-10);

        const record = await prisma.phoneOtp.findFirst({
          where: { phone, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });

        if (!record) return null;

        if (record.attempts >= 5) {
          await prisma.phoneOtp.delete({ where: { id: record.id } });
          return null;
        }

        if (record.otp !== credentials.otp.trim()) {
          await prisma.phoneOtp.update({
            where: { id: record.id },
            data:  { attempts: { increment: 1 } },
          });
          return null;
        }

        await prisma.phoneOtp.delete({ where: { id: record.id } });

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({ data: { phone, role: "customer" } });
        }

        return { id: user.id, email: user.email ?? null, role: user.role, totpEnabled: user.totpEnabled };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          await prisma.user.create({
            data: { email, role: "customer" },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id as string } });
        token.id   = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "customer";
        token.totpEnabled = dbUser?.totpEnabled ?? false;
        token.totpPending = account?.provider === "credentials" && (dbUser?.totpEnabled ?? false);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "customer";
        (session.user as any).totpPending = token.totpPending ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};