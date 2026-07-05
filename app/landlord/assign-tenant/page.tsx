"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { useToast } from "@/components/NotificationProvider"
import LoadingScreen from "@/components/LoadingScreen"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminAssignTenantPage() {
    const toast = useToast()
    const [rooms, setRooms] = useState<any[]>([])           // รายการห้องพักทั้งหมด
    const [pendingUsers, setPendingUsers] = useState<any[]>([]) // รายชื่อคนเช่าใหม่ที่สถานะ PENDING
    const [selectedRoom, setSelectedRoom] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(true)
    const [submitting, setSubmitting] = useState<boolean>(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            // A. ดึงห้องพักทั้งหมด
            const { data: roomData, error: roomError } = await supabase
                .from("rooms")
                .select("id, room_number, status")
                .order("room_number", { ascending: true })

            if (roomError) throw roomError

            // B. ดึงรายชื่อผู้เช่าปัจจุบัน เพื่อเอามาเช็คว่าห้องไหนโดนจองไปแล้วบ้างในตาราง users
            const { data: allUsers, error: userQueryError } = await supabase
                .from("users")
                .select("id, email, name, status, room_id")

            if (userQueryError) throw userQueryError

            // กรองหาเฉพาะห้องที่มีคนจับจองอยู่แล้ว (room_id โดนใช้งานอยู่)
            const occupiedRoomIds = allUsers
                ?.map((u) => u.room_id)
                .filter((id) => id !== null) || []

            // จัดการข้อมูลห้องพักเพื่อเอาไปเช็คใน UI
            const mappedRooms = roomData.map((room) => ({
                ...room,
                isOccupied: occupiedRoomIds.includes(room.id) || room.status === "OCCUPIED"
            }))
            setRooms(mappedRooms)

            // C. กรองหาผู้เช่าที่สมัครใหม่ (รอยืนยัน) สถานะเป็น PENDING และยังไม่มีห้องพัก
            const adminEmails = ["nantharat.sk@gmail.com", "landlord@dorm.com"];

            const freshUsers = allUsers?.filter((u) => {
                const isNewOrNoRoom = (!u.room_id) || u.status === "PENDING";
                return isNewOrNoRoom && !adminEmails.includes(u.email);
            }) || []

            setPendingUsers(freshUsers)

        } catch (error: any) {
            console.error("❌ ดึงข้อมูลไม่สำเร็จ:", error.message)
            toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // ฟังก์ชันผูกห้องพักให้ผู้เช่าใหม่
    const handleAssignTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoom || !selectedUser) return toast.error("กรุณาเลือกห้องพักและผู้เช่าก่อน")

        setSubmitting(true)
        try {
            // 🎯 ค้นหาข้อมูลผู้เช่าที่ถูกเลือกใน State เพื่อดึง "ชื่อ (name)" ออกมาใช้งาน
            const targetUser = pendingUsers.find(u => u.id === selectedUser)
            const tenantName = targetUser?.name || "ไม่ระบุชื่อ"

            // 1) อัปเดตผู้ใช้ในตาราง users ให้เอา room_id ไปใส่ และเปลี่ยนสถานะเป็น ACTIVE
            const { error: userUpdateError } = await supabase
                .from("users")
                .update({
                    room_id: selectedRoom,
                    status: "ACTIVE"
                })
                .eq("id", selectedUser)

            if (userUpdateError) throw userUpdateError

            // 2) อัปเดตสถานะของห้องพักในตาราง rooms
            // 🎯 เพิ่มฟิลด์ current_tenant_name ส่งชื่อผู้เช่าเข้าไปบันทึกคู่กันเรียบร้อยครับ
            const { error: roomUpdateError } = await supabase
                .from("rooms")
                .update({ 
                    status: "OCCUPIED",
                    current_tenant_id: selectedUser,
                    current_tenant_name: tenantName 
                })
                .eq("id", selectedRoom)

            if (roomUpdateError) throw roomUpdateError

            toast.success("ผูกผู้เช่าเข้ากับห้องพักสำเร็จแล้ว 🎉")
            setSelectedRoom("")
            setSelectedUser("")
            fetchData() // รีโหลดข้อมูลใหม่

        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาด: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <LoadingScreen message="กำลังโหลดระบบผูกบัญชี..." />
    }

    return (
        <div className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/landlord"
                    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-accent-dark"
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    กลับไปหน้าแดชบอร์ด
                </Link>

                <div className="card-elevated p-8">
                    <div className="mb-6">
                        <div
                            className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                            style={{ background: "var(--accent-tint)" }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="8" cy="9" r="3" stroke="var(--accent)" strokeWidth="1.6" />
                                <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M15 8.5h4M17 6.5v4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-ink">จัดการและผูกบัญชีผู้เช่า</h1>
                        <p className="mt-1 text-sm text-ink-soft">เลือกผู้เช่าใหม่ที่สมัครเข้ามาในระบบเพื่อผูกเข้ากับห้องพักที่ยังว่าง</p>
                    </div>

                    <form onSubmit={handleAssignTenant} className="space-y-5">
                        {/* เลือกห้องพัก */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                เลือกห้องพัก
                            </label>
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            >
                                <option value="">-- เลือกห้องพัก --</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id} disabled={room.isOccupied}>
                                        ห้อง {room.room_number} {room.isOccupied ? "(ไม่ว่าง)" : "(ว่าง)"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* เลือกผู้เช่าใหม่ */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft">
                                เลือกผู้เช่าใหม่ที่รอจับคู่ห้อง
                            </label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full rounded-[var(--radius-control)] border px-3.5 py-2.5 text-ink outline-none transition"
                                style={{ borderColor: "var(--line)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                                required
                            >
                                <option value="">-- เลือกบัญชีผู้เช่า --</option>
                                {pendingUsers.length === 0 ? (
                                    <option disabled>ไม่มีผู้เช่าใหม่สมัครเข้ามาชั่วคราว</option>
                                ) : (
                                    pendingUsers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || "ไม่ระบุชื่อ"} ({user.email})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* ปุ่มกดบันทึก */}
                        <button
                            type="submit"
                            disabled={submitting || pendingUsers.length === 0}
                            className="btn-primary w-full py-2.5 disabled:opacity-60"
                        >
                            {submitting ? "กำลังบันทึกโครงสร้าง..." : "ยืนยันการผูกผู้เช่าเข้าห้อง"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}