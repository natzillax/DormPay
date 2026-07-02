import { redirect } from 'next/navigation';

export default function RootPage() {
  // สั่งให้รีไดเรกต์ไปที่หน้าแอดมินหอพักทันที
  redirect('/login');
}