"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminAssignTenantPage() {
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

            // จัดการข้อมูลห้องพ้กเพื่อเอาไปเช็คใน UI
            const mappedRooms = roomData.map((room) => ({
                ...room,
                isOccupied: occupiedRoomIds.includes(room.id) || room.status === "OCCUPIED"
            }))
            setRooms(mappedRooms)

            // C. กรองหาผู้เช่าที่สมัครใหม่ (รอยืนยัน) สถานะเป็น PENDING และยังไม่มีห้องพัก
            // 🎯 กรองโดยระบุอีเมลของแอดมิน/เจ้าของหอที่ต้องการซ่อนโดยตรง
            const adminEmails = ["nantharat.sk@gmail.com", "landlord@dorm.com"]; // 🔥 เปลี่ยนเป็นอีเมลแอดมินของคุณตรงนี้ครับ

            const freshUsers = allUsers?.filter((u) => {
                // ดึงคนที่ไม่มี room_id ผูกอยู่ (ไม่ว่าจะสถานะ PENDING หรือ ACTIVE) และไม่ใช่อีเมลแอดมิน
                const isNewOrNoRoom = (!u.room_id) || u.status === "PENDING";
                return isNewOrNoRoom && !adminEmails.includes(u.email);
            }) || []

            setPendingUsers(freshUsers)

        } catch (error: any) {
            console.error("❌ ดึงข้อมูลไม่สำเร็จ:", error.message)
            alert("เกิดข้อผิดพลาดในการดึงข้อมูล")
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
        if (!selectedRoom || !selectedUser) return alert("กรุณาเลือกห้องพักและผู้เช่าก่อนครับ")

        setSubmitting(true)
        try {
            // 1) อัปเดตผู้ใช้ในตาราง users ให้เอา room_id ไปใส่ และเปลี่ยนสถานะเป็น ACTIVE
            const { error: userUpdateError } = await supabase
                .from("users")
                .update({
                    room_id: selectedRoom,
                    status: "ACTIVE"
                })
                .eq("id", selectedUser)

            if (userUpdateError) throw userUpdateError

            // 2) อัปเดตสถานะของห้องพักในตาราง rooms ให้เป็น OCCUPIED เพื่อให้ตรงกับข้อมูลจริง
            const { error: roomUpdateError } = await supabase
                .from("rooms")
                .update({ status: "OCCUPIED" })
                .eq("id", selectedRoom)

            if (roomUpdateError) throw roomUpdateError

            alert("🎉 ผูกผู้เช่าเข้ากับห้องพักสำเร็จแล้ว!")
            setSelectedRoom("")
            setSelectedUser("")
            fetchData() // รีโหลดข้อมูลใหม่

        } catch (error: any) {
            alert("เกิดข้อผิดพลาด: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังโหลดระบบผูกบัญชี...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-black">
            <div className="mx-auto max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">🤝 ระบบจัดการและผูกบัญชีผู้เช่า</h1>
                <p className="text-sm text-gray-500 mb-6">เลือกผู้เช่าใหม่ที่สมัครเข้ามาในระบบเพื่อผูกเข้ากับห้องพักที่ยังว่าง</p>

                <form onSubmit={handleAssignTenant} className="space-y-5">
                    {/* เลือกห้องพัก */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 เลือกห้องพัก</label>
                        <select
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- เลือกห้องพัก --</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id} disabled={room.isOccupied}>
                                    ห้อง {room.room_number} {room.isOccupied ? "(❌ ไม่ว่าง)" : "(🟢 ว่าง)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* เลือกผู้เช่าใหม่ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">👤 เลือกผู้เช่าใหม่ที่รอจับคู่ห้อง</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- เลือกบัญชีผู้เช่า --</option>
                            {pendingUsers.length === 0 ? (
                                <option disabled>❌ ไม่มีผู้เช่าใหม่สมัครเข้ามาชั่วคราว</option>
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
                        className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition shadow-sm disabled:bg-gray-300 text-sm"
                    >
                        {submitting ? "กำลังบันทึกโครงสร้าง..." : "🤝 ยืนยันการผูกผู้เช่าเข้าห้อง"}
                    </button>
                </form>
            </div>
        </div>
    )
}