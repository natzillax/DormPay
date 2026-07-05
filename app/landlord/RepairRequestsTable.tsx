// src/app/landlord/RepairRequestsTable.tsx
"use client"

interface RepairRequestsTableProps {
    repairs: any[];
    updatingId: string | null;
    onUpdateStatus: (id: string, nextStatus: string) => void;
}

export default function RepairRequestsTable({ repairs, updatingId, onUpdateStatus }: RepairRequestsTableProps) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                🔧 รายการแจ้งซ่อมจากผู้เช่า ({repairs.length} รายการ)
            </h2>

            {repairs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed text-sm">
                    💚 ยังไม่มีรายการแจ้งซ่อมเข้ามา ระบบปกติสุขดีทั้งหมด!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50 text-sm font-semibold text-gray-600">
                                <th className="p-3 w-24">เลขห้อง</th> {/* 🎯 เพิ่มหัวข้อคอลัมน์ เลขห้อง */}
                                <th className="p-3 w-48">หัวข้อปัญหา</th>
                                <th className="p-3">รายละเอียดเพิ่มเติม</th>
                                <th className="p-3 w-32">สถานะ</th>
                                <th className="p-3 text-center w-40">อัปเดตสถานะงาน</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {repairs.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    {/* 🎯 แสดงเลขห้องที่ดึงมาจาก rooms.room_number */}
                                    <td className="p-3 font-bold text-amber-600">
                                        ห้อง {
                                            // ดึงจาก Array ตัวแรกที่ส่งกลับมาจาก Supabase Join
                                            Array.isArray(req.rooms)
                                                ? req.rooms[0]?.room_number
                                                : (req.rooms?.room_number || "ไม่ระบุ")
                                        }
                                    </td>
                                    <td className="p-3 font-semibold text-gray-800">{req.title}</td>
                                    <td className="p-3 text-gray-600 max-w-xs break-words">{req.description}</td>
                                    <td className="p-3">
                                        {req.status === "PENDING" && (
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">🔴 รอตรวจสอบ</span>
                                        )}
                                        {req.status === "IN_PROGRESS" && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">🔵 กำลังซ่อม</span>
                                        )}
                                        {req.status === "COMPLETED" && (
                                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">🟢 ซ่อมเสร็จสิ้น</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center flex justify-center gap-1">
                                        {req.status === "PENDING" && (
                                            <button
                                                onClick={() => onUpdateStatus(req.id, "IN_PROGRESS")}
                                                disabled={updatingId === req.id}
                                                className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700 transition"
                                            >
                                                ⚙️ รับเรื่อง/กำลังซ่อม
                                            </button>
                                        )}
                                        {req.status === "IN_PROGRESS" && (
                                            <button
                                                onClick={() => onUpdateStatus(req.id, "COMPLETED")}
                                                disabled={updatingId === req.id}
                                                className="rounded bg-green-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-700 transition"
                                            >
                                                ✅ ซ่อมเสร็จแล้ว
                                            </button>
                                        )}
                                        {req.status === "COMPLETED" && (
                                            <span className="text-xs text-gray-400">ปิดงานเรียบร้อย</span>
                                        )}
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