"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/NotificationProvider"
import { useSession } from "next-auth/react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TenantRepairPage() {
    const toast = useToast()
    const { data: session, status } = useSession() // 🎯 ดึง status มาร่วมเช็คระบบโหลด
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [myRoom, setMyRoom] = useState<any>(null)
    const [fetchingRoom, setFetchingRoom] = useState(true) // เพิ่มสถานะ Loading ป้องกันข้อมูลตกหล่น

    useEffect(() => {
        const getMyRoomInfo = async () => {
            // 🎯 รอให้ Next-Auth โหลดสถานะ Session ให้เสร็จสิ้นสมบูรณ์ก่อน
            if (status === "loading") return
            if (!session?.user?.email) {
                setFetchingRoom(false)
                return
            }

            try {
                // 1. ดึงข้อมูลผู้ใช้ปัจจุบันสดๆ จาก Supabase โดยอิงผ่าน Email หลักที่ใช้ระบบล็อกอิน
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("id, room_id")
                    .eq("email", session.user.email)
                    .maybeSingle()

                if (userError) throw userError

                // 2. หากผู้ใช้รายนี้ถูกผูกห้องพักไว้ในตารางเรียบร้อยแล้ว ให้ดึงรายละเอียดห้องต่อทันที
                if (userData?.room_id) {
                    const { data: roomData, error: roomError } = await supabase
                        .from("rooms")
                        .select("id, room_number")
                        .eq("id", userData.room_id)
                        .maybeSingle()

                    if (roomError) throw roomError
                    
                    if (roomData) {
                        // เก็บค่าข้อมูลห้อง และแนบรหัส userId สดจาก DB ไปใช้งานต่อ
                        setMyRoom({
                            id: roomData.id,
                            room_number: roomData.room_number,
                            user_uuid: userData.id
                        })
                    }
                }
            } catch (err: any) {
                console.error("❌ Error fetching room info:", err.message)
            } finally {
                setFetchingRoom(false)
            }
        }
        getMyRoomInfo()
    }, [session, status])

    const handleSubmittingRepair = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) return toast.error("กรุณาระบุหัวข้อแจ้งซ่อม")
        
        // 🎯 ตรวจสอบและดักกรณียังโหลดข้อมูลความสัมพันธ์ห้องจากเบื้องหลังไม่สำเร็จ
        if (fetchingRoom) return toast.error("ระบบกำลังดึงข้อมูลห้องพักของคุณ กรุณารอสักครู่...")
        if (!myRoom?.id) return toast.error("ไม่พบข้อมูลการผูกห้องพักของคุณในระบบ กรุณาแจ้งผู้ดูแลหอพัก")
        
        setSubmitting(true)
        try {
            // 🎯 สั่ง Insert ข้อมูลผูก ID ตารางสัมพันธ์อย่างถูกต้อง
            const { error } = await supabase
                .from("repair_requests")
                .insert([{
                    title: title,
                    description: description,
                    room_id: myRoom.id,            // 🔥 UUID อ้างอิงตารางห้องพัก
                    user_id: myRoom.user_uuid,     // 🔥 UUID อ้างอิงตารางผู้ใช้หลัก
                    status: "PENDING"
                }])

            if (error) throw error

            toast.success("ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว แอดมินจะรีบดำเนินการให้ครับ 🛠️")
            setTitle("")
            setDescription("")
        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล: " + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-bold mb-4">🔧 แจ้งซ่อม/พบปัญหาในห้องพัก</h1>
            
            {/* กล่องสถานะแจ้งเตือนการเชื่อมโยงห้องพัก */}
            {fetchingRoom ? (
                <div className="mb-4 p-3 bg-gray-100 text-gray-600 rounded-lg border text-sm animate-pulse">
                    ⏳ กำลังค้นหาข้อมูลห้องพักของคุณ...
                </div>
            ) : myRoom ? (
                <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm font-semibold">
                    📍 ยืนยันข้อมูลสำเร็จ: คุณกำลังแจ้งเรื่องสำหรับ ห้อง {myRoom.room_number}
                </div>
            ) : (
                <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm font-semibold">
                    ⚠️ บัญชีของคุณยังไม่ถูกผูกกับห้องพักใดๆ บนระบบ (รายการแจ้งซ่อมจะไม่แสดงเลขห้อง)
                </div>
            )}

            <form onSubmit={handleSubmittingRepair} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">หัวข้อปัญหา</label>
                    <input 
                        type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="เช่น แอร์เปิดไม่ติด, ท่อน้ำรั่ว" required
                        className="w-full border p-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">รายละเอียดเพิ่มเติม</label>
                    <textarea 
                        value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="ระบุรายละเอียดเพิ่มเติม หรือช่วงเวลาที่สะดวกให้ช่างเข้าซ่อม..."
                        className="w-full border p-2 rounded h-24"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={submitting || fetchingRoom || !myRoom?.id} 
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 font-bold text-white rounded transition disabled:bg-gray-400"
                >
                    {submitting ? "กำลังบันทึกเรื่อง..." : "ส่งเรื่องแจ้งซ่อม"}
                </button>
            </form>
        </div>
    )
}