import { NextResponse } from 'next/server';
import { getIPDDoctorChartSummary, formatTelegramMessage } from '@/lib/telegramNotification';

export async function GET(request: Request) {
  try {
    const data = await getIPDDoctorChartSummary();
    const formattedMessage = formatTelegramMessage(data);

    return NextResponse.json({
      success: true,
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasChatId: !!process.env.TELEGRAM_CHAT_ID,
      previewMessage: formattedMessage,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'ยังไม่ได้ระบุ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ในไฟล์ .env.local' 
      },
      { status: 400 }
    );
  }

  try {
    const data = await getIPDDoctorChartSummary();
    const message = formatTelegramMessage(data);

    // ยิงส่งข้อความเข้า Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Telegram API Error: ${result.description || 'ไม่สามารถส่งข้อความได้'}` 
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งข้อความแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อยแล้ว',
      telegramResponse: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
