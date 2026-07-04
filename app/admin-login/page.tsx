"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react" // ✨ ใช้ signIn ของ Next-Auth แทน
import { useToast } from "@/components/NotificationProvider"

export default function AdminLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const toast = useToast()

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // ✨ เรียกใช้ Next-Auth Credentials ในการล็อกอิน
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false, // ห้ามมันรีไดเรกต์ออโต้ เราจะจัดการต่อเอง
        })

        if (result?.error) {
            toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
            setLoading(false)
            return
        }

        // 👑 เมื่อล็อกอินผ่าน Next-Auth สำเร็จแล้ว (ซึ่งใน Callbacks เราเช็ค Role แล้ว)
        // สั่งให้วาร์ปไปหน้าแอดมินได้เลยอย่างปลอดภัย
        toast.success("ยินดีต้อนรับครับเจ้าของหอพัก! 👑")
        router.push("/landlord")
        setLoading(false)
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
                                    d="M12 2l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.3-4.4 2.3.8-5-3.6-3.5 5-.7L12 2z"
                                    stroke="var(--accent)"
                                    strokeWidth="1.6"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-ink">ล็อกอินเจ้าของหอพัก</h1>
                        <p className="mt-1 text-sm text-ink-soft">สำหรับผู้ดูแลระบบ DormPay</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                อีเมลแอดมิน
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5 disabled:opacity-60"
                        >
                            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบแอดมิน"}
                        </button>

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