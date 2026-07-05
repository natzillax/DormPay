"use client"

interface PaymentFormProps {
  invoice: any;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PaymentForm({ invoice, uploading, onFileChange, onSubmit }: PaymentFormProps) {
  return (
    /* 🎯 ถอด justify-between ออก เพื่อไม่ให้มันถ่างเนื้อหาออกจากกัน */
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 h-fit">
      <div>
        <h2 className="text-lg font-bold mb-2 text-gray-700">💰 ช่องทางการชำระเงิน</h2>
        <p className="text-xs text-gray-500 border-b pb-4 mb-4">
          ธนาคารกสิกรไทย • เลขบัญชี: <span className="font-mono font-semibold text-gray-700">000-0-00000-0</span> • ชื่อบัญชี: หอพัก DormPay
        </p>
      </div>

      {invoice ? (
        invoice.status === "WAITING" ? (
          <div className="text-center py-6 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-semibold text-sm">
            ⏳ ส่งสลิปแล้ว รอเจ้าของหอตรวจสอบความถูกต้องนะจ๊ะ
          </div>
        ) : (
          /* 🎯 ฟอร์มจะขยับขึ้นมาต่อจากข้อมูลธนาคารทันที ไม่เหลือพื้นที่โล่ง */
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">แนบภาพสลิปเงินโอน</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 cursor-pointer
                file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 
                file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100"
              required
            />
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-md bg-green-600 py-2.5 font-bold text-white hover:bg-green-700 transition shadow-sm disabled:bg-gray-400 text-sm active:scale-[0.99]"
            >
              {uploading ? "กำลังส่งสลิป..." : "🚀 ยืนยันการส่งสลิป"}
            </button>
          </form>
        )
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm">
          ไม่มีบิลค้างชำระ ไม่ต้องส่งสลิปจ้า
        </div>
      )}
    </div>
  )
}