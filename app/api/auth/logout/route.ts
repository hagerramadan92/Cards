// app/api/auth/logout/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route"; 

export async function POST() {
  try {
    // التحقق من وجود session نشطة
    const session = await getServerSession(authOptions);
    
    // نرجع response ناجح
    // NextAuth سيتعامل مع حذف الكوكيز تلقائياً عند client-side signOut
    return NextResponse.json({ 
      success: true,
      hasSession: !!session 
    });
    
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}