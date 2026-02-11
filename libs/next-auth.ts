import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import connectMongoose from "./mongoose";
import User from "@/models/User";

export const authOptions = {
  // Set any random key in .env.local
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-secret-change-me" : undefined),
  providers: [
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.given_name ? profile.given_name : profile.name,
                email: profile.email,
                image: profile.picture,
                createdAt: new Date(),
              };
            },
          }),
        ]
      : []),

    // Dev-only credentials provider for local testing (requires MongoDB so we can create a real User _id)
    ...(process.env.NODE_ENV === "development" && process.env.DEV_LOGIN_PASSWORD
      ? [
          CredentialsProvider({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const email = String(credentials?.email || "").trim().toLowerCase();
              const password = String(credentials?.password || "");

              if (!email || !password) return null;
              if (password !== process.env.DEV_LOGIN_PASSWORD) return null;

              // Ensure we have a DB so app features work (content, api keys, etc.)
              await connectMongoose();

              const user = await (User as any).findOneAndUpdate(
                { email },
                { $setOnInsert: { email, name: email.split("@")[0] } },
                { new: true, upsert: true }
              );

              return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
              };
            },
          }),
        ]
      : []),

    // Email provider (optional; requires MongoDB + Resend)
    ...(connectMongo && process.env.RESEND_API_KEY
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
          }),
        ]
      : []),
  ],
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONOGODB_URI env variable.
  // Learn more about the model type: https://next-auth.js.org/v3/adapters/models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    session: async ({ session, token }: any) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
