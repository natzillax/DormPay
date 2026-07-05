"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/NotificationProvider"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdminRepairsPage() {
    const toast = useToast()
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRepairs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("repair_requests")
            .select("*")
            .order("created_at", { ascending: false }) // เอาใบแจ้งล่าสุดขึ้นก่อน

        if (!error && data) setRequests(data)
        setLoading(false)
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from("repair_requests")
            .update({ status: newStatus })
            .eq("id", id)

        if (!error) {
            toast.success("อัปเดตสถานะงานซ่อมเรียบร้อยแล้ว!")
            fetchRepairs() // โหลดข้อมูลใหม่
        } else {
            toast.error("อัปเดตไม่สำเร็จ: " + error.message)
        }
    }

    useEffect(() => { fetchRepairs() }, [])

    if (loading) return <p className="p-8 text-center">กำลังโหลดรายการแจ้งซ่อม...</p>

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">⚙️ รายการแจ้งซ่อมจากผู้เช่า</h1>
            <div className="space-y-4">
                {requests.length === 0 ? <p className="text-center text-gray-500">ไม่มีรายการแจ้งซ่อมในขณะนี้</p> : 
                  requests.map((req) => (
                    <div key={req.id} className="border p-5 rounded-lg bg-white shadow-sm flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">ห้อง {req.room_number}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    req.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {req.status === 'PENDING' ? '⏳ รอรับเรื่อง' : req.status === 'IN_PROGRESS' ? '🔧 กำลังดำเนินการ' : '✅ ซ่อมเสร็จแล้ว'}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">{req.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{req.description || "ไม่มีรายละเอียดเพิ่มเติม"}</p>
                            <span className="text-xs text-gray-400 mt-2 block">แจ้งเมื่อ: {new Date(req.created_at).toLocaleString('th-TH')}</span>
                        </div>
                        
                        {/* ส่วนควบคุมการเปลี่ยนสถานะของแอดมิน */}
                        <div className="flex flex-col gap-2">
                            {req.status === "PENDING" && (
                                <button onClick={() => handleUpdateStatus(req.id, "IN_PROGRESS")} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded transition">
                                    รับเรื่อง/ส่งช่าง
                                </button>
                            )}
                            {req.status === "IN_PROGRESS" && (
                                <button onClick={() => handleUpdateStatus(req.id, "COMPLETED")} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition">
                                    ปิดงานซ่อมสำเร็จ
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}