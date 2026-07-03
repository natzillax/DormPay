"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [roomNumber, setRoomNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // สั่งล็อกอินผ่าน Next-Auth และส่งคีย์ให้ตรงกับฟังก์ชันหลังบ้าน
    const result = await signIn("credentials", {
      room_number: roomNumber, // ✨ ส่งเป็น room_number
      password: password,      // ส่งเป็น password
      redirect: false,
    })

    if (result?.error) {
      setError("เลขห้องหรือรหัสผ่านไม่ถูกต้องจ้า!")
    } else {
      // ถ้ารหัสผ่านถูก ให้เด้งไปหน้าแดชบอร์ดหอพักทันที
      router.push("/tenant")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">🏢 เข้าสู่ระบบหอพัก (DormPay)</h2>

        {error && <p className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">หมายเลขห้อง</label>
            <input
              type="text"
              placeholder="ตัวอย่างเช่น 101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่านของห้อง</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-black focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 p-2.5 font-semibold text-white hover:bg-blue-700 transition"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  )
}