import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "DormPay <onboarding@resend.dev>", // 👈 ตอนเทสใช้ตัวนี้ฟรี ถ้ามีโดเมนค่อยเปลี่ยนได้
      to: [to],
      subject: subject,
      text: text,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}