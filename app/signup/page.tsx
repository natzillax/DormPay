"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerUser } from "../actions/auth" // 🚀 เรียกใช้ Argon2 ผ่านหลังบ้าน

export default function TenantSignUpDirectPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

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
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4 text-black">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-gray-200">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">📱 สมัครสมาชิก DormPay</h1>
                    <p className="text-sm text-gray-500 mt-2">สำหรับผู้เช่ารายใหม่เพื่อเข้าใช้งานระบบหอพัก</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">👤 ชื่อ - นามสกุล</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="ตัวอย่าง: สมชาย ใจดี"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">✉️ อีเมล</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">🔒 รหัสผ่านเข้าใช้งาน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                            minLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:bg-gray-400"
                    >
                        {loading ? "กำลังบันทึกข้อมูล..." : "🚀 สมัครสมาชิก"}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${message.includes("❌") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}