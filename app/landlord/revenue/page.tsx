"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import LoadingScreen from "@/components/LoadingScreen"

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
        return <LoadingScreen message="กำลังคำนวณและประมวลผลยอดรายได้..." />
    }

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-5xl">

                <Link
                    href="/landlord"
                    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-accent-dark"
                >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    กลับไปหน้าแดชบอร์ด
                </Link>

                {/* ส่วนหัวข้อ */}
                <div className="card-elevated p-6 mb-6">
                    <h1 className="text-xl font-semibold text-ink">รายงานสรุปรายได้หอพัก</h1>
                    <p className="text-sm text-ink-soft mt-1">ระบบคำนวณยอดเงินรวมจากบิลที่มีสถานะเป็น &quot;จ่ายแล้ว&quot; ทั้งหมดในระบบอัตโนมัติ</p>
                </div>

                {revenueSummary.length === 0 ? (
                    <div className="card text-center py-12 text-ink-soft">
                        ยังไม่มีข้อมูลยอดรายได้สุทธิ (ไม่มีบิลสถานะจ่ายแล้ว) ในระบบ
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* 💰 การ์ดสรุปยอดของเดือนล่าสุด (Quick Overview) */}
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                            <div className="card p-5" style={{ borderTop: "3px solid var(--accent)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft block mb-1">รายได้รวม (เดือนล่าสุด)</span>
                                <span className="text-2xl font-bold text-ink">฿{revenueSummary[0]?.totalRevenue.toLocaleString()}</span>
                            </div>
                            <div className="card p-5" style={{ borderTop: "3px solid var(--success)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft block mb-1">ยอดรวมค่าห้องพัก</span>
                                <span className="text-2xl font-bold text-ink">฿{revenueSummary[0]?.totalRoom.toLocaleString()}</span>
                            </div>
                            <div className="card p-5" style={{ borderTop: "3px solid var(--accent-dark)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft block mb-1">ยอดรวมค่าน้ำประปา</span>
                                <span className="text-2xl font-bold text-ink">฿{revenueSummary[0]?.totalWater.toLocaleString()}</span>
                            </div>
                            <div className="card p-5" style={{ borderTop: "3px solid var(--warning)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft block mb-1">ยอดรวมค่าไฟฟ้า</span>
                                <span className="text-2xl font-bold text-ink">฿{revenueSummary[0]?.totalElectric.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 📊 ตารางสรุปรายรับแยกตามรายเดือน */}
                        <div className="card overflow-hidden">
                            <div className="p-4 border-b" style={{ borderColor: "var(--line)" }}>
                                <h3 className="font-semibold text-ink">ประวัติรายได้ประจำเดือนย้อนหลัง</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="ledger-row text-ink-soft font-semibold uppercase text-xs tracking-wide">
                                            <th className="p-4">ประจำเดือน/ปี</th>
                                            <th className="p-4 text-center">จำนวนบิลที่เก็บได้</th>
                                            <th className="p-4">รวมค่าห้อง</th>
                                            <th className="p-4">รวมค่าน้ำ</th>
                                            <th className="p-4">รวมค่าไฟ</th>
                                            <th className="p-4 text-right font-bold" style={{ color: "var(--accent)" }}>รายได้รวมสุทธิ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-ink-soft">
                                        {revenueSummary.map((report) => (
                                            <tr key={report.monthYear} className="ledger-row">
                                                <td className="p-4 font-semibold text-ink">เดือน {report.monthYear}</td>
                                                <td className="p-4 text-center font-medium">{report.billCount} ห้อง</td>
                                                <td className="p-4 font-mono">฿{report.totalRoom.toLocaleString()}</td>
                                                <td className="p-4 font-mono">฿{report.totalWater.toLocaleString()}</td>
                                                <td className="p-4 font-mono">฿{report.totalElectric.toLocaleString()}</td>
                                                <td
                                                    className="p-4 text-right font-bold font-mono text-base"
                                                    style={{ color: "var(--accent)", background: "var(--accent-tint)" }}
                                                >
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