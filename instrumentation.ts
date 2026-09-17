export async function register() {
  // รันเฉพาะฝั่ง Node.js Server ตอนเริ่มบูท
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelegramCron } = await import('@/lib/telegramCronService');
    await initTelegramCron();
  }
}
