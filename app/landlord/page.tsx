"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    
    const [invoices, setInvoices] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    // --- State สำหรับฟอร์มสร้างบิลใหม่ ---
    const [selectedRoomId, setSelectedRoomId] = useState("")
    const [waterPrice, setWaterPrice] = useState("")
    const [electricPrice, setElectricPrice] = useState("")
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [creating, setCreating] = useState(false)

    // 1. ฟังก์ชันดึงใบแจ้งหนี้ทั้งหมดที่รอการตรวจสอบ (WAITING)
    const fetchWaitingInvoices = async () => {
        const { data, error } = await supabase
            .from("invoices")
            .select(`
                *,
                rooms ( room_number )
            `)
            .eq("status", "WAITING")
            .order("created_at", { ascending: true })

        if (!error && data) setInvoices(data)
    }

    // 2. ฟังก์ชันดึงรายชื่อห้องทั้งหมดเพื่อใช้เลือกในฟอร์ม
    const fetchRooms = async () => {
        const { data, error } = await supabase
            .from("rooms")
            .select("id, room_number, price")
            .order("room_number", { ascending: true })

        if (!error && data) setRooms(data)
    }

    // 3. ฟังก์ชันกดอนุมัติบิล (เปลี่ยนเป็น PAID)
    const handleApprove = async (invoiceId: string) => {
        if (!confirm("คุณตรวจสอบสลิปยอดเงินถูกต้อง และต้องการอนุมัติบิลนี้ใช่หรือไม่?")) return
        
        setUpdatingId(invoiceId)
        const { error } = await supabase
            .from("invoices")
            .update({ status: "PAID" })
            .eq("id", invoiceId)

        if (!error) {
            alert("อนุมัติยอดชำระเงินเรียบร้อยแล้วจ้า! 🎉")
            fetchWaitingInvoices()
        } else {
            alert("เกิดข้อผิดพลาดในการอนุมัติ: " + error.message)
        }
        setUpdatingId(null)
    }

    // ⭐ 3.5 เพิ่มฟังก์ชันปฏิเสธสลิป (ตีกลับเป็น PENDING และเคลียร์ค่า slip_url)
    const handleReject = async (invoiceId: string) => {
        if (!confirm("คุณต้องการปฏิเสธสลิปนี้เพื่อให้ผู้เช่าอัปโหลดใหม่ใช่หรือไม่?")) return

        setUpdatingId(invoiceId)
        const { error } = await supabase
            .from("invoices")
            .update({ 
                status: "PENDING", // ดีดสถานะกลับไปค้างชำระ
                slip_url: null     // ลบลิงก์สลิปเก่าออกเพื่อให้ปุ่มอัปโหลดฝั่งคนเช่าโผล่ใหม่
            })
            .eq("id", invoiceId)

        if (!error) {
            alert("ปฏิเสธสลิปเรียบร้อย ระบบจะแจ้งผู้เช่าให้ส่งสลิปใหม่ครับ ❌")
            fetchWaitingInvoices()
        } else {
            alert("เกิดข้อผิดพลาด: " + error.message)
        }
        setUpdatingId(null)
    }

    // 4. ฟังก์ชันสร้างใบแจ้งหนี้ใบใหม่ส่งให้ผู้เช่า
    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoomId || !waterPrice || !electricPrice) return alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนจ้า!")

        setCreating(true)
        try {
            const targetRoom = rooms.find(r => r.id === selectedRoomId)
            if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพักที่เลือก")

            const wPrice = Number(waterPrice)
            const ePrice = Number(electricPrice)
            const rPrice = Number(targetRoom.price)
            const total = rPrice + wPrice + ePrice

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 7)

            const { error } = await supabase
                .from("invoices")
                .insert([{
                    room_id: selectedRoomId,
                    room_price: rPrice,
                    water_price: wPrice,
                    electric_price: ePrice,
                    total_amount: total,
                    month: Number(month),
                    year: Number(year),
                    status: "PENDING",
                    due_date: dueDate.toISOString(),
                }])

            if (error) throw error

            alert(`สร้างบิลห้อง ${targetRoom.room_number} ประจำเดือน ${month}/${year} สำเร็จแล้ว! 🚀`)
            
            setWaterPrice("")
            setElectricPrice("")
            fetchWaitingInvoices()

        } catch (error: any) {
            alert("ไม่สามารถสร้างบิลได้: " + error.message)
        } finally {
            setCreating(false)
        }
    }

    useEffect(() => {
        // 🔒 ตรวจสอบสิทธิ์ความปลอดภัย: หากระบบตรวจสอบผู้ใช้งานเสร็จแล้ว
        if (status === "unauthenticated") {
            // มารองรับกรณีต้องการเปิดใช้งานระบบล็อกอินภายหลัง
            // router.push("/login")
        }
        
        // โหลดข้อมูลได้ทันทีเพื่อความรวดเร็วในการทดสอบ
        Promise.all([fetchWaitingInvoices(), fetchRooms()]).then(() => setLoading(false))
    }, [status, router])

    if (status === "loading" || loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังโหลดข้อมูลแดชบอร์ด...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-5xl">
                
                {/* Header ส่วนบน */}
                <div className="flex items-center justify-between border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🫅 แดชบอร์ดเจ้าของหอพัก (DormPay Admin)</h1>
                        <p className="text-sm text-gray-500">ระบบจัดการออกบิลค่าน้ำค่าไฟ และตรวจสอบสลิป</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                    >
                        ออกจากระบบ
                    </button>
                </div>

                {/* 🏗️ ฟอร์มออกบิลค่าน้ำค่าไฟใหม่ */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-700">📝 ออกใบแจ้งหนี้ประจำเดือนใหม่</h2>
                    <form onSubmit={handleCreateInvoice} className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">เลือกห้องพัก</label>
                            <select 
                                value={selectedRoomId} 
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                className="w-full rounded-lg border p-2 text-sm bg-white border-gray-300"
                                required
                            >
                                <option value="">-- เลือกห้อง --</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>ห้อง {r.room_number} (ค่าห้อง ฿{r.price})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">ค่าน้ำประปา (บาท)</label>
                            <input 
                                type="number" 
                                placeholder="เช่น 150" 
                                value={waterPrice}
                                onChange={(e) => setWaterPrice(e.target.value)}
                                className="w-full rounded-lg border p-2 text-sm border-gray-300"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">ค่าไฟฟ้า (บาท)</label>
                            <input 
                                type="number" 
                                placeholder="เช่น 450" 
                                value={electricPrice}
                                onChange={(e) => setElectricPrice(e.target.value)}
                                className="w-full rounded-lg border p-2 text-sm border-gray-300"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">เดือน</label>
                                <input 
                                    type="number" 
                                    min="1" max="12"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full rounded-lg border p-2 text-sm border-gray-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">ปี</label>
                                <input 
                                    type="number" 
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full rounded-lg border p-2 text-sm border-gray-300"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full rounded-lg bg-blue-600 py-2 font-bold text-white text-sm hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400"
                            >
                                {creating ? "กำลังสร้างบิล..." : "🚀 ออกบิลส่งผู้เช่า"}
                            </button>
                        </div>

                    </form>
                </div>

                {/* ตารางรายการห้องที่รอตรวจสอบ */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                        ⏳ รายการบิลรอการตรวจสอบ ({invoices.length} ห้อง)
                    </h2>

                    {invoices.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            👏 ไม่มีสลิปค้างชำระ ยอดเยี่ยมมาก! ทุกห้องชำระเงินครบหมดแล้ว
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-sm font-semibold text-gray-600">
                                        <th className="p-3">ห้อง</th>
                                        <th className="p-3">ประจำเดือน</th>
                                        <th className="p-3">ยอดรวมทั้งหมด</th>
                                        <th className="p-3">หลักฐานการโอน</th>
                                        <th className="p-3 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition">
                                            <td className="p-3 font-bold text-blue-600">ห้อง {inv.rooms?.room_number || "ไม่ระบุ"}</td>
                                            <td className="p-3 text-gray-600">{inv.month}/{inv.year}</td>
                                            <td className="p-3 font-semibold text-gray-800">฿{inv.total_amount.toLocaleString()}</td>
                                            <td className="p-3">
                                                {inv.slip_url ? (
                                                    <a 
                                                        href={inv.slip_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                                                    >
                                                        🔍 เปิดดูรูปสลิป
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-red-500">ไม่มีรูปแนบ</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(inv.id)}
                                                    disabled={updatingId === inv.id}
                                                    className="rounded-lg bg-green-600 px-3 py-1.5 font-bold text-white hover:bg-green-700 transition shadow-sm disabled:bg-gray-400 text-xs"
                                                >
                                                    {updatingId === inv.id ? "รอ..." : "✅ อนุมัติ"}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(inv.id)}
                                                    disabled={updatingId === inv.id}
                                                    className="rounded-lg bg-red-500 px-3 py-1.5 font-bold text-white hover:bg-red-600 transition shadow-sm disabled:bg-gray-400 text-xs"
                                                >
                                                    {updatingId === inv.id ? "รอ..." : "❌ ปฏิเสธ"}
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