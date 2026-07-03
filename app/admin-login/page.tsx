"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react" // ✨ ใช้ signIn ของ Next-Auth แทน

export default function AdminLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

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
            alert("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง")
            setLoading(false)
            return
        }

        // 👑 เมื่อล็อกอินผ่าน Next-Auth สำเร็จแล้ว (ซึ่งใน Callbacks เราเช็ค Role แล้ว)
        // สั่งให้วาร์ปไปหน้าแอดมินได้เลยอย่างปลอดภัย
        alert("ยินดีต้อนรับครับเจ้าของหอพัก! 👑")
        router.push("/landlord")
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 text-black">
            <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-xl shadow-md max-w-md w-full space-y-4">
                <h2 className="text-xl font-bold text-center text-blue-600">🔑 ล็อกอินสำหรับเจ้าของหอพัก</h2>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">อีเมลแอดมิน</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded-lg bg-white" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">รหัสผ่าน</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg bg-white" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบแอดมิน"}
                </button>
            </form>
        </div>
    )
}