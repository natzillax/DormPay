// src/app/landlord/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast, useConfirm } from "@/components/NotificationProvider"
import LoadingScreen from "@/components/LoadingScreen"
import RepairRequestsTable from "./RepairRequestsTable" // 🛠️ นำเข้าตารางแสดงงานแจ้งซ่อม

import AdminHeader from "./AdminHeader"
import CreateInvoiceForm from "./CreateInvoiceForm"
import WaitingInvoicesTable from "./WaitingInvoicesTable"
import PendingInvoicesTable from "./PendingInvoicesTable" // 🎯 1. Import ตารางใหม่เข้ามา

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const toast = useToast()
    const confirm = useConfirm()

    // 🛠️ State สำหรับเก็บรายการแจ้งซ่อมจากผู้เช่า
    const [repairRequests, setRepairRequests] = useState<any[]>([])

    const [invoices, setInvoices] = useState<any[]>([])
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]) // 🎯 2. State สำหรับบิลค้างชำระ
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const WATER_RATE = 18
    const ELECTRIC_RATE = 7

    const [selectedRoomId, setSelectedRoomId] = useState("")
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [creating, setCreating] = useState(false)

    const [waterPrev, setWaterPrev] = useState("")
    const [waterCurr, setWaterCurr] = useState("")
    const [electricPrev, setElectricPrev] = useState("")
    const [electricCurr, setElectricCurr] = useState("")

    const fetchWaitingInvoices = async () => {
        const { data, error } = await supabase
            .from("invoices")
            .select(`*, rooms ( room_number )`)
            .eq("status", "WAITING")
            .order("created_at", { ascending: true })

        if (!error && data) setInvoices(data)
    }

    // 🎯 3. ฟังก์ชันดึงบิลที่ 'PENDING' (แอดมินพึ่งคีย์/ผู้เช่ายังไม่จ่าย)
    const fetchPendingInvoices = async () => {
        const { data, error } = await supabase
            .from("invoices")
            .select(`*, rooms ( room_number )`)
            .eq("status", "PENDING")
            .order("room_number", { ascending: true })

        if (!error && data) setPendingInvoices(data)
    }

    const fetchRooms = async () => {
        const { data, error } = await supabase
            .from("rooms")
            .select("id, room_number, price")
            .order("room_number", { ascending: true })

        if (!error && data) setRooms(data)
    }

    // 🛠️ ฟังก์ชันดึงข้อมูลการแจ้งซ่อมทั้งหมดจากผู้เช่า
    const fetchRepairRequests = async () => {
        const { data, error } = await supabase
            .from("repair_requests")
            .select(`
            id,
            title,
            description,
            status,
            created_at,
            rooms:room_id ( room_number ) 
        `) // 🎯 ระบุชัดเจนว่าใช้ room_id ในการ Map หาตาราง rooms
            .order("created_at", { ascending: false })

        if (!error && data) {
            setRepairRequests(data)
        } else {
            console.error("Error fetching repairs:", error?.message)
        }
    }

    const handleApprove = async (invoiceId: string) => {
        const ok = await confirm({
            title: "ยืนยันการอนุมัติสลิป",
            message: "คุณตรวจสอบสลิปยอดเงินถูกต้อง และต้องการอนุมัติบิลนี้ใช่หรือไม่?",
            confirmLabel: "อนุมัติ",
        })
        if (!ok) return

        setUpdatingId(invoiceId)
        const { error } = await supabase.from("invoices").update({ status: "PAID" }).eq("id", invoiceId)
        if (!error) {
            toast.success("อนุมัติยอดชำระเงินเรียบร้อยแล้ว 🎉")
            fetchWaitingInvoices()
            fetchPendingInvoices() // รีเฟรชตารางบิลค้างชำระด้วย เผื่อมีผลเกี่ยวเนื่องกัน
        } else {
            toast.error("เกิดข้อผิดพลาดในการอนุมัติ: " + error.message)
        }
        setUpdatingId(null)
    }

    const handleReject = async (invoiceId: string) => {
        const ok = await confirm({
            title: "ปฏิเสธสลิปนี้?",
            message: "ผู้เช่าจะต้องอัปโหลดสลิปใหม่อีกครั้ง และบิลนี้จะกลับไปสถานะค้างชำระ",
            confirmLabel: "ปฏิเสธสลิป",
            tone: "danger",
        })
        if (!ok) return

        setUpdatingId(invoiceId)
        const { error } = await supabase.from("invoices").update({ status: "PENDING", slip_url: null }).eq("id", invoiceId)
        if (!error) {
            toast.success("ปฏิเสธสลิปเรียบร้อย บิลดีดกลับไปอยู่ตารางค้างชำระแล้ว")
            fetchWaitingInvoices()
            fetchPendingInvoices() // โหลดข้อมูลใหม่เพื่อให้บิลไปโผล่ตารางล่าง
        } else {
            toast.error("เกิดข้อผิดพลาด: " + error.message)
        }
        setUpdatingId(null)
    }

    // 🎯 4. ฟังก์ชันลบใบแจ้งหนี้ (สำหรับบิล PENDING ที่แอดมินคีย์ผิด)
    const handleDeleteInvoice = async (invoiceId: string) => {
        const ok = await confirm({
            title: "ลบใบแจ้งหนี้ใบนี้?",
            message: "คุณต้องการลบใบแจ้งหนี้นี้ออกใช่หรือไม่? ข้อมูลจะหายไปถาวร (ใช้ในกรณีที่พิมพ์ตัวเลขผิดและผู้เช่ายังไม่ได้จ่าย)",
            confirmLabel: "ยืนยันการลบ",
            tone: "danger",
        })
        if (!ok) return

        setUpdatingId(invoiceId)
        try {
            const { error } = await supabase
                .from("invoices")
                .delete()
                .eq("id", invoiceId)

            if (error) throw error

            toast.success("ลบใบแจ้งหนี้ที่ผิดพลาดสำเร็จแล้ว 🗑️")
            fetchPendingInvoices() // โหลดตารางล่างใหม่
        } catch (error: any) {
            toast.error("ไม่สามารถลบใบแจ้งหนี้ได้: " + error.message)
        } finally {
            setUpdatingId(null)
        }
    }

    // 🛠️ ฟังก์ชันสำหรับแอดมินอัปเดตสถานะงานแจ้งซ่อม
    const handleUpdateRepairStatus = async (repairId: string, nextStatus: string) => {
        setUpdatingId(repairId)
        const { error } = await supabase
            .from("repair_requests")
            .update({ status: nextStatus })
            .eq("id", repairId)

        if (!error) {
            toast.success("อัปเดตสถานะงานแจ้งซ่อมเรียบร้อยแล้ว! ⚙️")
            fetchRepairRequests() // โหลดรายการแจ้งซ่อมใหม่
        } else {
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ: " + error.message)
        }
        setUpdatingId(null)
    }

    // 🧮 ส่วนคำนวณราคา Real-time
    const targetRoom = rooms.find(r => r.id === selectedRoomId)
    const rPrice = targetRoom ? Number(targetRoom.price) : 0
    const waterUnits = Math.max(0, Number(waterCurr) - Number(waterPrev))
    const wPrice = waterUnits * WATER_RATE
    const electricUnits = Math.max(0, Number(electricCurr) - Number(electricPrev))
    const ePrice = electricUnits * ELECTRIC_RATE
    const totalAmount = rPrice + wPrice + ePrice

    const sendEmailNotification = async (email: string, roomNumber: string, amount: number, currentMonth: number) => {
        try {
            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: `📢 แจ้งยอดชำระค่าหอพัก ห้อง ${roomNumber} ประจำเดือน ${currentMonth}`,
                    text: `เรียน ผู้เช่าห้อง ${roomNumber}\n\nขณะนี้บิลค่าหอพักประจำเดือนได้ออกเรียบร้อยแล้ว\nยอดเงินที่ต้องชำระสุทธิ: ฿${amount.toLocaleString()} บาท\n\nกรุณาเข้าสู่ระบบ DormPay เพื่อตรวจสอบรายละเอียดและแนบสลิปหลักฐานการโอนเงินภายใน 7 วันค่ะ\n\nขอบคุณค่ะ\nระบบ DormPay Admin`
                })
            })
            if (!response.ok) console.error("❌ ส่งเมลไม่สำเร็จ")
        } catch (err: any) {
            console.error("❌ เกิดข้อผิดพลาด API ส่งเมล:", err.message)
        }
    }

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoomId) return toast.error("กรุณาเลือกห้องพักก่อน")
        if (Number(waterCurr) < Number(waterPrev)) return toast.error("เลขมิเตอร์น้ำครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้")
        if (Number(electricCurr) < Number(electricPrev)) return toast.error("เลขมิเตอร์ไฟครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้")

        setCreating(true)
        try {
            if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพักที่เลือก")
            const { data: userData } = await supabase.from("users").select("id, email, name").eq("room_id", selectedRoomId).maybeSingle()

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 7)

            const { error } = await supabase
                .from("invoices")
                .insert([{
                    room_id: selectedRoomId,
                    room_number: targetRoom.room_number,
                    room_price: rPrice,
                    water_price: wPrice,
                    electric_price: ePrice,
                    water_prev: Number(waterPrev),
                    water_curr: Number(waterCurr),
                    electric_prev: Number(electricPrev),
                    electric_curr: Number(electricCurr),
                    total_amount: totalAmount,
                    month: Number(month),
                    year: Number(year),
                    status: "PENDING",
                    due_date: dueDate.toISOString(),
                }])

            if (error) throw error

            if (userData && userData.email) {
                await sendEmailNotification(userData.email, targetRoom.room_number, totalAmount, Number(month))
                toast.success(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จ และส่งอีเมลแจ้งเตือนเรียบร้อย 🚀`)
            } else {
                toast.success(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จแล้ว (ไม่พบอีเมลผู้เช่า) 🚀`)
            }

            setWaterPrev(""); setWaterCurr(""); setElectricPrev(""); setElectricCurr(""); setSelectedRoomId("")
            fetchWaitingInvoices()
            fetchPendingInvoices() // 🎯 โหลดตารางใหม่หลังสร้างบิลเสร็จ บิลจะวิ่งไปอยู่ตารางล่างทันที
        } catch (error: any) {
            toast.error("ไม่สามารถสร้างบิลได้: " + error.message)
        } finally {
            setCreating(false)
        }
    }

    const handleAdminLogout = async () => {
        localStorage.removeItem("admin_email")
        const { signOut } = await import("next-auth/react")
        await signOut({ callbackUrl: "/admin-login" })
    }

    useEffect(() => {
        const checkCurrentAdmin = async () => {
            if (status === "loading") return
            const userRole = (session?.user as any)?.role

            if (!session || userRole !== "ADMIN") {
                const savedEmail = localStorage.getItem("admin_email")
                if (savedEmail) {
                    const { data: userData } = await supabase.from("users").select("role").eq("email", savedEmail).maybeSingle()
                    if (userData?.role === "ADMIN") {
                        // 🛠️ โหลดข้อมูลรายการแจ้งซ่อมเพิ่มเข้ามาด้วย
                        Promise.all([fetchWaitingInvoices(), fetchPendingInvoices(), fetchRooms(), fetchRepairRequests()]).then(() => setLoading(false))
                        return
                    }
                }
                router.replace("/admin-login")
                return
            }
            // 🎯 โหลดข้อมูลทั้งหมด 4 ส่วนพร้อมกันตอนเข้าหน้าแรก
            Promise.all([fetchWaitingInvoices(), fetchPendingInvoices(), fetchRooms(), fetchRepairRequests()]).then(() => setLoading(false))
        }
        checkCurrentAdmin()
    }, [session, status, router])

    if (loading) {
        return <LoadingScreen message="กำลังตรวจสอบข้อมูลสิทธิ์แอดมิน..." />
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="mx-auto max-w-5xl space-y-6"> {/* 🎯 เพิ่ม gap ระยะห่างระหว่างเซกชัน */}
                <AdminHeader onLogout={handleAdminLogout} />

                <CreateInvoiceForm
                    rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId}
                    month={month} setMonth={setMonth} year={year} setYear={setYear}
                    waterPrev={waterPrev} setWaterPrev={setWaterPrev} waterCurr={waterCurr} setWaterCurr={setWaterCurr}
                    electricPrev={electricPrev} setElectricPrev={setElectricPrev} electricCurr={electricCurr} setElectricCurr={setElectricCurr}
                    creating={creating} onSubmit={handleCreateInvoice} WATER_RATE={WATER_RATE} ELECTRIC_RATE={ELECTRIC_RATE}
                    rPrice={rPrice} waterUnits={waterUnits} wPrice={wPrice} electricUnits={electricUnits} ePrice={ePrice} totalAmount={totalAmount}
                />

                {/* ตารางที่ 1: รอตรวจสลิป (ไม่มีปุ่มลบแล้ว) */}
                <WaitingInvoicesTable
                    invoices={invoices} updatingId={updatingId}
                    onApprove={handleApprove} onReject={handleReject}
                />

                {/* 🎯 ตารางที่ 2: บิลค้างชำระทั้งหมดประจำเดือน (มีปุ่มลบอยู่ที่นี่) */}
                <PendingInvoicesTable
                    invoices={pendingInvoices}
                    updatingId={updatingId}
                    onDelete={handleDeleteInvoice}
                />

                {/* 🛠️ ตารางที่ 3: ระบบจัดการงานแจ้งซ่อมจากผู้เช่า (เพิ่มมาใหม่ล่างสุด) */}
                <RepairRequestsTable
                    repairs={repairRequests}
                    updatingId={updatingId}
                    onUpdateStatus={handleUpdateRepairStatus}
                />
            </div>
        </div>
    )
}