// src/components/tenant/InvoiceHistory.tsx
"use client"

interface InvoiceHistoryProps {
  paidInvoices: any[];
}

export default function InvoiceHistory({ paidInvoices }: InvoiceHistoryProps) {
  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
        📜 ประวัติใบแจ้งหนี้และการชำระเงินย้อนหลัง
      </h3>

      {paidInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">
          ยังไม่มีประวัติการชำระเงินในระบบของคุณ
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-3">ประจำเดือน</th>
                <th className="p-3">ค่าห้อง</th>
                <th className="p-3">ค่าน้ำ</th>
                <th className="p-3">ค่าไฟ</th>
                <th className="p-3">ยอดรวมทั้งหมด</th>
                <th className="p-3 text-center">Approve Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {paidInvoices.map((hist) => (
                <tr key={hist.id} className="hover:bg-gray-50 transition text-gray-600">
                  <td className="p-3 font-semibold text-gray-800">เดือน {hist.month}/{hist.year}</td>
                  <td className="p-3">฿{hist.room_price?.toLocaleString()}</td>
                  <td className="p-3">฿{hist.water_price?.toLocaleString()}</td>
                  <td className="p-3">฿{hist.electric_price?.toLocaleString()}</td>
                  <td className="p-3 font-bold text-gray-800">฿{hist.total_amount?.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      🟢 PAID
                    </span>
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