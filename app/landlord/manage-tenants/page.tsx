"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast, useConfirm } from "@/components/NotificationProvider"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 💡 1. ปรับปรุง Interface ให้รองรับโครงสร้างข้อมูลที่ดึงข้ามตารางมาจากตาราง rooms
interface Tenant {
  id: string
  name: string
  email: string
  room_id: string | null
  status: string
  rooms: {
    room_number: string
  } | null // ข้อมูลห้องพักที่ดึงมาพ่วงกัน
}

export default function ManageTenantsPage() {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  // 🔄 2. แก้ไขฟังก์ชันดึงข้อมูล เพื่อให้ Supabase ไป JOIN เอาเลขห้องมาให้
  const fetchActiveTenants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        // 💡 เปลี่ยนจาก "*" มาดึงเฉพาะฟิลด์ที่ใช้ และใส่ rooms(room_number) เพื่อ Join ตารางห้องพัก
        //  .select("id, name, email, room_id, status, rooms(room_number)")
        .select("*, rooms!room_id(room_number)")
        .eq("role", "TENANT")
        .eq("status", "ACTIVE") 

      if (error) throw error

      console.log("Tenants Data:", data)

      setTenants((data as any) || [])
    } catch (error: any) {
      toast.error("โหลดข้อมูลผู้เช่าล้มเหลว: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveTenants()
  }, [])

  // 🎯 3. ฟังก์ชันหลักสำหรับปุ่ม "แจ้งย้ายออก" (คงเดิมไว้)
  const handleMoveOut = async (tenantId: string, roomId: string | null) => {
    if (!roomId) {
      toast.error("ผู้เช่าคนนี้ไม่ได้ผูกกับห้องพักใดๆ")
      return
    }

    const confirmAction = await confirm({
      title: "แจ้งย้ายออก?",
      message: "ห้องจะกลับมาว่างทันที และผู้เช่าจะถูกตัดออกจากห้องนี้",
      confirmLabel: "แจ้งย้ายออก",
      tone: "danger",
    })
    if (!confirmAction) return

    try {
      const { error: userError } = await supabase
        .from("users")
        .update({
          room_id: null,        
          status: "MOVED_OUT"   
        })
        .eq("id", tenantId)

      if (userError) throw userError

      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          status: "VACANT"      
        })
        .eq("id", roomId)

      if (roomError) throw roomError

      toast.success("แจ้งย้ายออกและเคลียร์สถานะห้องว่างสำเร็จแล้ว 🎉")
      fetchActiveTenants() 
      router.refresh()

    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดระหว่างย้ายออก: " + error.message)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/landlord"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-accent-dark"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          กลับไปหน้าแดชบอร์ด
        </Link>

        <div className="card-elevated p-6">
          <h1 className="text-xl font-semibold text-ink mb-1">ระบบจัดการผู้เช่าแจ้งย้ายออก</h1>
          <p className="text-sm text-ink-soft mb-6">รายชื่อผู้เช่าที่กำลังเข้าพักในปัจจุบัน คลิกปุ่มเพื่อเคลียร์ห้องคืน</p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg"
                  style={{ background: "var(--line-soft)" }}
                />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-center text-ink-soft py-8">ไม่มีผู้เช่าที่กำลังพักอยู่ในขณะนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-ink-soft font-semibold text-xs uppercase tracking-wide ledger-row">
                    <th className="p-3">ชื่อ-นามสกุล</th>
                    <th className="p-3">อีเมล</th>
                    <th className="p-3">เลขห้อง</th>
                    <th className="p-3">รหัสห้องพัก (Room ID)</th>
                    <th className="p-3 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="ledger-row text-sm">
                      <td className="p-3 font-medium text-ink">{tenant.name}</td>
                      <td className="p-3 text-ink-soft">{tenant.email}</td>

                      {/* 💡 4. แก้ไขจุดนี้เพื่อแสดงเลขห้องที่ดึงเชื่อมมาจากตาราง rooms */}
                      <td className="p-3 font-semibold" style={{ color: "var(--accent)" }}>
                        {tenant.rooms?.room_number || "ไม่มีข้อมูลห้อง"}
                      </td>

                      <td className="p-3 font-mono text-xs text-ink-soft">{tenant.room_id || "ไม่ได้ผูกห้อง"}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleMoveOut(tenant.id, tenant.room_id)}
                          className="rounded-[var(--radius-control)] px-4 py-1.5 text-sm font-semibold text-white transition"
                          style={{ background: "var(--danger)" }}
                        >
                          แจ้งย้ายออก
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
    </div>
  )
}