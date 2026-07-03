"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // 1. ล็อกอินผ่าน Supabase Auth ปกติ
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (authError || !authData.user) {
            alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
            setLoading(false)
            return
        }

        // 2. เช็คตาราง users ด่านที่สองทันทีว่าคนนี้ใช่ ADMIN ไหม
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", authData.user.id)
            .single()

        if (userData?.role !== "ADMIN") {
            // 🛑 ถ้าคนเช่าแอบเนียนมาล็อกอินหน้านี้ ระบบจะสั่ง Logout ทันทีและดีดออกไป!
            await supabase.auth.signOut()
            alert("🔒 บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานในส่วนของเจ้าของหอพัก")
            setLoading(false)
            return
        }

        // 🎉 ถ้าเป็น ADMIN ตัวจริง ให้วาร์ปไปหน้าจัดการหอพักเลย
        alert("ยินดีต้อนรับครับเจ้าของหอพัก! 👑")
        router.push("/landlord")
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