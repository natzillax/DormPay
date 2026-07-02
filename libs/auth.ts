import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

// เชื่อมต่อ Supabase ตรงๆ ใน Auth
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Room Credentials",
            credentials: {
                room_number: { label: "Room Number", type: "text", placeholder: "101" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any) {

                console.log("🪵 [Auth] ค่าที่หน้าบ้านส่งมา:", credentials)

                if (!credentials?.room_number || !credentials?.password) {
                    console.log("❌ [Auth] ตกม้าตาย: ไม่มี room_number หรือ password ส่งมา")
                    return null
                }

                // 1. ค้นหา ID ของห้องจากเลขห้องตรงๆ ในตาราง rooms
                const { data: roomData, error: roomError } = await supabase
                    .from("rooms")
                    .select("id, room_password")
                    .eq("room_number", credentials.room_number)
                    .single()

                console.log("🪵 [Auth] ผลการค้นหาห้องในตาราง rooms:", { roomData, roomError })

                if (roomError || !roomData) {
                    console.log("❌ [Auth] ตกม้าตาย: หาห้องเลขนี้ไม่เจอในตาราง rooms")
                    return null
                }

                // 2. 🔐 ตรวจสอบรหัสผ่านของห้องทันทีตรงนี้!
                if (roomData.room_password !== credentials.password) {
                    console.log("❌ [Auth] ตกม้าตาย: รหัสผ่านของห้องไม่ถูกต้อง")
                    return null
                }

                // 3. นำ room_id ไปค้นหาข้อมูลคนเช่าจากตาราง users
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("id, name, email") 
                    .eq("room_id", roomData.id)
                    .single()

                console.log("🪵 [Auth] ผลการค้นหาคนเช่าในตาราง users:", { userData, userError })

                if (userError || !userData) {
                    console.log("❌ [Auth] ตกม้าตาย: หาคนเช่าที่ผูกกับห้องนี้ไม่เจอ")
                    return null
                }

                // 4. ผ่านหมดทุกด่าน ส่งข้อมูลกลับไปทำ Session ผ่านฉลุย!
                console.log("✅ [Auth] เข้าสู่ระบบสำเร็จ!")
                return {
                    id: String(userData.id),
                    name: userData.name,
                    email: userData.email,
                } as any
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string
            }
            return session
        }
    }
})