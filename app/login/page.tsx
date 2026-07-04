"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loginUser } from "../actions/auth"

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

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
      // 📦 1. จัดเตรียมข้อมูลเพื่อส่งไปให้ Server Action
      const formData = new FormData()
      formData.append("email", email.trim().toLowerCase())
      formData.append("password", password)

      // 🔐 2. ส่งข้อมูลไปตรวจสอบที่หลังบ้านด้วย Argon2 (ไม่ดึงรหัสมาเทียบดื้อ ๆ บน Client)
      const result = await loginUser(formData)

      // หากตรวจสอบไม่ผ่าน (เช่น รหัสไม่ตรง หรือ ไม่พบอีเมล) ให้โยน Error ออกไป
      if (!result.success || !result.user) {
        throw new Error(result.message)
      }

      // 🎯 3. ดึงข้อมูล User และใช้ "as any" บังคับหลบ TypeScript เพื่อดึงค่าสิทธิ์กับห้องพัก
      const user = result.user as any

      // 🎯 4. ตรวจสอบสิทธิ์และสถานะตามที่คุณดีไซน์ไว้
      if (user.role === "ADMIN") {
        router.push("/landlord/dashboard") // ย้ายไปหน้าแดชบอร์ดเจ้าของหอพัก
      } else if (user.status === "PENDING") {
        setErrorMsg("⏳ บัญชีของคุณอยู่ระหว่างรอเจ้าของหอพักผูกห้องพัก กรุณาติดต่อแอดมินครับ")
      } else if (user.status === "MOVED_OUT") {
        setErrorMsg("❌ บัญชีนี้สิ้นสุดสัญญาเช่าแล้ว ไม่สามารถเข้าสู่ระบบได้")
      } else {
        // บันทึกสถานะผู้เช่าลง LocalStorage ตามระบบเดิมของคุณ
        localStorage.setItem("tenant_room_id", user.room_id || "")
        localStorage.setItem("tenant_email", user.email || "")
        localStorage.setItem("tenant_user_id", user.id || "") // แนะนำให้เก็บอันนี้ไว้เผื่อดึง Realtime

        router.refresh()
        router.replace("/tenant") // ย้ายเข้าหน้าจอผู้เช่า
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