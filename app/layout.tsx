import { SessionProvider } from "next-auth/react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* ครอบเพื่อให้ทุกๆ หน้าดึงข้อมูลคนล็อกอินไปใช้ได้ */}
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}