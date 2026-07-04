import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-5xl bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6 text-slate-8xl">
      
      {/* 👑 Header / Logo */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-600 tracking-tight mb-3">
          🏢 DormPay
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          ระบบจัดการหอพักและคำนวณบิลค่าน้ำ-ค่าไฟอัจฉริยะ
        </p>
      </div>

      {/* 🚀 Main Cards Selection */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        
        {/* บัตรฝั่งเจ้าของหอ */}
        <Link 
          href="/landlord" 
          className="group p-8 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-center flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
            👑
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">สำหรับเจ้าของหอพัก</h2>
          <p className="text-sm text-slate-500">
            จัดการห้องพัก, บันทึกเลขมิเตอร์, ออกบิลแจ้งหนี้ และระบบส่งอีเมลอัตโนมัติ
          </p>
        </Link>

        {/* บัตรฝั่งผู้เช่า */}
        <Link 
          href="/login" 
          className="group p-8 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 text-center flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
            📱
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">สำหรับผู้เช่าห้องพัก</h2>
          <p className="text-sm text-slate-500">
            ตรวจสอบบิลค่าหอประจำเดือน, ประวัติยอดค้างชำระ และแนบสลิปหลักฐานการโอนเงิน
          </p>
        </Link>


      </div>

      {/* 📝 Footer ด้านล่าง */}
      <footer className="mt-16 text-xs text-slate-400">
        © {new Date().getFullYear()} DormPay อัปเกรดระบบหอพักยุคใหม่เพื่อคุณ
      </footer>

    </div>
  )
}