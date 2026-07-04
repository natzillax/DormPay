// src/app/landlord/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

// 📦 Import ชิ้นส่วนย่อยที่เราแยกออกมา (Path เดียวกันในโฟลเดอร์ landlord)
import AdminHeader from "./AdminHeader"
import CreateInvoiceForm from "./CreateInvoiceForm"
import WaitingInvoicesTable from "./WaitingInvoicesTable"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordPage() {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [invoices, setInvoices] = useState<any[]>([])
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

    const fetchRooms = async () => {
        const { data, error } = await supabase
            .from("rooms")
            .select("id, room_number, price")
            .order("room_number", { ascending: true })

        if (!error && data) setRooms(data)
    }

    const handleApprove = async (invoiceId: string) => {
        if (!confirm("คุณตรวจสอบสลิปยอดเงินถูกต้อง และต้องการอนุมัติบิลนี้ใช่หรือไม่?")) return
        setUpdatingId(invoiceId)
        const { error } = await supabase.from("invoices").update({ status: "PAID" }).eq("id", invoiceId)
        if (!error) {
            alert("อนุมัติยอดชำระเงินเรียบร้อยแล้วจ้า! 🎉")
            fetchWaitingInvoices()
        } else {
            alert("เกิดข้อผิดพลาดในการอนุมัติ: " + error.message)
        }
        setUpdatingId(null)
    }

    const handleReject = async (invoiceId: string) => {
        if (!confirm("คุณต้องการปฏิเสธสลิปนี้เพื่อให้ผู้เช่าอัปโหลดใหม่ใช่หรือไม่?")) return
        setUpdatingId(invoiceId)
        const { error } = await supabase.from("invoices").update({ status: "PENDING", slip_url: null }).eq("id", invoiceId)
        if (!error) {
            alert("ปฏิเสธสลิปเรียบร้อย ระบบจะแจ้งผู้เช่าให้ส่งสลิปใหม่ครับ ❌")
            fetchWaitingInvoices()
        } else {
            alert("เกิดข้อผิดพลาด: " + error.message)
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
        if (!selectedRoomId) return alert("กรุณาเลือกห้องพักก่อนจ้า!")
        if (Number(waterCurr) < Number(waterPrev)) return alert("❌ เลขมิเตอร์น้ำครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้นะครับ")
        if (Number(electricCurr) < Number(electricPrev)) return alert("❌ เลขมิเตอร์ไฟครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้นะครับ")

        setCreating(true)
        try {
            if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพักที่เลือก")
            const { data: userData } = await supabase.from("users").select("id, email, name").eq("room_id", selectedRoomId).maybeSingle()

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 7)

            const { error } = await supabase.from("invoices").insert([{
                room_id: selectedRoomId,
                room_price: rPrice,
                water_price: wPrice,
                electric_price: ePrice,
                total_amount: totalAmount,
                month: Number(month),
                year: Number(year),
                status: "PENDING",
                due_date: dueDate.toISOString(),
            }])

            if (error) throw error

            if (userData && userData.email) {
                await sendEmailNotification(userData.email, targetRoom.room_number, totalAmount, Number(month))
                alert(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จ และส่งอีเมลแจ้งเตือนเรียบร้อย! 🚀`)
            } else {
                alert(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จแล้ว! (ไม่พบอีเมลผู้เช่า) 🚀`)
            }

            setWaterPrev(""); setWaterCurr(""); setElectricPrev(""); setElectricCurr(""); setSelectedRoomId("")
            fetchWaitingInvoices()
        } catch (error: any) {
            alert("ไม่สามารถสร้างบิลได้: " + error.message)
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
                        Promise.all([fetchWaitingInvoices(), fetchRooms()]).then(() => setLoading(false))
                        return
                    }
                }
                router.replace("/admin-login")
                return
            }
            Promise.all([fetchWaitingInvoices(), fetchRooms()]).then(() => setLoading(false))
        }
        checkCurrentAdmin()
    }, [session, status, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center text-black">
                <p className="font-semibold text-gray-500">กำลังตรวจสอบข้อมูลสิทธิ์แอดมิน...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-5xl">
                {/* 🧩 ประกอบชิ้นส่วนแผงควบคุมแอดมิน */}
                <AdminHeader onLogout={handleAdminLogout} />
                
                <CreateInvoiceForm 
                    rooms={rooms} selectedRoomId={selectedRoomId} setSelectedRoomId={setSelectedRoomId}
                    month={month} setMonth={setMonth} year={year} setYear={setYear}
                    waterPrev={waterPrev} setWaterPrev={setWaterPrev} waterCurr={waterCurr} setWaterCurr={setWaterCurr}
                    electricPrev={electricPrev} setElectricPrev={setElectricPrev} electricCurr={electricCurr} setElectricCurr={setElectricCurr}
                    creating={creating} onSubmit={handleCreateInvoice} WATER_RATE={WATER_RATE} ELECTRIC_RATE={ELECTRIC_RATE}
                    rPrice={rPrice} waterUnits={waterUnits} wPrice={wPrice} electricUnits={electricUnits} ePrice={ePrice} totalAmount={totalAmount}
                />

                <WaitingInvoicesTable 
                    invoices={invoices} updatingId={updatingId} 
                    onApprove={handleApprove} onReject={handleReject} 
                />
            </div>
        </div>
    )
}