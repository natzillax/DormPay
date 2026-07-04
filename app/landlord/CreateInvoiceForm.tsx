// src/app/landlord/CreateInvoiceForm.tsx
"use client"

interface CreateInvoiceFormProps {
    rooms: any[];
    selectedRoomId: string;
    setSelectedRoomId: (id: string) => void;
    month: number;
    setMonth: (m: number) => void;
    year: number;
    setYear: (y: number) => void;
    waterPrev: string;
    setWaterPrev: (v: string) => void;
    waterCurr: string;
    setWaterCurr: (v: string) => void;
    electricPrev: string;
    setElectricPrev: (v: string) => void;
    electricCurr: string;
    setElectricCurr: (v: string) => void;
    creating: boolean;
    onSubmit: (e: React.FormEvent) => void;
    
    // อัตราและค่าที่คำนวณได้ส่งต่อมาจาก Parent
    WATER_RATE: number;
    ELECTRIC_RATE: number;
    rPrice: number;
    waterUnits: number;
    wPrice: number;
    electricUnits: number;
    ePrice: number;
    totalAmount: number;
}

export default function CreateInvoiceForm({
    rooms, selectedRoomId, setSelectedRoomId, month, setMonth, year, setYear,
    waterPrev, setWaterPrev, waterCurr, setWaterCurr, electricPrev, setElectricPrev, electricCurr, setElectricCurr,
    creating, onSubmit, WATER_RATE, ELECTRIC_RATE, rPrice, waterUnits, wPrice, electricUnits, ePrice, totalAmount
}: CreateInvoiceFormProps) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">📝 ออกใบแจ้งหนี้ประจำเดือนใหม่ (ระบบคํานวณมิเตอร์อัตโนมัติ)</h2>
            <form onSubmit={onSubmit} className="space-y-4 text-sm">

                <div className="grid gap-4 sm:grid-cols-3">
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

                {selectedRoomId && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                        💵 ค่าห้องปกติของห้องนี้: <span className="font-bold text-gray-900">฿{rPrice.toLocaleString()} บาท</span>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* มิเตอร์น้ำ */}
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

                    {/* มิเตอร์ไฟ */}
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
    )
}