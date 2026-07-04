import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // 🔍 ค้นหาผู้ใช้จากตาราง users โดยตรงด้วย Email และ Password
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, role, email, password")
          .eq("email", email)
          .eq("password", password)
          .maybeSingle()

        if (userError || !userData) {
          throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        }

        // ส่งข้อมูลผู้ใช้กลับไปสร้าง Session เข้าหน้าบ้าน
        return {
          id: userData.id,
          name: userData.name || (userData.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้เช่า"),
          email: userData.email,
          role: userData.role || "TENANT",
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})