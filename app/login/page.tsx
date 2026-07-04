"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loginUser } from "../actions/auth"

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
        setErrorMsg("บัญชีของคุณอยู่ระหว่างรอเจ้าของหอพักผูกห้องพัก กรุณาติดต่อแอดมิน")
      } else if (user.status === "MOVED_OUT") {
        setErrorMsg("บัญชีนี้สิ้นสุดสัญญาเช่าแล้ว ไม่สามารถเข้าสู่ระบบได้")
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
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-elevated p-8">
          <div className="text-center mb-7">
            <div
              className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--accent-tint)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3l8 4v5c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V7l8-4z"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M9.5 12l1.8 1.8L15 10" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-ink">DormPay</h1>
            <p className="mt-1 text-sm text-ink-soft">เข้าสู่ระบบหอพัก</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                อีเมลผู้ใช้งาน
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                style={{ borderColor: "var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                รหัสผ่านส่วนตัว
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                style={{ borderColor: "var(--line)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                required
              />
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border-l-4 p-3 text-sm"
                style={{ borderLeftColor: "var(--danger)", background: "var(--danger-tint)", color: "var(--danger)" }}
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-60"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>

            {/* 🚀 ลิงก์วาร์ปไปหน้าสมัครสมาชิกใต้ปุ่มล็อกอิน */}
            <div className="mt-4 text-center text-sm text-ink-soft">
              ยังไม่มีบัญชีผู้เช่าใช่ไหม?{" "}
              <Link href="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
                สมัครสมาชิกใหม่
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                กลับหน้าแรก
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}