import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // قراءة Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    console.log('Accept-Language:', acceptLanguage);
    
    // البيانات التي ستُرجع (بنفس هيكل الرد الذي قدمته)
    const languages = [
      { id: 1, code: "en", name: "English" },
      { id: 2, code: "ar", name: "العربية" },
      { id: 3, code: "fr", name: "Français" }
    ];
    
    // يمكنك ترتيب اللغات بناءً على Accept-Language
    let sortedLanguages = [...languages];
    
    if (acceptLanguage) {
      const preferredLang = acceptLanguage.split(',')[0].split(';')[0].trim().toLowerCase();
      
      sortedLanguages.sort((a, b) => {
        if (a.code === preferredLang) return -1;
        if (b.code === preferredLang) return 1;
        return 0;
      });
    }
    
    return NextResponse.json({
      status: true,
      message: "تم بنجاح",
      data: sortedLanguages
    });
    
  } catch (error) {
    console.error('Error in languages API:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}