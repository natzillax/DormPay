"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerUser } from "../actions/auth" // 🚀 เรียกใช้ Argon2 ผ่านหลังบ้าน

export default function TenantSignUpDirectPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const isError = message.includes("❌")

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            // 🎯 ยิงตรงไปหาหลังบ้าน ให้จบในที่เดียว
            const result = await registerUser({
                email: email.trim().toLowerCase(),
                password: password,
                name: fullName.trim()
            })

            if (!result.success) {
                throw new Error(result.message)
            }

            setMessage("🎉 สมัครสมาชิกสำเร็จแล้ว! ข้อมูลของคุณถูกส่งไปให้เจ้าของหอพักผูกเข้าห้องแล้วครับ")

            // ล้างข้อมูลฟอร์ม
            setEmail("")
            setPassword("")
            setFullName("")

        } catch (error: any) {
            setMessage(error.message.includes("❌") ? error.message : "❌ เกิดข้อผิดพลาด: " + error.message)
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
                                    d="M12 12a4 4 0 100-8 4 4 0 000 8z"
                                    stroke="var(--accent)"
                                    strokeWidth="1.8"
                                />
                                <path
                                    d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
                                    stroke="var(--accent)"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-ink">สมัครสมาชิก DormPay</h1>
                        <p className="mt-1 text-sm text-ink-soft">สำหรับผู้เช่ารายใหม่เพื่อเข้าใช้งานระบบหอพัก</p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                ชื่อ - นามสกุล
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="ตัวอย่าง: สมชาย ใจดี"
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="yourname@gmail.com"
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                รหัสผ่านเข้าใช้งาน
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
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5 disabled:opacity-60"
                        >
                            {loading ? "กำลังบันทึกข้อมูล..." : "สมัครสมาชิก"}
                        </button>

                        <div className="text-center text-sm text-ink-soft">
                            มีบัญชีอยู่แล้วใช่ไหม?{" "}
                            <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
                                เข้าสู่ระบบ
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

                    {message && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg border-l-4 p-3 text-center text-sm font-medium"
                            style={
                                isError
                                    ? { borderLeftColor: "var(--danger)", background: "var(--danger-tint)", color: "var(--danger)" }
                                    : { borderLeftColor: "var(--success)", background: "var(--success-tint)", color: "var(--success)" }
                            }
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}