/**
 * Background Cron Job: ส่งแจ้งเตือนชาร์ต IPD สรุปรายวันเข้า Telegram ทุก 08:30 น.
 * รันด้วยคำสั่ง: node scripts/cron-telegram.mjs หรือผ่าน PM2
 */

import cron from 'node-cron';
import https from 'https';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// โหลด .env.local ด้วยตนเอง
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

async function sendTelegramNotification() {
  console.log(`[${new Date().toISOString()}] เริ่มต้นตรวจสอบและส่งแจ้งเตือนชาร์ต IPD...`);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('❌ ข้ามการส่ง: ยังไม่ได้กำหนด TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ใน .env.local');
    return;
  }

  // คำนวณปีงบประมาณไทย
  const now = new Date();
  const calYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const fiscalYear = month >= 10 ? calYear + 1 : calYear;
  const startDate = `${fiscalYear - 1}-10-01`;
  const endDate = `${fiscalYear}-09-30`;

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hos',
    });

    // 1. ดึงสรุปภาพรวมโรงพยาบาล
    const [grandRows] = await connection.query(`
      SELECT 
        COUNT(DISTINCT i.an) AS total_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NOT NULL THEN i.an END) AS completed_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NULL THEN i.an END) AS uncompleted_charts
      FROM ipt i
      LEFT JOIN iptdiag idx ON i.an = idx.an AND idx.diagtype = 1
      WHERE i.dchdate BETWEEN ? AND ?
    `, [startDate, endDate]);

    const grand = grandRows[0] || { total_charts: 0, completed_charts: 0, uncompleted_charts: 0 };
    const totalCharts = Number(grand.total_charts) || 0;
    const completedCharts = Number(grand.completed_charts) || 0;
    const uncompletedCharts = Number(grand.uncompleted_charts) || 0;
    const percent = totalCharts > 0 ? ((completedCharts / totalCharts) * 100).toFixed(1) : '0.0';

    // 2. ดึงแยกตามแพทย์ D/C ที่มีชาร์ตค้าง
    const [docRows] = await connection.query(`
      SELECT 
        IFNULL(d2.name, IFNULL(i.dch_doctor, 'ไม่ระบุแพทย์')) AS doctor_name,
        COUNT(DISTINCT i.an) AS total_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NOT NULL THEN i.an END) AS completed_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NULL THEN i.an END) AS uncompleted_charts
      FROM ipt i
      LEFT JOIN iptdiag idx ON i.an = idx.an AND idx.diagtype = 1
      LEFT JOIN doctor d2 ON d2.code = i.dch_doctor
      WHERE i.dchdate BETWEEN ? AND ?
      GROUP BY doctor_name
      HAVING uncompleted_charts > 0
      ORDER BY uncompleted_charts DESC, total_charts DESC
    `, [startDate, endDate]);

    await connection.end();

    // 3. ประกอบข้อความ
    const thaiMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const shortDateStr = `${now.getDate()} ${thaiMonthsShort[now.getMonth()]} ${String(now.getFullYear() + 543).slice(-2)}`;
    const shortFyStr = `ปีงบ ${String(fiscalYear + 543).slice(-2)}`;

    let msg = `🏥 <b>สรุปชาร์ต IPD ค้างส่ง</b>\n`;
    msg += `📅 ${shortDateStr} | 08:30 น. | ${shortFyStr}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `📊 รวม <b>${totalCharts.toLocaleString()}</b> ชาร์ต | สรุปแล้ว <b>${completedCharts.toLocaleString()}</b> (${percent}%)\n`;
    msg += `⏳ ค้าง <b>${uncompletedCharts.toLocaleString()}</b> ชาร์ต จาก <b>${docRows.length}</b> ท่าน\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    if (docRows.length === 0) {
      msg += `✅ <i>ไม่มีแพทย์ที่มีชาร์ตค้างส่งในขณะนี้</i>\n`;
      msg += `━━━━━━━━━━━━━━━`;
    } else {
      docRows.forEach((doc, idx) => {
        msg += `${idx + 1}. ${doc.doctor_name}\n`;
        msg += `   ✅ ลง ${Number(doc.completed_charts).toLocaleString()}/${Number(doc.total_charts).toLocaleString()} ชาร์ต • ⏳ ยังไม่ได้ลง <b>${Number(doc.uncompleted_charts).toLocaleString()}</b> ชาร์ต\n\n`;
      });
      msg += `━━━━━━━━━━━━━━━`;
    }

    // 4. ส่ง Request เข้า Telegram
    const postData = JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const resp = JSON.parse(data);
          if (resp.ok) {
            console.log('✅ ส่งแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อย');
          } else {
            console.error('❌ Telegram ส่งกลับ Error:', resp.description);
          }
        } catch (e) {
          console.error('❌ Parse Response Error:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request Error:', e.message);
    });

    req.write(postData);
    req.end();

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการประมวลผล:', err.message);
    if (connection) connection.end().catch(() => {});
  }
}

// ตรวจสอบ argument หากสั่งรัน manual ทันที (เช่น node scripts/cron-telegram.mjs --now)
if (process.argv.includes('--now')) {
  sendTelegramNotification();
} else {
  // ตั้ง Cron Schedule: ทุกวัน เวลา 08:30 น.
  console.log('🚀 IPD Telegram Notifier Scheduler เริ่มทำงานแล้ว (ตั้งเวลาทุกวัน 08:30 น.)');
  cron.schedule('30 8 * * *', () => {
    sendTelegramNotification();
  }, {
    timezone: 'Asia/Bangkok'
  });
}
