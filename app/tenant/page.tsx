"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TenantDashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [tenantName, setTenantName] = useState<string>("กำลังโหลด...") // ✨ เพิ่ม State เก็บชื่อผู้เช่าจริง
    const [invoice, setInvoice] = useState<any>(null) 
    const [paidInvoices, setPaidInvoices] = useState<any[]>([]) 
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    // 1. ฟังก์ชันดึงข้อมูลบิลของผู้เช่า
    const fetchInvoiceData = useCallback(async (userId: string) => {
        setLoading(true)
        try {
            // ดึงชื่อเต็มและ Room ID ไปพร้อมๆ กันเลยเพื่อลดความซ้ำซ้อน
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("room_id, name")
                .eq("id", userId)
                .maybeSingle()

            if (userError) throw userError

            if (userData?.name) {
                setTenantName(userData.name) // 🎉 เซฟชื่อผู้เช่าที่ดึงมาจากเบสจริงลงใน State
            }

            if (!userData || !userData.room_id) {
                console.warn("⚠️ ไม่พบ Room ID ที่ผูกกับ User ID นี้");
                setInvoice(null);
                setPaidInvoices([]);
                return;
            }

            const realRoomId = userData.room_id

            // ขั้นตอนที่ B: ดึงบิลปัจจุบันที่ยังจ่ายไม่เสร็จ
            const { data: currentData, error: currentError } = await supabase
                .from("invoices")
                .select("*")
                .eq("room_id", realRoomId)
                .order("created_at", { ascending: false })

            // คัดกรองสถานะบิลฝั่ง Client เพื่อความแม่นยำ
            const currentBill = currentData?.find(inv => inv.status === "PENDING" || inv.status === "WAITING")
            setInvoice(currentBill || null)

            // ขั้นตอนที่ C: ดึงประวัติบิลย้อนหลังที่จ่ายเงินเสร็จแล้ว (PAID)
            const historyBills = currentData?.filter(inv => inv.status === "PAID") || []
            setPaidInvoices(historyBills)

        } catch (error: any) {
            console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // 2. ฟังก์ชันอัปโหลดสลิปเงินโอนเข้า Storage
    const handleUploadSlip = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !invoice) return alert("กรุณาเลือกไฟล์สลิปก่อนนะจ๊ะ!")

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${invoice.id}-${Date.now()}.${fileExt}`
            const filePath = `slips/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from("slips")
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from("slips")
                .getPublicUrl(filePath)

            const { error: updateInvoiceError } = await supabase
                .from("invoices")
                .update({
                    slip_url: publicUrl,
                    status: "WAITING"
                })
                .eq("id", invoice.id)

            if (updateInvoiceError) throw updateInvoiceError

            const { error: insertPaymentError } = await supabase
                .from("payments")
                .insert([{
                    invoice_id: invoice.id,
                    user_id: localStorage.getItem("tenant_user_id"), 
                    amount: invoice.total_amount, 
                    payment_method: "TRANSFER",   
                    slip_url: publicUrl           
                }])

            if (insertPaymentError) throw insertPaymentError

            alert("อัปโหลดสลิปสำเร็จ! รอเจ้าของหอตรวจสอบนะจ๊ะ 🎉")
            setFile(null)

            const currentUserId = localStorage.getItem("tenant_user_id")
            if (currentUserId) {
                fetchInvoiceData(currentUserId)
            }

        } catch (error: any) {
            alert("เกิดข้อผิดพลาดในการอัปโหลด: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    // 3. ควบคุม Flow การเช็คชื่อผู้ใช้งาน
    useEffect(() => {
        const savedEmail = localStorage.getItem("tenant_email")
        if (!savedEmail) {
            router.replace("/login")
            return
        }

        const fetchUserData = async () => {
            const { data, error } = await supabase
                .from("users")
                .select("id, name")
                .eq("email", savedEmail)
                .maybeSingle()
            
            if (data?.id) {
                localStorage.setItem("tenant_user_id", data.id)
                if (data.name) setTenantName(data.name) // 🎯 บังคับอัปเดตชื่อผู้ใช้งานจริงทันที
                fetchInvoiceData(data.id)
            } else {
                router.replace("/login")
            }
        }
        fetchUserData()
    }, [router, fetchInvoiceData])

    const handleLogout = async () => {
        localStorage.clear() // เคลียร์ค่าทั้งหมดให้เกลี้ยงในคำสั่งเดียว
        router.push("/login")
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังโหลดข้อมูลห้องพักของคุณ...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-4xl">

                {/* ส่วนหัวของหน้าจอ */}
                <div className="flex items-center justify-between border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🏢 ยินดีต้อนรับสู่ DormPay</h1>
                        {/* 🟢 อัปเดตเปลี่ยนมาดึงข้อมูลชื่อจาก state tenantName แทน session เดิม */}
                        <p className="text-sm text-gray-500">ผู้เช่า: {tenantName}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition shadow-sm"
                    >
                        ออกจากระบบ
                    </button>
                </div>

                {/* บล็อกหลักแสดงบิลปัจจุบัน */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* ฝั่งซ้าย: รายละเอียดค่าใช้จ่าย */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">📅 ยอดบิลที่ต้องชำระ</h2>
                        {!invoice ? (
                            <div className="text-green-600 font-semibold py-6 text-center bg-green-50 rounded-lg">
                                🎉 เยี่ยมมาก! เดือนนี้คุณไม่มียอดค้างชำระแล้ว
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm border-b pb-2">
                                    <span className="text-gray-500">ประจำเดือน:</span>
                                    <span className="font-bold text-gray-800">{invoice.month}/{invoice.year}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">ค่าห้องพักปกติ:</span>
                                    <span className="font-semibold">฿{invoice.room_price?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">ค่าน้ำประปา:</span>
                                    <span className="font-semibold">฿{invoice.water_price?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b pb-2">
                                    <span className="text-gray-500">ค่าไฟฟ้า:</span>
                                    <span className="font-semibold">฿{invoice.electric_price?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 text-blue-600">
                                    <span>ยอดรวมทั้งหมด:</span>
                                    <span>฿{invoice.total_amount?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ฝั่งขวา: แนบหลักฐานการโอนเงิน */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-2 text-gray-700">💰 ช่องทางการชำระเงิน</h2>
                            <p className="text-xs text-gray-500 mb-4">ธนาคารกสิกรไทย • เลขบัญชี: 000-0-00000-0 • ชื่อบัญชี: หอพัก DormPay</p>
                        </div>

                        {invoice ? (
                            invoice.status === "WAITING" ? (
                                <div className="text-center py-6 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-semibold text-sm">
                                    ⏳ ส่งสลิปแล้ว รอเจ้าของหอตรวจสอบความถูกต้องนะจ๊ะ
                                </div>
                            ) : (
                                <form onSubmit={handleUploadSlip} className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">แนบภาพสลิปเงินโอน</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full rounded-md bg-green-600 py-2.5 font-bold text-white hover:bg-green-700 transition shadow-sm disabled:bg-gray-400 text-sm"
                                    >
                                        {uploading ? "กำลังส่งสลิป..." : "🚀 ยืนยันการส่งสลิป"}
                                    </button>
                                </form>
                            )
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                ไม่มีบิลค้างชำระ ไม่ต้องส่งสลิปจ้า
                            </div>
                        )}
                    </div>
                </div>

                {/* 📜 ตารางประวัติการชำระเงินย้อนหลัง */}
                <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                        📜 ประวัติใบแจ้งหนี้และการชำระเงินย้อนหลัง
                    </h3>

                    {paidInvoices.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">
                            ยังไม่มีประวัติการชำระเงินในระบบของคุณ
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                        <th className="p-3">ประจำเดือน</th>
                                        <th className="p-3">ค่าห้อง</th>
                                        <th className="p-3">ค่าน้ำ</th>
                                        <th className="p-3">ค่าไฟ</th>
                                        <th className="p-3">ยอดรวมทั้งหมด</th>
                                        <th className="p-3 text-center">Approve Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {paidInvoices.map((hist) => (
                                        <tr key={hist.id} className="hover:bg-gray-50 transition text-gray-600">
                                            <td className="p-3 font-semibold text-gray-800">เดือน {hist.month}/{hist.year}</td>
                                            <td className="p-3">฿{hist.room_price?.toLocaleString()}</td>
                                            <td className="p-3">฿{hist.water_price?.toLocaleString()}</td>
                                            <td className="p-3">฿{hist.electric_price?.toLocaleString()}</td>
                                            <td className="p-3 font-bold text-gray-800">฿{hist.total_amount?.toLocaleString()}</td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    🟢 PAID
                                                </span>
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