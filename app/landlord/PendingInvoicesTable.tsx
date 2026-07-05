// src/app/landlord/PendingInvoicesTable.tsx
"use client"

interface PendingInvoicesTableProps {
    invoices: any[];
    updatingId: string | null;
    onDelete: (id: string) => void;
}

export default function PendingInvoicesTable({ invoices, updatingId, onDelete }: PendingInvoicesTableProps) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                📋 รายการบิลที่ออกแล้ว/ค้างชำระ ({invoices.length} ห้อง)
            </h2>

            {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed text-sm">
                    📭 ยังไม่มีการออกบิลค้างชำระในระบบ หรือทุกห้องกดส่งสลิปมาหมดแล้ว
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50 text-sm font-semibold text-gray-600">
                                <th className="p-3">ห้อง</th>
                                <th className="p-3">ประจำเดือน</th>
                                <th className="p-3">ยอดรวมสุทธิ</th>
                                <th className="p-3">สถานะผู้เช่า</th>
                                <th className="p-3 text-center">จัดการบิลที่ผิด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition">
                                    <td className="p-3 font-bold text-gray-700">
                                        ห้อง {inv.room_number || inv.rooms?.room_number || "ไม่ระบุ"}
                                    </td>
                                    <td className="p-3 text-gray-600">{inv.month}/{inv.year}</td>
                                    <td className="p-3 font-semibold text-gray-800">฿{inv.total_amount.toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                                            🔴 ยังไม่ชำระเงิน
                                        </span>
                                    </td>
                                    <td className="p-3 text-center flex justify-center">
                                        <button
                                            onClick={() => onDelete(inv.id)}
                                            disabled={updatingId === inv.id}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition shadow-sm disabled:opacity-50"
                                        >
                                            🗑️ ลบและออกบิลใหม่
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