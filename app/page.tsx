import Link from 'next/link'

export default function HomePage() {
  return (
    // 🎨 ปรับสีตัวอักษรหลัก และใส่พื้นหลังหลบภัยไว้เพื่อความสมูทในการเรนเดอร์สไตล์
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-ink antialiased">

      {/* 👑 Header / Logo */}
      <div className="text-center mb-12 group">
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.15)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-3"
          style={{ background: "linear-gradient(135deg, var(--paper-raised), var(--accent-tint))" }}
        >
          {/* Smart Building + Bolt ICON */}
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-dark)" />
              </linearGradient>
            </defs>
            <path d="M3 21h18M5 21V8l7-4l7 4v13" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10h2v2H9v-2zm0 4h2v2H9v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z" fill="url(#logo-grad)" fillOpacity="0.25" />
            <path d="M11 14l2-4M10 10h3m-2 4h3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        
        <h1 className="text-5xl font-black tracking-tight text-ink mb-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 bg-clip-text">
          DormPay
        </h1>

        {/* 🎯 ไฮไลท์จุดที่ต้องการเปลี่ยน: แถบสีพื้นหลังของระบบจัดการสโลแกนให้สะดุดตาและโมเดิร์นขึ้น */}
        <p className="text-sm md:text-base text-blue-700 font-bold bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 px-5 py-2 rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-white/60 inline-block tracking-wide">
          ✨ ระบบจัดการหอพักและคำนวณบิลค่าน้ำ-ค่าไฟอัจฉริยะ
        </p>
      </div>

      {/* 🚀 Main Cards Selection */}
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl w-full">

        {/* บัตรฝั่งเจ้าของหอ */}
        <Link
          href="/admin-login"
          className="group card p-8 text-center flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[var(--shadow-elevated)]"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_25px_rgba(59,130,246,0.15)]"
            style={{ background: "linear-gradient(135deg, var(--accent-tint), #ffffff)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--accent)" strokeWidth="2" />
              <path d="M9 8h6M9 12h4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="15" cy="14" r="2" fill="var(--accent)" />
              <path d="M16.5 15.5L18 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">สำหรับเจ้าของหอพัก</h2>
          <p className="text-sm text-ink-soft leading-relaxed font-medium">
            จัดการห้องพัก, บันทึกเลขมิเตอร์, ออกบิลแจ้งหนี้ และระบบส่งอีเมลอัตโนมัติ
          </p>
        </Link>

        {/* บัตรฝั่งผู้เช่า */}
        <Link
          href="/login"
          className="group card p-8 text-center flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[var(--shadow-elevated)]"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_25px_rgba(16,185,129,0.15)]"
            style={{ background: "linear-gradient(135deg, var(--success-tint), #ffffff)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" fill="var(--success)" />
              <path d="M9 12l2 2 4-4" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">สำหรับผู้เช่าห้องพัก</h2>
          <p className="text-sm text-ink-soft leading-relaxed font-medium">
            ตรวจสอบบิลค่าหอประจำเดือน, ประวัติยอดค้างชำระ และแนบสลิปหลักฐานการโอนเงิน
          </p>
        </Link>

      </div>

      {/* 📝 Footer ด้านล่าง */}
      <footer className="mt-20 text-xs font-semibold text-ink-soft/70 bg-gradient-to-r from-blue-50 to-emerald-50 via-indigo-50 px-4 py-2 rounded-full backdrop-blur-xs border border-white/40 shadow-xs">
        © {new Date().getFullYear()} DormPay อัปเกรดระบบหอพักยุคใหม่เพื่อคุณ
      </footer>

    </div>
  )
}