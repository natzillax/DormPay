"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

// เชื่อมต่อ Supabase ฝั่งฟรอนต์เอนด์
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    // 🛠️ ฟังก์ชันสำหรับส่งสลิปไปที่ Supabase
    const handleUploadSlip = async () => {
        if (!file || !invoice) return alert("กรุณาเลือกรูปภาพสลิปก่อนจ้า!")

        setUploading(true)
        try {
            // 1. ตั้งชื่อไฟล์รูปภาพไม่ให้ซ้ำกัน
            const fileExt = file.name.split('.').pop()
            const fileName = `slip_${invoice.id}_${Date.now()}.${fileExt}`

            // 2. อัปโหลดไฟล์ขึ้นไปที่ Supabase Storage ถัง 'slips'
            const { data: storageData, error: storageError } = await supabase.storage
                .from('slips')
                .upload(fileName, file, { upsert: true })

            if (storageError) throw storageError

            // 3. ดึงลิงก์ URL ของรูปภาพ
            const { data: urlData } = supabase.storage
                .from('slips')
                .getPublicUrl(fileName)

            // 4. อัปเดตสถานะบิลในตารางเป็น WAITING
            const { error: updateError } = await supabase
                .from('invoices')
                .update({
                    status: 'WAITING',
                    slip_url: urlData.publicUrl
                })
                .eq('id', invoice.id)

            if (updateError) throw updateError

            alert("อัปโหลดสลิปสำเร็จ! รอเจ้าของหอตรวจสอบนะจ๊ะ 🎉")
            window.location.reload()

        } catch (error: any) {
            alert("เกิดข้อผิดพลาด: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }

        if (status === "authenticated" && session?.user?.email) {
            const fetchInvoiceData = async () => {
                // 1. ดึงข้อมูลห้องพักผ่านอีเมลของผู้เช่า
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("room_id")
                    .eq("email", session.user?.email)
                    .single()

                if (userError || !userData?.room_id) {
                    console.log("❌ ไม่พบ room_id ของอีเมลนี้:", userError)
                    setLoading(false)
                    return
                }

                // 2. ดึงใบแจ้งหนี้ล่าสุด
                const { data, error } = await supabase
                    .from("invoices")
                    .select(`
                        *,
                        rooms ( room_number, price )
                    `)
                    .eq("room_id", userData.room_id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single()

                if (!error && data) {
                    setInvoice(data)
                    console.log("👉 ข้อมูลบิลที่ดึงได้จาก Supabase คือ:", data) // 👈 เพิ่มบรรทัดนี้
                }
                setLoading(false)
            }

            fetchInvoiceData()
        }
    }, [status, session, router])

    if (status === "loading" || loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังโหลดข้อมูลห้องพัก...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 text-black">
            <div className="mx-auto max-w-4xl">

                {/* Header โซนบน */}
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">ยินดีต้อนรับ {session?.user?.name}</h1>
                        <p className="text-gray-500">ระบบจัดการค่าเช่าและบิลออนไลน์</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition"
                    >
                        ออกจากระบบ
                    </button>
                </div>

                {/* แสดงข้อมูลบิล */}
                {invoice ? (
                    <div className="grid gap-6 md:grid-cols-3">

                        {/* การ์ดสรุปยอดที่ต้องจ่าย */}
                        <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">🧾 ใบแจ้งหนี้ประจำเดือน {invoice.month}/{invoice.year}</h2>

                            <div className="space-y-3 border-b pb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ค่าห้องพักปกติ</span>
                                    <span className="font-semibold">฿{invoice.room_price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ค่าน้ำประปา</span>
                                    <span className="font-semibold">฿{invoice.water_price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ค่าไฟฟ้า</span>
                                    <span className="font-semibold">฿{invoice.electric_price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 items-center">
                                <span className="text-lg font-bold text-gray-800">ยอดรวมทั้งหมดที่ต้องชำระ:</span>
                                <span className="text-3xl font-extrabold text-blue-600">฿{invoice.total_amount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* การ์ดสถานะและการชำระเงิน */}
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">สถานะบิล</h3>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                    invoice.status === 'WAITING' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {invoice.status === 'PAID' ? 'ชำระเงินสำเร็จแล้ว' :
                                        invoice.status === 'WAITING' ? '⏳ รอเจ้าของหอตรวจสอบ' : '🔴 ค้างชำระเงิน'}
                                </span>

                                <p className="text-xs text-gray-400 mt-4">กำหนดชำระก่อน: {new Date(invoice.due_date).toLocaleDateString('th-TH')}</p>
                            </div>

                            {/* แสดงฟอร์มแนบสลิป เฉพาะตอนที่บิลยังค้างชำระ (PENDING) เท่านั้น */}
                            {invoice.status === 'PENDING' && (
                                <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📸 แนบหลักฐานการโอนเงิน</h4>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />

                                    <button
                                        onClick={handleUploadSlip}
                                        disabled={uploading}
                                        className="mt-4 w-full rounded-lg bg-green-600 py-2.5 font-bold text-white hover:bg-green-700 transition disabled:bg-gray-400"
                                    >
                                        {uploading ? "กำลังอัปโหลด..." : "🚀 ยืนยันการส่งสลิป"}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-100">
                        <p className="text-lg text-gray-500">🎉 ยินดีด้วย เดือนนี้คุณยังไม่มีบิลค้างชำระ!</p>
                    </div>
                )}

            </div>
        </div>
    )
}