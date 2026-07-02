"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LandlordRevenueReportPage() {
    const [revenueSummary, setRevenueSummary] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // ฟังก์ชันดึงบิลที่จ่ายแล้วมาคำนวณสรุปยอดรายได้
    const fetchRevenueReport = async () => {
        setLoading(true)
        try {
            // ดึงเฉพาะบิลที่สถานะเป็น PAID (ชำระเงินและอนุมัติแล้ว)
            const { data, error } = await supabase
                .from("invoices")
                .select("month, year, room_price, water_price, electric_price, total_amount")
                .eq("status", "PAID") 

            if (error) throw error

            // จัดกลุ่มข้อมูล (Group by Month/Year) และคำนวณยอดรวม
            const summaryMap: { [key: string]: any } = {}

            data?.forEach((inv) => {
                const key = `${inv.month}/${inv.year}`
                if (!summaryMap[key]) {
                    summaryMap[key] = {
                        monthYear: key,
                        month: inv.month,
                        year: inv.year,
                        totalRoom: 0,
                        totalWater: 0,
                        totalElectric: 0,
                        totalRevenue: 0,
                        billCount: 0
                    }
                }
                summaryMap[key].totalRoom += Number(inv.room_price || 0)
                summaryMap[key].totalWater += Number(inv.water_price || 0)
                summaryMap[key].totalElectric += Number(inv.electric_price || 0)
                summaryMap[key].totalRevenue += Number(inv.total_amount || 0)
                summaryMap[key].billCount += 1
            })

            // เรียงลำดับจากเดือน/ปี ล่าสุดลงไป
            const sortedSummary = Object.values(summaryMap).sort((a: any, b: any) => {
                if (b.year !== a.year) return b.year - a.year
                return b.month - a.month
            })

            setRevenueSummary(sortedSummary)
        } catch (error: any) {
            console.error("❌ ดึงรายงานรายได้ผิดพลาด:", error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRevenueReport()
    }, [])

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังคำนวณและประมวลผลยอดรายได้...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 text-black">
            <div className="mx-auto max-w-5xl">
                
                {/* ส่วนหัวข้อ */}
                <div className="border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">📈 รายงานสรุปรายได้หอพัก (สำหรับเจ้าของหอ)</h1>
                    <p className="text-sm text-gray-500 mt-1">ระบบคำนวณยอดเงินรวมจากบิลที่มีสถานะเป็น "PAID" ทั้งหมดในระบบอัตโนมัติ</p>
                </div>

                {revenueSummary.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                        ยังไม่มีข้อมูลยอดรายได้สุทธิ (ไม่มีบิลสถานะ PAID) ในระบบ
                    </div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* 💰 การ์ดสรุปยอดของเดือนล่าสุด (Quick Overview) */}
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-xs font-bold text-blue-600 block mb-1">รายได้รวมรวมทั้งหมด (เดือนล่าสุด)</span>
                                <span className="text-2xl font-black text-blue-800">฿{revenueSummary[0]?.totalRevenue.toLocaleString()}</span>
                            </div>
                            <div className="p-5 bg-green-50 rounded-xl border border-green-100 shadow-sm">
                                <span className="text-xs font-bold text-green-600 block mb-1">ยอดรวมค่าห้องพัก</span>
                                <span className="text-2xl font-bold text-green-800">฿{revenueSummary[0]?.totalRoom.toLocaleString()}</span>
                            </div>
                            <div className="p-5 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                                <span className="text-xs font-bold text-purple-600 block mb-1">ยอดรวมค่าน้ำประปา</span>
                                <span className="text-2xl font-bold text-purple-800">฿{revenueSummary[0]?.totalWater.toLocaleString()}</span>
                            </div>
                            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
                                <span className="text-xs font-bold text-amber-600 block mb-1">ยอดรวมค่าไฟฟ้า</span>
                                <span className="text-2xl font-bold text-amber-800">฿{revenueSummary[0]?.totalElectric.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 📊 ตารางสรุปรายรับแยกตามรายเดือน */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-bold text-gray-700">📜 ประวัติรายได้ประจำเดือนย้อนหลัง</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                            <th className="p-4">ประจำเดือน/ปี</th>
                                            <th className="p-4 text-center">จำนวนบิลที่เก็บได้</th>
                                            <th className="p-4">รวมค่าห้อง</th>
                                            <th className="p-4">รวมค่าน้ำ</th>
                                            <th className="p-4">รวมค่าไฟ</th>
                                            <th className="p-4 text-right text-blue-600 font-black">รายได้รวมสุทธิ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-gray-600">
                                        {revenueSummary.map((report) => (
                                            <tr key={report.monthYear} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-bold text-gray-800">เดือน {report.monthYear}</td>
                                                <td className="p-4 text-center font-semibold">{report.billCount} ห้อง</td>
                                                <td className="p-4">฿{report.totalRoom.toLocaleString()}</td>
                                                <td className="p-4">฿{report.totalWater.toLocaleString()}</td>
                                                <td className="p-4">฿{report.totalElectric.toLocaleString()}</td>
                                                <td className="p-4 text-right font-black text-blue-600 text-base bg-blue-50/30">
                                                    ฿{report.totalRevenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}
