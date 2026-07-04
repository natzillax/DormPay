// src/components/tenant/TenantHeader.tsx
"use client"

interface TenantHeaderProps {
  tenantName: string;
  onLogout: () => void;
}

export default function TenantHeader({ tenantName, onLogout }: TenantHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4 mb-6 bg-white p-6 rounded-xl shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🏢 ยินดีต้อนรับสู่ DormPay</h1>
        <p className="text-sm text-gray-500">ผู้เช่า: {tenantName}</p>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition shadow-sm"
      >
        ออกจากระบบ
      </button>
    </div>
  )
}