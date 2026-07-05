"use client"

interface InvoiceDetailProps {
  invoice: any;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const WATER_RATE = 18;
  const ELECTRIC_RATE = 7;

  // 🎯 ดึงเลขมิเตอร์จริงจากฐานข้อมูล Supabase มาใช้งาน (ถ้าไม่มีให้ Default เป็น 0)
  const waterPrev = invoice?.water_prev ?? 0;
  const waterCurr = invoice?.water_curr ?? 0;
  const electricPrev = invoice?.electric_prev ?? 0;
  const electricCurr = invoice?.electric_curr ?? 0;

  // คำนวณจำนวนหน่วยที่ใช้จริงจากความต่างของมิเตอร์
  const waterUnits = Math.max(0, waterCurr - waterPrev);
  const electricUnits = Math.max(0, electricCurr - electricPrev);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-bold mb-4 text-gray-700">📅 ยอดบิลและรายละเอียดมิเตอร์</h2>
      {!invoice ? (
        <div className="text-green-600 font-semibold py-6 text-center bg-green-50 rounded-lg">
          🎉 เยี่ยมมาก! เดือนนี้คุณไม่มียอดค้างชำระแล้ว
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between text-sm border-b pb-2">
            <span className="text-gray-500">ประจำเดือน:</span>
            <span className="font-bold text-gray-800">{invoice.month}/{invoice.year}</span>
          </div>
          
          <div className="flex justify-between text-sm border-b pb-2">
            <span className="text-gray-500">ค่าห้องพักปกติ:</span>
            <span className="font-semibold text-gray-800">฿{invoice.room_price?.toLocaleString()}</span>
          </div>

          {/* 💧 รายละเอียดมิเตอร์น้ำ (ข้อมูลจริงจาก DB) */}
          <div className="space-y-1.5 border-b pb-3">
            <div className="flex justify-between text-sm font-bold text-blue-600">
              <span>💧 ค่าน้ำประปา (หน่วยละ ฿{WATER_RATE})</span>
              <span>฿{invoice.water_price?.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 text-xs text-gray-500 bg-blue-50/50 p-2 rounded-lg text-center">
              <div>ครั้งก่อน: <span className="font-semibold text-gray-700">{waterPrev}</span></div>
              <div>ครั้งนี้: <span className="font-semibold text-gray-700">{waterCurr}</span></div>
              <div className="text-blue-600 font-bold">ใช้ไป: {waterUnits} หน่วย</div>
            </div>
          </div>

          {/* ⚡ รายละเอียดมิเตอร์ไฟ (ข้อมูลจริงจาก DB) */}
          <div className="space-y-1.5 border-b pb-3">
            <div className="flex justify-between text-sm font-bold text-amber-600">
              <span>⚡ ค่าไฟฟ้า (หน่วยละ ฿{ELECTRIC_RATE})</span>
              <span>฿{invoice.electric_price?.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 text-xs text-gray-500 bg-amber-50/50 p-2 rounded-lg text-center">
              <div>ครั้งก่อน: <span className="font-semibold text-gray-700">{electricPrev}</span></div>
              <div>ครั้งนี้: <span className="font-semibold text-gray-700">{electricCurr}</span></div>
              <div className="text-amber-600 font-bold">ใช้ไป: {electricUnits} หน่วย</div>
            </div>
          </div>

          <div className="flex justify-between text-lg font-bold pt-1 text-blue-600">
            <span>ยอดรวมทั้งหมด:</span>
            <span>฿{invoice.total_amount?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}