import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">

      {/* 👑 Header / Logo */}
      <div className="text-center mb-12">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent-tint)" }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3l8 4v5c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V7l8-4z"
              stroke="var(--accent)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M9.5 12l1.8 1.8L15 10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-ink mb-3">
          DormPay
        </h1>
        <p className="text-base text-ink-soft font-medium">
          ระบบจัดการหอพักและคำนวณบิลค่าน้ำ-ค่าไฟอัจฉริยะ
        </p>
      </div>

      {/* 🚀 Main Cards Selection */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">

        {/* บัตรฝั่งเจ้าของหอ */}
        <Link
          href="/admin-login"
          className="group card p-8 text-center flex flex-col items-center justify-center transition hover:shadow-[var(--shadow-elevated)]"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{ background: "var(--accent-tint)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.3-4.4 2.3.8-5-3.6-3.5 5-.7L12 2z"
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">สำหรับเจ้าของหอพัก</h2>
          <p className="text-sm text-ink-soft">
            จัดการห้องพัก, บันทึกเลขมิเตอร์, ออกบิลแจ้งหนี้ และระบบส่งอีเมลอัตโนมัติ
          </p>
        </Link>

        {/* บัตรฝั่งผู้เช่า */}
        <Link
          href="/login"
          className="group card p-8 text-center flex flex-col items-center justify-center transition hover:shadow-[var(--shadow-elevated)]"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{ background: "var(--success-tint)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 12a4 4 0 100-8 4 4 0 000 8z"
                stroke="var(--success)"
                strokeWidth="1.6"
              />
              <path
                d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
                stroke="var(--success)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">สำหรับผู้เช่าห้องพัก</h2>
          <p className="text-sm text-ink-soft">
            ตรวจสอบบิลค่าหอประจำเดือน, ประวัติยอดค้างชำระ และแนบสลิปหลักฐานการโอนเงิน
          </p>
        </Link>

      </div>

      {/* 📝 Footer ด้านล่าง */}
      <footer className="mt-16 text-xs text-ink-soft">
        © {new Date().getFullYear()} DormPay อัปเกรดระบบหอพักยุคใหม่เพื่อคุณ
      </footer>

    </div>
  )
}