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
        room_number: { label: "Room Number" },
        password: { label: "Password" },
      },
      async authorize(credentials) {
        if (!credentials?.room_number || !credentials?.password) return null

        const roomNumber = credentials.room_number as string
        const password = credentials.password as string

        // 1. 🔍 ตรวจสอบเลขห้องและรหัสผ่านจากตาราง rooms โดยตรง (ดูคอลัมน์จากรูปของคุณ)
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("id")
          .eq("room_number", roomNumber)
          .eq("room_password", password) // ✨ ใช้ room_password ตามตารางจริง
          .maybeSingle()

        if (roomError || !roomData) {
          throw new Error("เลขห้องหรือรหัสผ่านไม่ถูกต้องจ้า!")
        }

        // 2. 🎯 เมื่อห้องและรหัสผ่านถูกต้องแล้ว ไปดึงข้อมูลผู้ใช้จากตาราง users ผ่าน room_id
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, role, email")
          .eq("room_id", roomData.id) // ดึงคนที่ผูกกับ id ของห้องนี้
          .maybeSingle()

        if (userError || !userData) {
          throw new Error("ไม่พบข้อมูลผู้เช่าที่ผูกกับห้องนี้")
        }

        // 3. ส่งข้อมูลกลับไปสร้าง Session เข้าหน้าบ้าน
        return {
          id: userData.id,
          name: userData.name || `ผู้เช่าห้อง ${roomNumber}`,
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