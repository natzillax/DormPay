"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    try {
      // 🎯 เปลี่ยนมาค้นหาข้อมูลผู้ใช้งานจากตาราง public.users โดยตรง
      const { data: user, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single() // ค้นหาแถวข้อมูลที่ตรงกับอีเมลนี้เพียงแถวเดียว

      if (dbError || !user) {
        throw new Error("ไม่พบอีเมลผู้ใช้งานนี้ในระบบ หรือข้อมูลไม่ถูกต้อง")
      }

      // 🎯 ตรวจสอบรหัสผ่านที่กรอกเข้ามาเทียบกับข้อมูลในตาราง
      // หมายเหตุ: โค้ดนี้เปรียบเทียบข้อความธรรมดา หากในระบบมีการเข้ารหัสลับ ให้ใช้ฟังก์ชันสำหรับตรวจสอบรหัสผ่านแทนครับ
      if (user.password !== password) {
        throw new Error("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง")
      }

      // 🎯 ตรวจสอบสถานะและสิทธิ์ (Role/Status) เพื่อแยกหน้าแดชบอร์ดตามที่ออกแบบไว้
      if (user.role === "ADMIN") {
        router.push("/landlord/dashboard") // ย้ายไปหน้าแดชบอร์ดเจ้าของหอพัก
      } else if (user.status === "PENDING") {
        setErrorMsg("⏳ บัญชีของคุณอยู่ระหว่างรอเจ้าของหอพักผูกห้องพัก กรุณาติดต่อแอดมินครับ")
      } else if (user.status === "MOVED_OUT") {
        setErrorMsg("❌ บัญชีนี้สิ้นสุดสัญญาเช่าแล้ว ไม่สามารถเข้าสู่ระบบได้")
      } else {
        localStorage.setItem("tenant_room_id", user.room_id)
        localStorage.setItem("tenant_email", user.email)

        router.refresh()
        // 💡 เอาเครื่องหมาย / ตัวสุดท้ายออก ให้เหลือแค่นี้ เพื่อให้ตรงกับโครงสร้างโฟลเดอร์ในรูปเป๊ะๆ ครับ
        router.replace("/tenant")
      }

    } catch (error: any) {
      setErrorMsg("เข้าสู่ระบบไม่สำเร็จ: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4 text-black">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🏢 เข้าสู่ระบบหอพัก (DormPay)</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมลผู้ใช้งาน</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่านส่วนตัว</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition disabled:bg-gray-400"
          >
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>

          {/* 🚀 เพิ่มลิงก์วาร์ปไปหน้าสมัครสมาชิกใต้ปุ่มล็อกอิน */}
          <div className="text-center mt-4 text-sm text-gray-600">
            ยังไม่มีบัญชีผู้เช่าใช่ไหม?{" "}
            <Link 
              href="/signup" 
              className="text-blue-600 font-semibold hover:underline">
              สมัครสมาชิกใหม่
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}