"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react" // ✨ นำเข้า useSession เพื่อดึงสิทธิ์แอดมิน

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordPage() {
    const router = useRouter()
    const { data: session, status } = useSession() // ✨ เรียกใช้งานเซสชันปัจจุบันของระบบ

    const [invoices, setInvoices] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    // 💰 กำหนดราคาค่าน้ำค่าไฟต่อหน่วยไว้ตรงนี้
    const WATER_RATE = 18;   // ค่าน้ำหน่วยละ 18 บาท
    const ELECTRIC_RATE = 7; // ค่าไฟหน่วยละ 7 บาท

    // --- State สำหรับฟอร์มสร้างบิลใหม่ ---
    const [selectedRoomId, setSelectedRoomId] = useState("")
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [creating, setCreating] = useState(false)

    // 💧 State สำหรับคำนวณน้ำ (เก็บค่าเลขมิเตอร์)
    const [waterPrev, setWaterPrev] = useState("")
    const [waterCurr, setWaterCurr] = useState("")

    // ⚡ State สำหรับคำนวณไฟ (เก็บค่าเลขมิเตอร์)
    const [electricPrev, setElectricPrev] = useState("")
    const [electricCurr, setElectricCurr] = useState("")

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
                status: "PENDING",
                slip_url: null
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

    // 🧮 ส่วนคำนวณจำนวนหน่วยและยอดเงิน Real-time บนหน้าจอ
    const targetRoom = rooms.find(r => r.id === selectedRoomId)
    const rPrice = targetRoom ? Number(targetRoom.price) : 0

    const waterUnits = Math.max(0, Number(waterCurr) - Number(waterPrev))
    const wPrice = waterUnits * WATER_RATE

    const electricUnits = Math.max(0, Number(electricCurr) - Number(electricPrev))
    const ePrice = electricUnits * ELECTRIC_RATE

    const totalAmount = rPrice + wPrice + ePrice

    // 📩 ฟังก์ชันจำลองการส่งอีเมลแจ้งเตือนผู้เช่า
    const sendEmailNotification = async (email: string, roomNumber: string, amount: number, currentMonth: number) => {
        try {
            console.log(`📧 กำลังส่งอีเมลแจ้งค่าหอไปยัง: ${email}`);
            const subject = `📢 แจ้งยอดชำระค่าหอพัก ห้อง ${roomNumber} ประจำเดือน ${currentMonth}`;
            const message = `เรียน ผู้เช่าห้อง ${roomNumber}\n\nขณะนี้บิลค่าหอพักประจำเดือนได้ออกเรียบร้อยแล้ว\nยอดเงินที่ต้องชำระสุทธิ: ฿${amount.toLocaleString()} บาท\n\nกรุณาเข้าสู่ระบบ DormPay เพื่อตรวจสอบรายละเอียดและแนบสลิปหลักฐานการโอนเงินภายใน 7 วันค่ะ\n\nขอบคุณค่ะ\nระบบ DormPay Admin`;

            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: subject,
                    text: message
                })
            });

            const result = await response.json();
            if (response.ok) {
                console.log("✅ อีเมลถูกส่งไปยังผู้เช่าเรียบร้อยแล้วจริงๆ!", result);
            } else {
                console.error("❌ ส่งเมลไม่สำเร็จจากเซิร์ฟเวอร์:", result.error);
            }
        } catch (err: any) {
            console.error("❌ เกิดข้อผิดพลาดตอนเชื่อมต่อ API ส่งเมล:", err.message);
        }
    }

    // 4. ฟังก์ชันสร้างใบแจ้งหนี้ใบใหม่ส่งให้ผู้เช่า
    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoomId) return alert("กรุณาเลือกห้องพักก่อนจ้า!")
        if (Number(waterCurr) < Number(waterPrev)) return alert("❌ เลขมิเตอร์น้ำครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้นะครับ")
        if (Number(electricCurr) < Number(electricPrev)) return alert("❌ เลขมิเตอร์ไฟครั้งนี้ น้อยกว่าครั้งก่อนไม่ได้นะครับ")

        setCreating(true)
        try {
            if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพักที่เลือก")

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id, email, name")
                .eq("room_id", selectedRoomId)
                .maybeSingle();

            if (userError) {
                console.warn("⚠️ ไม่พบอีเมลผู้เช่าสำหรับห้องนี้ หรือยังไม่มีผู้เช่าเข้าอยู่:", userError.message);
            }

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 7)

            const { error } = await supabase
                .from("invoices")
                .insert([{
                    room_id: selectedRoomId,
                    //user_id: userData?.id || null, // 👈 บันทึก id ของผู้เช่าผูกติดไปกับบิลใบนี้เลย ✨
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
                await sendEmailNotification(userData.email, targetRoom.room_number, totalAmount, Number(month));
                alert(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จ และส่งอีเมลแจ้งเตือนไปยัง ${userData.email} เรียบร้อยแล้ว! 🚀`);
            } else {
                alert(`สร้างบิลห้อง ${targetRoom.room_number} สำเร็จแล้ว! (แต่ไม่ได้ส่งเมลเนื่องจากไม่พบอีเมลผู้เช่าผูกกับห้องนี้) 🚀`);
            }

            setWaterPrev("")
            setWaterCurr("")
            setElectricPrev("")
            setElectricCurr("")
            setSelectedRoomId("")
            fetchWaitingInvoices()

        } catch (error: any) {
            alert("ไม่สามารถสร้างบิลได้: " + error.message)
        } finally {
            setCreating(false)
        }
    }

    // 🚪 5. ฟังก์ชัน Logout ฝั่ง Admin ปรับปรุงใหม่ให้ใช้งานร่วมกับ Next-Auth อย่างปลอดภัย
    const handleAdminLogout = async () => {
        localStorage.removeItem("admin_email");
        const { signOut } = await import("next-auth/react")
        await signOut({ callbackUrl: "/admin-login" })
    }

    // 🛡️ ปรับปรุงจุดเช็คสิทธิ์ให้เช็ค Session คู่กับระบบ Fallback Backup กันหลุดซ้ำซ้อน
    useEffect(() => {
        const checkCurrentAdmin = async () => {
            // ⏳ ถ้าระบบ Next-Auth กำลังดึงเซสชันอยู่ ให้รอก่อน
            if (status === "loading") return

            // เช็คจาก Session หลักของระบบก่อน
            if (!session || session.user?.role !== "ADMIN") {

                // 🔄 แผนสำรอง (Fallback): เช็คจาก LocalStorage ย้อนกลับไปตรวจในตาราง users เผื่อค่าดีเลย์
                const savedEmail = localStorage.getItem("admin_email")

                if (savedEmail) {
                    const { data: userData } = await supabase
                        .from("users")
                        .select("role")
                        .eq("email", savedEmail)
                        .maybeSingle()

                    if (userData?.role === "ADMIN") {
                        // ถ้าในฐานข้อมูลยืนยันว่าเป็นแอดมินตัวจริง ยอมรับและเปิดข้อมูลหน้าเพจต่อ
                        Promise.all([fetchWaitingInvoices(), fetchRooms()]).then(() => setLoading(false))
                        return
                    }
                }

                // 🚨 ถ้าตรวจทุกทางแล้วไม่มีสิทธิ์จริงๆ ดีดกลับหน้า login แอดมินทันที
                console.log("🚨 สิทธิ์ไม่ถูกต้อง หรือไม่ใช่แอดมินตัวจริง");
                router.replace("/admin-login")
                return
            }

            // 👑 สิทธิ์ถูกต้อง (เป็น ADMIN) โหลดตารางขึ้นหน้าจอได้เลยครับ
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

                {/* Header ส่วนบน */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🫅 แดชบอร์ดเจ้าของหอพัก (DormPay Admin)</h1>
                        <p className="text-sm text-gray-500">ระบบจัดการออกบิลค่าน้ำค่าไฟ และตรวจสอบสลิป</p>
                    </div>

                    {/* กลุ่มลิงก์เมนูเพื่อสลับหน้า */}
                    {/* 🛠️ ปรับ Flexbox ให้ดันปุ่มออกจากระบบไปขวาสุด และลด padding ปุ่มเล็กลงเพื่อไม่ให้ตกบรรทัด */}
                    <div className="flex items-center justify-between w-full md:w-auto flex-nowrap overflow-x-auto gap-1.5 pb-1">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            <Link href="/landlord/assign-tenant">
                                <button className="rounded-md bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap">
                                    🔗 ผูกห้องพัก
                                </button>
                            </Link>

                            <Link href="/landlord/manage-tenants">
                                <button className="rounded-md bg-purple-50 px-2.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 border border-purple-200 transition whitespace-nowrap">
                                    📋 แจ้งย้ายออก
                                </button>
                            </Link>

                            <Link href="/landlord/revenue">
                                <button className="rounded-md bg-green-50 px-2.5 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 border border-green-200 transition whitespace-nowrap">
                                    📊 รายได้
                                </button>
                            </Link>
                        </div>

                        {/* ปุ่มนี้จะขยับไปชิดขวาสุด และขนาดกระชับพอดีบรรทัด */}
                        <button
                            onClick={handleAdminLogout}
                            className="rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition shadow-sm whitespace-nowrap ml-2"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                </div>

                {/* ฟอร์มออกบิลค่าน้ำค่าไฟใหม่ */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-700">📝 ออกใบแจ้งหนี้ประจำเดือนใหม่ (ระบบคํานวณมิเตอร์อัตโนมัติ)</h2>
                    <form onSubmit={handleCreateInvoice} className="space-y-4 text-sm">

                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* เลือกห้องพัก */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">เลือกห้องพัก</label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-lg border p-2 bg-white border-gray-300"
                                    required
                                >
                                    <option value="">-- เลือกห้อง --</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>
                                    ))}
                                </select>
                            </div>

                            {/* เดือน */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">เดือน</label>
                                <input
                                    type="number"
                                    min="1" max="12"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full rounded-lg border p-2 border-gray-300"
                                    required
                                />
                            </div>

                            {/* ปี */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">ปี</label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full rounded-lg border p-2 border-gray-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* แสดงค่าห้องอัตโนมัติเมื่อเลือกห้อง */}
                        {selectedRoomId && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                                💵 ค่าห้องปกติของห้องนี้: <span className="font-bold text-gray-900">฿{rPrice.toLocaleString()} บาท</span>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* ส่วนกรอกข้อมูลน้ำ */}
                            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                                <h3 className="font-bold text-blue-600 mb-2">💧 มิเตอร์น้ำประปา (หน่วยละ ฿{WATER_RATE})</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">เลขมิเตอร์ครั้งก่อน</label>
                                        <input
                                            type="number"
                                            placeholder="ครั้งก่อน"
                                            value={waterPrev}
                                            onChange={(e) => setWaterPrev(e.target.value)}
                                            className="w-full rounded-lg border p-2 bg-white border-gray-300"
                                            required={!!selectedRoomId}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">เลขมิเตอร์ครั้งนี้</label>
                                        <input
                                            type="number"
                                            placeholder="ครั้งนี้"
                                            value={waterCurr}
                                            onChange={(e) => setWaterCurr(e.target.value)}
                                            className="w-full rounded-lg border p-2 bg-white border-gray-300"
                                            required={!!selectedRoomId}
                                        />
                                    </div>
                                </div>
                                {waterUnits > 0 && (
                                    <p className="text-xs text-blue-700 font-medium mt-1">ใช้ไป {waterUnits} หน่วย = ฿{wPrice.toLocaleString()} บาท</p>
                                )}
                            </div>

                            {/* ส่วนกรอกข้อมูลไฟ */}
                            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40">
                                <h3 className="font-bold text-amber-600 mb-2">⚡ มิเตอร์ไฟฟ้า (หน่วยละ ฿{ELECTRIC_RATE})</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">เลขมิเตอร์ครั้งก่อน</label>
                                        <input
                                            type="number"
                                            placeholder="ครั้งก่อน"
                                            value={electricPrev}
                                            onChange={(e) => setElectricPrev(e.target.value)}
                                            className="w-full rounded-lg border p-2 bg-white border-gray-300"
                                            required={!!selectedRoomId}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">เลขมิเตอร์ครั้งนี้</label>
                                        <input
                                            type="number"
                                            placeholder="ครั้งนี้"
                                            value={electricCurr}
                                            onChange={(e) => setElectricCurr(e.target.value)}
                                            className="w-full rounded-lg border p-2 bg-white border-gray-300"
                                            required={!!selectedRoomId}
                                        />
                                    </div>
                                </div>
                                {electricUnits > 0 && (
                                    <p className="text-xs text-amber-700 font-medium mt-1">ใช้ไป {electricUnits} หน่วย = ฿{ePrice.toLocaleString()} บาท</p>
                                )}
                            </div>
                        </div>

                        {/* สรุปยอดรวมท้ายฟอร์ม */}
                        <div className="flex items-center justify-between border-t pt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div>
                                <span className="text-xs font-bold text-gray-500 block uppercase">ยอดรวมใบแจ้งหนี้ทั้งหมด:</span>
                                <span className="text-2xl font-black text-blue-700">฿{totalAmount.toLocaleString()} <span className="text-sm font-normal text-gray-500">บาท</span></span>
                            </div>
                            <button
                                type="submit"
                                disabled={creating || !selectedRoomId}
                                className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white text-sm hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400"
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