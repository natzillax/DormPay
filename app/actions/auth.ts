"use server"

import argon2 from "argon2"
import { createClient } from "@supabase/supabase-js"

// เรียกใช้งาน Supabase Client ฝั่ง Server
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 🚀 1. ฟังก์ชันสมัครสมาชิก (สำหรับหน้า /signup)
export async function registerUser({ email, password, name }: { email: string; password: string; name: string }) {
    if (!email || !password) {
        return { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" }
    }

    try {
        // 🔐 แฮชรหัสผ่านตัวจริงด้วย Argon2
        const hashedPassword = await argon2.hash(password)

        // บันทึกลงตาราง users
        const { error } = await supabase
            .from("users")
            .insert([
                {
                    id: crypto.randomUUID(), // บังคับสร้าง UUID ใหม่ให้ฝั่ง Client เลย
                    email: email,
                    password: hashedPassword, // เซฟรหัสที่แฮชแล้วลงเบส
                    name: name || "ผู้เช่าทั่วไป",
                    role: "TENANT",
                    status: "PENDING",
                    room_id: null
                }
            ])

        if (error) {
            if (error.code === "23505") {
                return { success: false, message: "อีเมลนี้เคยถูกใช้สมัครสมาชิกไปแล้ว" }
            }
            throw error
        }
        
        return { success: true, message: "สมัครสมาชิกสำเร็จ รอยืนยันจากแอดมิน" }

    } catch (error: any) {
        console.error("❌ Register Error:", error.message)
        return { success: false, message: "เกิดข้อผิดพลาด: " + error.message }
    }
}

// 🚀 2. ฟังก์ชันเข้าสู่ระบบ (สำหรับหน้า /login)
export async function loginUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
        // ค้นหาอีเมลในระบบก่อน
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle()

        if (error || !user) {
            return { success: false, message: "ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง" }
        }

        // 🔐 ใช้ argon2.verify เพื่อเทียบรหัสผ่านดิบกับรหัสที่แฮชไว้ในเบส
        const isPasswordValid = await argon2.verify(user.password, password)

        if (!isPasswordValid) {
            return { success: false, message: "รหัสผ่านไม่ถูกต้อง" }
        }

        // ✅ แก้ไขการปิดวงเล็บและส่งโครงสร้างข้อมูลผู้ใช้ออกไปให้ถูกต้อง
        return {
            success: true,
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
                role: user.role,      // ✨ ส่งค่าสิทธิ์ออกไปเช็คที่หน้า Client
                room_id: user.room_id // ✨ ส่งค่าห้องออกไปผูกกับหน้าจอ
            }
        }

    } catch (error: any) {
        return { success: false, message: "เกิดข้อผิดพลาดระบบ: " + error.message }
    }
}