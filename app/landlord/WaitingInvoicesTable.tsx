// src/app/landlord/WaitingInvoicesTable.tsx
"use client"

interface WaitingInvoicesTableProps {
    invoices: any[];
    updatingId: string | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete: (id: string) => void; // 🎯 เพิ่ม Props สำหรับลบใบแจ้งหนี้
}

export default function WaitingInvoicesTable({ invoices, updatingId, onApprove, onReject, onDelete }: WaitingInvoicesTableProps) {
    return (
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
                                    <td className="p-3 font-bold text-blue-600">
                                        ห้อง {inv.room_number || inv.rooms?.room_number || "ไม่ระบุ"}
                                    </td>
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
                                            onClick={() => onApprove(inv.id)}
                                            disabled={updatingId === inv.id}
                                            className="rounded-lg bg-green-600 px-3 py-1.5 font-bold text-white hover:bg-green-700 transition shadow-sm disabled:bg-gray-400 text-xs"
                                        >
                                            {updatingId === inv.id ? "รอ..." : "✅ อนุมัติ"}
                                        </button>
                                        <button
                                            onClick={() => onReject(inv.id)}
                                            disabled={updatingId === inv.id}
                                            className="rounded-lg bg-red-500 px-3 py-1.5 font-bold text-white hover:bg-red-600 transition shadow-sm disabled:bg-gray-400 text-xs"
                                        >
                                            {updatingId === inv.id ? "รอ..." : "❌ ปฏิเสธ"}
                                        </button>
                                        
                                        {/* 🗑️ ปุ่มลบบิลกรณีที่แอดมินคีย์ข้อมูลตัวเลขผิดพลาด */}
                                        <button
                                            onClick={() => onDelete(inv.id)}
                                            disabled={updatingId === inv.id}
                                            title="ลบใบแจ้งหนี้ใบนี้"
                                            className="rounded-lg bg-gray-100 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition border border-gray-200 hover:border-red-200 disabled:opacity-50 text-xs"
                                        >
                                            🗑️ ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}