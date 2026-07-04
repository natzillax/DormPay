// src/app/landlord/AdminHeader.tsx
"use client"

import Link from "next/link"

interface AdminHeaderProps {
    onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">🫅 แดชบอร์ดเจ้าของหอพัก (DormPay Admin)</h1>
                <p className="text-sm text-gray-500">ระบบจัดการออกบิลค่าน้ำค่าไฟ และตรวจสอบสลิป</p>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto flex-nowrap overflow-x-auto gap-1.5 pb-1">
                <div className="flex items-center gap-1.5 flex-nowrap">
                    <Link href="/landlord/assign-tenant">
                        <button className="rounded-md bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap">
                            🔗 ผูกห้องพัก
                        </button>
                    </Link>

                    <Link href="/landlord/manage-tenants">
                        <button className="rounded-md bg-purple-50 px-2.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 border border-purple-200 transition whitespace-nowrap">
                            📋 แจ้งย้ายออก
                        </button>
                    </Link>

                    <Link href="/landlord/revenue">
                        <button className="rounded-md bg-green-50 px-2.5 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 border border-green-200 transition whitespace-nowrap">
                            📊 รายได้
                        </button>
                    </Link>
                </div>

                <button
                    onClick={onLogout}
                    className="rounded-md bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition shadow-sm whitespace-nowrap ml-2"
                >
                    ออกจากระบบ
                </button>
            </div>
        </div>
    )
}