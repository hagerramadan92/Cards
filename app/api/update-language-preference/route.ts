import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = body;
    
    // قراءة Accept-Language header من الطلب
    const acceptLanguage = request.headers.get('accept-language');
    console.log('Language change request:', {
      requestedLanguage: language,
      acceptLanguageHeader: acceptLanguage
    });
    
    // حفظ تفضيل اللغة في cookie
    const cookieStore = await cookies();
    cookieStore.set('preferred-language', language, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // سنة واحدة
      sameSite: 'lax',
      httpOnly: true,
    });
    
    // أو حفظ في قاعدة البيانات إذا كان المستخدم مسجلاً
    
    return NextResponse.json({
      status: true,
      message: `Language preference updated to ${language}`,
      data: {
        language,
        acceptLanguageHeader: acceptLanguage,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Error updating language preference:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: "Failed to update language preference",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}