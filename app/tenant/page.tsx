// src/app/tenant/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/NotificationProvider"
import LoadingScreen from "@/components/LoadingScreen"

// 📦 Import ชิ้นส่วน UI
import TenantHeader from "./TenantHeader"
import InvoiceDetail from "./InvoiceDetail"
import PaymentForm from "./PaymentForm"
import InvoiceHistory from "./InvoiceHistory"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TenantDashboardPage() {
    const router = useRouter()
    const toast = useToast()
    const [tenantName, setTenantName] = useState<string>("กำลังโหลด...")
    const [roomId, setRoomId] = useState<string | null>(null)
    
    // 🎯 เก็บบิลค้างชำระทั้งหมดแยกเป็น Array เพื่อสลับฝั่ง UI ได้
    const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]) 
    const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState<number>(0)
    
    const [paidInvoices, setPaidInvoices] = useState<any[]>([]) 
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    // 🛠️ State สำหรับระบบแจ้งซ่อม
    const [repairTitle, setRepairTitle] = useState("")
    const [repairDesc, setRepairDesc] = useState("")
    const [submittingRepair, setSubmittingRepair] = useState(false)

    // บิลใบที่ผู้เช่าเลือกเปิดดูรายละเอียดอยู่ปัจจุบัน
    const currentActiveInvoice = unpaidInvoices[selectedInvoiceIndex] || null

    const fetchInvoiceData = useCallback(async (userId: string) => {
        setLoading(true)
        try {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("room_id, name")
                .eq("id", userId)
                .maybeSingle()

            if (userError) throw userError
            if (userData?.name) setTenantName(userData.name)
            if (userData?.room_id) setRoomId(userData.room_id)

            if (!userData || !userData.room_id) {
                setUnpaidInvoices([]);
                setPaidInvoices([]);
                return;
            }

            const { data: currentData, error: currentError } = await supabase
                .from("invoices")
                .select("*")
                .eq("room_id", userData.room_id)
                .order("year", { ascending: false })
                .order("month", { ascending: false })

            if (currentError) throw currentError

            if (currentData) {
                // 🎯 ฟิลเตอร์กรองแยกบิลที่ยังชำระไม่เสร็จสิ้นทั้งหมดออกเป็นชุดข้อมูล
                const unpaids = currentData.filter(inv => inv.status === "PENDING" || inv.status === "WAITING")
                setUnpaidInvoices(unpaids)
                
                // แยกชุดประวัติบิลที่ชำระเรียบร้อยแล้วสำเร็จ
                setPaidInvoices(currentData.filter(inv => inv.status === "PAID"))
            }

        } catch (error: any) {
            console.error("❌ Error fetching billing data:", error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleUploadSlip = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !currentActiveInvoice) return toast.error("กรุณาเลือกไฟล์สลิปก่อน")

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${currentActiveInvoice.id}-${Date.now()}.${fileExt}`
            const filePath = `slips/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from("slips")
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(filePath)

            await supabase.from("invoices").update({ slip_url: publicUrl, status: "WAITING" }).eq("id", currentActiveInvoice.id)
            await supabase.from("payments").insert([{
                invoice_id: currentActiveInvoice.id,
                user_id: localStorage.getItem("tenant_user_id"), 
                amount: currentActiveInvoice.total_amount, 
                payment_method: "TRANSFER",   
                slip_url: publicUrl           
            }])

            toast.success("อัปโหลดสลิปสำเร็จ! รอเจ้าของหอตรวจสอบนะ 🎉")
            setFile(null)
            
            // ดึงข้อมูลใหม่หลังจากส่งสลิปเพื่ออัปเดตสเตทบน UI หน้าจอ
            await fetchInvoiceData(localStorage.getItem("tenant_user_id") || "")
            setSelectedInvoiceIndex(0)

        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาดในการอัปโหลด: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleCreateRepairRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        const userId = localStorage.getItem("tenant_user_id")

        if (!userId || !roomId) return toast.error("ไม่พบข้อมูลผู้เช่าหรือห้องพัก")
        if (!repairTitle.trim() || !repairDesc.trim()) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน")

        setSubmittingRepair(true)
        try {
            // 🎯 สั่ง Insert เฉพาะ room_id ข้อมูลจะสัมพันธ์กับตารางห้องพักโดยไม่จำกัดความซ้ำซ้อนของเลขห้อง
            const { error } = await supabase
                .from("repair_requests")
                .insert([{
                    room_id: roomId,
                    user_id: userId,
                    title: repairTitle,
                    description: repairDesc,
                    status: "PENDING"
                }])

            if (error) throw error

            toast.success("ส่งข้อมูลแจ้งซ่อมเรียบร้อย แอดมินจะดำเนินการตรวจสอบให้ครับ 🛠️")
            setRepairTitle("")
            setRepairDesc("")
        } catch (error: any) {
            toast.error("ไม่สามารถแจ้งซ่อมได้: " + error.message)
        } finally {
            setSubmittingRepair(false)
        }
    }

    useEffect(() => {
        const savedEmail = localStorage.getItem("tenant_email")
        if (!savedEmail) {
            router.replace("/login")
            return
        }

        const fetchUserData = async () => {
            const { data } = await supabase.from("users").select("id, name").eq("email", savedEmail).maybeSingle()
            if (data?.id) {
                localStorage.setItem("tenant_user_id", data.id)
                if (data.name) setTenantName(data.name)
                fetchInvoiceData(data.id)
            } else {
                router.replace("/login")
            }
        }
        fetchUserData()
    }, [router, fetchInvoiceData])

    const handleLogout = () => {
        localStorage.clear()
        router.push("/login")
    }

    if (loading) {
        return <LoadingScreen message="กำลังโหลดข้อมูลห้องพักของคุณ..." />
    }

    return (
        <div className="min-h-screen p-6 bg-gradient-to-tr from-purple-200 via-purple-100 to-pink-100">
            <div className="mx-auto max-w-4xl space-y-6">
                <TenantHeader tenantName={tenantName} onLogout={handleLogout} />
                
                {/* แถบแจ้งเตือนเมื่อตรวจพบบิลสะสมค้างชำระมากกว่า 1 ใบ */}
                {unpaidInvoices.length > 1 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                        <p className="text-sm font-bold text-amber-800 mb-2">⚠️ คุณมีบิลที่ยังไม่ได้เคลียร์ยอดทั้งหมด {unpaidInvoices.length} ใบ เลือกเดือนที่ต้องการจัดการ:</p>
                        <div className="flex flex-wrap gap-2">
                            {unpaidInvoices.map((inv, idx) => (
                                <button
                                    key={inv.id}
                                    onClick={() => setSelectedInvoiceIndex(idx)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                                        selectedInvoiceIndex === idx
                                            ? "bg-amber-600 text-white shadow"
                                            : "bg-white text-gray-700 border hover:bg-gray-100"
                                    }`}
                                >
                                    📆 บิลเดือน {inv.month}/{inv.year} 
                                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
                                        inv.status === "WAITING" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                    }`}>
                                        {inv.status === "WAITING" ? "รอตรวจสลิป" : "ค้างชำระ"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* บล็อกแสดงรายละเอียดหนี้และฟอร์มชำระเงินแนบไฟล์ */}
                <div className="grid gap-6 md:grid-cols-2">
                    <InvoiceDetail invoice={currentActiveInvoice} />
                    <PaymentForm 
                        invoice={currentActiveInvoice} 
                        uploading={uploading} 
                        onFileChange={setFile} 
                        onSubmit={handleUploadSlip} 
                    />
                </div>

                {/* ส่วนกล่องฟอร์มสำหรับแจ้งซ่อมบำรุงรักษา */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                        🔧 แจ้งซ่อมและรายงานปัญหาภายในห้องพัก
                    </h2>
                    <form onSubmit={handleCreateRepairRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">หัวข้อปัญหา (เช่น ท่อน้ำอุดตัน, ไฟดับ)</label>
                            <input 
                                type="text"
                                value={repairTitle}
                                onChange={(e) => setRepairTitle(e.target.value)}
                                placeholder="พิมพ์หัวข้อปัญหาที่พบ..."
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">รายละเอียดสิ่งของชำรุดเพิ่มเติม</label>
                            <textarea 
                                value={repairDesc}
                                onChange={(e) => setRepairDesc(e.target.value)}
                                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submittingRepair}
                            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition shadow-sm disabled:bg-gray-400"
                        >
                            {submittingRepair ? "กำลังส่งข้อมูล..." : "🚀 ส่งคำขอแจ้งซ่อม"}
                        </button>
                    </form>
                </div>

                {/* ส่วนประวัติบิลย้อนหลัง */}
                <InvoiceHistory paidInvoices={paidInvoices} />
            </div>
        </div>
    )
}