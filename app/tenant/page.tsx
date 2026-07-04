// src/app/tenant/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"

// 📦 Import ชิ้นส่วน UI ที่เราแยกออกมา
import TenantHeader from "./TenantHeader"
import InvoiceDetail from "./InvoiceDetail"
import PaymentForm from "./PaymentForm"
import InvoiceHistory from "./InvoiceHistory"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TenantDashboardPage() {
    const router = useRouter()
    const [tenantName, setTenantName] = useState<string>("กำลังโหลด...")
    const [invoice, setInvoice] = useState<any>(null) 
    const [paidInvoices, setPaidInvoices] = useState<any[]>([]) 
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const fetchInvoiceData = useCallback(async (userId: string) => {
        setLoading(true)
        try {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("room_id, name")
                .eq("id", userId)
                .maybeSingle()

            if (userError) throw userError
            if (userData?.name) setTenantName(userData.name)

            if (!userData || !userData.room_id) {
                setInvoice(null);
                setPaidInvoices([]);
                return;
            }

            const { data: currentData, error: currentError } = await supabase
                .from("invoices")
                .select("*")
                .eq("room_id", userData.room_id)
                .order("created_at", { ascending: false })

            if (currentError) throw currentError

            setInvoice(currentData?.find(inv => inv.status === "PENDING" || inv.status === "WAITING") || null)
            setPaidInvoices(currentData?.filter(inv => inv.status === "PAID") || [])

        } catch (error: any) {
            console.error("❌ Error fetching billing data:", error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleUploadSlip = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !invoice) return alert("กรุณาเลือกไฟล์สลิปก่อนนะจ๊ะ!")

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${invoice.id}-${Date.now()}.${fileExt}`
            const filePath = `slips/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from("slips")
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(filePath)

            await supabase.from("invoices").update({ slip_url: publicUrl, status: "WAITING" }).eq("id", invoice.id)
            await supabase.from("payments").insert([{
                invoice_id: invoice.id,
                user_id: localStorage.getItem("tenant_user_id"), 
                amount: invoice.total_amount, 
                payment_method: "TRANSFER",   
                slip_url: publicUrl           
            }])

            alert("อัปโหลดสลิปสำเร็จ! รอเจ้าของหอตรวจสอบนะจ๊ะ 🎉")
            setFile(null)
            fetchInvoiceData(localStorage.getItem("tenant_user_id") || "")

        } catch (error: any) {
            alert("เกิดข้อผิดพลาดในการอัปโหลด: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    useEffect(() => {
        const savedEmail = localStorage.getItem("tenant_email")
        if (!savedEmail) {
            router.replace("/login")
            return
        }

        const fetchUserData = async () => {
            const { data } = await supabase.from("users").select("id, name").eq("email", savedEmail).maybeSingle()
            if (data?.id) {
                localStorage.setItem("tenant_user_id", data.id)
                if (data.name) setTenantName(data.name)
                fetchInvoiceData(data.id)
            } else {
                router.replace("/login")
            }
        }
        fetchUserData()
    }, [router, fetchInvoiceData])

    const handleLogout = () => {
        localStorage.clear()
        router.push("/login")
    }

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-black">กำลังโหลดข้อมูลห้องพักของคุณ...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 text-black">
            <div className="mx-auto max-w-4xl">
                {/* 🧩 ประกอบชิ้นส่วนต่าง ๆ เข้าด้วยกัน */}
                <TenantHeader tenantName={tenantName} onLogout={handleLogout} />
                
                <div className="grid gap-6 md:grid-cols-2">
                    <InvoiceDetail invoice={invoice} />
                    <PaymentForm 
                        invoice={invoice} 
                        uploading={uploading} 
                        onFileChange={setFile} 
                        onSubmit={handleUploadSlip} 
                    />
                </div>

                <InvoiceHistory paidInvoices={paidInvoices} />
            </div>
        </div>
    )
}