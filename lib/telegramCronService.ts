import cron from 'node-cron';

let isCronStarted = false;

export async function initTelegramCron() {
  if (isCronStarted) {
    return;
  }
  isCronStarted = true;

  console.log('🚀 [IPD Cron] เริ่มต้นระบบตั้งเวลาแจ้งเตือน Telegram อัตโนมัติ (ทุกวัน 08:30 น.)');

  cron.schedule('30 8 * * *', async () => {
    console.log(`[${new Date().toISOString()}] [IPD Cron] ถึงเวลา 08:30 น. เริ่มส่งแจ้งเตือน Telegram...`);
    try {
      // Dynamic import เพื่อไม่ให้กระทบตอน build
      const { getIPDDoctorChartSummary, formatTelegramMessage } = await import('@/lib/telegramNotification');
      
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        console.warn('⚠️ [IPD Cron] ข้ามการส่ง: ยังไม่ได้ระบุ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID');
        return;
      }

      const data = await getIPDDoctorChartSummary();
      const message = formatTelegramMessage(data);

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

      const resJson = await response.json();
      if (resJson.ok) {
        console.log('✅ [IPD Cron] ส่งแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อย');
      } else {
        console.error('❌ [IPD Cron] Telegram API Error:', resJson.description);
      }
    } catch (err: any) {
      console.error('❌ [IPD Cron] เกิดข้อผิดพลาดในการรันแจ้งเตือน:', err.message);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}
