import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                code: { label: "Player Code", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials?.code);
                if (!credentials?.code || !credentials?.password) {
                    console.log("Missing credentials");
                    throw new Error("Missing code or password");
                }

                const user = await prisma.user.findUnique({
                    where: { code: credentials.code },
                });

                console.log("User found in DB:", user ? user.code : "Not found");

                if (!user || !user.password) {
                    console.log("User not found or no password");
                    throw new Error("Invalid credentials");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                console.log("Password valid:", isValid);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    name: user.name,
                    code: user.code,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.code = user.code;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.code = token.code;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
