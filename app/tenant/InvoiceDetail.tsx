// src/components/tenant/InvoiceDetail.tsx
"use client"

interface InvoiceDetailProps {
  invoice: any;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  return (
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
  )
}