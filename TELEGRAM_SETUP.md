# คู่มือการตั้งค่า Telegram Bot แจ้งเตือนชาร์ต IPD ประจำวัน (08:30 น.)

ระบบจะดึงข้อมูลสรุปชาร์ตที่ยังไม่ได้ลงของแพทย์จำหน่าย (D/C Doctor) ประจำปีงบประมาณ และส่งข้อความสรุปเข้ากลุ่ม Telegram ทุกวันเวลา 08:30 น.

---

## 1. วิธีสร้าง Telegram Bot (ใช้เวลา 1 นาที)
1. เปิดแอป Telegram ค้นหา `@BotFather`
2. ส่งข้อความ `/newbot`
3. ตั้งชื่อบอท เช่น `RCM Hospital Notifier`
4. ตั้ง Username ของบอท โดยต้องลงท้ายด้วย `bot` เช่น `rcm_hos_chart_bot`
5. `@BotFather` จะส่ง **HTTP API Token** มาให้ (ตัวอย่าง: `7891234567:AAHxxxxxxxxxxxxxxxxxxxxxxx`)
6. นำ Token นี้ไปใส่ในไฟล์ `.env.local`:
   ```env
   TELEGRAM_BOT_TOKEN="7891234567:AAHxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## 2. วิธีดึง Group Chat ID (ไอดีกลุ่มที่จะให้บอทแจ้งเตือน)
1. ดึง Bot ที่เพิ่งสร้างเข้ากลุ่ม Telegram ที่ต้องการ
2. ส่งข้อความอะไรก็ได้ 1 ข้อความลงในกลุ่มนั้น (เช่น พิมพ์ว่า `hello`)
3. เปิดเบราว์เซอร์ แล้วเข้าไปที่ URL นี้ (แทนที่ `<YOUR_BOT_TOKEN>` ด้วย Token ที่ได้จากข้อ 1):
   ```text
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. ค้นหาคำว่า `"chat":{"id": -100xxxxxxxxxx` ในหน้าที่เปิดขึ้นมา
5. นำเลข ID นั้น (รวมเครื่องหมายลบด้านหน้า เช่น `-1001234567890`) ไปใส่ในไฟล์ `.env.local`:
   ```env
   TELEGRAM_CHAT_ID="-1001234567890"
   ```

---

## 3. วิธีทดสอบส่งข้อความ

### วิธีที่ 1: กดปุ่มผ่านหน้าเว็บ Dashboard
- เข้าหน้าเว็บ [`/ipd`](http://localhost:3000/ipd)
- ที่แถบควบคุมด้านบน จะมีปุ่มสีฟ้า **`📲 ทดสอบส่ง Telegram`** อยู่ข้างๆ ปุ่มส่งออก Excel
- กดปุ่มเพื่อยิงส่งข้อความจริงเข้ากลุ่มได้ทันที

### วิธีที่ 2: รันผ่าน Terminal / Command Prompt
```bash
npm run notify
```

---

## 4. วิธีเปิดระบบแจ้งเตือนอัตโนมัติทุกเช้า 08:30 น. (Background Cron)

### หากรันด้วย PM2 (แนะนำสำหรับ Server รพ.):
```bash
pm2 start npm --name "ipd-telegram-cron" -- run notify:cron
pm2 save
```

### หากต้องการทดสอบรันในคอนโซล:
```bash
npm run notify:cron
```
ระบบจะแสดงข้อความว่า:
`🚀 IPD Telegram Notifier Scheduler เริ่มทำงานแล้ว (ตั้งเวลาทุกวัน 08:30 น.)`
และจะรอส่งข้อความเข้ากลุ่มทุกๆ วันเวลา 08:30 น. ตามเวลาประเทศไทย
