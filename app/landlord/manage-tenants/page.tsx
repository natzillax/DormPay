"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Tenant {
  id: string
  name: string
  email: string
  room_id: string | null
  status: string
}

export default function ManageTenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  // 🔄 1. ดึงรายชื่อผู้เช่าที่กำลังพักอยู่ (ACTIVE) ขึ้นมาแสดงผล
  const fetchActiveTenants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "TENANT")
        .eq("status", "ACTIVE") // ดึงเฉพาะคนที่ยังเช่าอยู่ปัจจุบัน

      if (error) throw error
      setTenants(data || [])
    } catch (error: any) {
      alert("โหลดข้อมูลผู้เช่าล้มเหลว: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveTenants()
  }, [])

  // 🎯 2. ฟังก์ชันหลักสำหรับปุ่ม "แจ้งย้ายออก (Disconnect)"
  const handleMoveOut = async (tenantId: string, roomId: string | null) => {
    if (!roomId) {
      alert("❌ ผู้เช่าคนนี้ไม่ได้ผูกกับห้องพักใดๆ")
      return
    }

    const confirmAction = window.confirm("คุณต้องการแจ้งย้ายผู้เช่าคนนี้ออกจากห้องพักใช่หรือไม่? (ห้องจะกลับมาว่างทันที)")
    if (!confirmAction) return

    try {
      // สเตปที่ 1: ปลดล็อกและเคลียร์สิทธิ์ผู้เช่าในตาราง users
      const { error: userError } = await supabase
        .from("users")
        .update({
          room_id: null,        // ปลดห้องออก
          status: "MOVED_OUT"   // สลับเป็นย้ายออกแล้ว (จะล็อกอินไม่ได้)
        })
        .eq("id", tenantId)

      if (userError) throw userError

      // สเตปที่ 2: สลับสถานะในตาราง rooms กลับมาเป็นห้องว่าง (VACANT)
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          status: "VACANT"      // 💡 ห้องกลับมาว่างพร้อมต้อนรับคนใหม่
        })
        .eq("id", roomId)

      if (roomError) throw roomError

      alert("🎉 แจ้งย้ายออกและเคลียร์สถานะห้องว่างสำเร็จแล้ว!")
      
      // ดึงข้อมูลใหม่มาอัปเดตหน้าจอทันที คนที่ย้ายออกจะหายไปจากรายการ
      fetchActiveTenants() 
      router.refresh()

    } catch (error: any) {
      alert("เกิดข้อผิดพลาดระหว่างย้ายออก: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">📋 ระบบจัดการผู้เช่าแจ้งย้ายออก (ขาออก)</h1>
        <p className="text-sm text-gray-500 mb-6">รายชื่อผู้เช่าที่กำลังเข้าพักในปัจจุบัน คลิกปุ่มเพื่อเคลียร์ห้องคืน</p>

        {loading ? (
          <p className="text-center text-gray-500">กำลังโหลดรายชื่อ...</p>
        ) : tenants.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ไม่มีผู้เช่าที่กำลังพักอยู่ในขณะนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700 font-semibold text-sm">
                  <th className="p-3 border">ชื่อ-นามสกุล</th>
                  <th className="p-3 border">อีเมล</th>
                  <th className="p-3 border">รหัสห้องพัก (Room ID)</th>
                  <th className="p-3 border text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-3 border font-medium">{tenant.name}</td>
                    <td className="p-3 border text-gray-600">{tenant.email}</td>
                    <td className="p-3 border text-gray-600 font-mono">{tenant.room_id || "ไม่ได้ผูกห้อง"}</td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => handleMoveOut(tenant.id, tenant.room_id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-4 rounded-lg transition duration-150 shadow-sm"
                      >
                        🚪 แจ้งย้ายออก
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}