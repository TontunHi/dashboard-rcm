import { getDbPool } from '@/lib/db';

export interface DoctorChartSummary {
  doctor_code: string;
  doctor_name: string;
  total_charts: number;
  completed_charts: number;
  uncompleted_charts: number;
}

export interface IPDChartReportData {
  fiscalYear: number;
  startDate: string;
  endDate: string;
  reportDateStr: string;
  grandTotal: {
    total_charts: number;
    completed_charts: number;
    uncompleted_charts: number;
    completed_percentage: number;
  };
  doctors: DoctorChartSummary[];
}

/**
 * คำนวณช่วงวันที่ปีงบประมาณไทย (1 ต.ค. - 30 ก.ย.)
 */
export function getCurrentFiscalYearRange(targetDate: Date = new Date()) {
  const calYear = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1-12
  const fiscalYear = month >= 10 ? calYear + 1 : calYear;
  const startDate = `${fiscalYear - 1}-10-01`;
  const endDate = `${fiscalYear}-09-30`;
  return { fiscalYear, startDate, endDate };
}

/**
 * ดึงข้อมูลสรุปชาร์ตตามแพทย์ D/C จากฐานข้อมูล HOSxP
 */
export async function getIPDDoctorChartSummary(): Promise<IPDChartReportData> {
  const now = new Date();
  const { fiscalYear, startDate, endDate } = getCurrentFiscalYearRange(now);

  const pool = getDbPool();
  if (!pool) {
    throw new Error('Database connection is not configured in .env.local');
  }

  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT 
        IFNULL(i.dch_doctor, 'UNKNOWN') AS doctor_code,
        IFNULL(d2.name, IFNULL(i.dch_doctor, 'ไม่ระบุแพทย์')) AS doctor_name,
        COUNT(DISTINCT i.an) AS total_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NOT NULL THEN i.an END) AS completed_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NULL THEN i.an END) AS uncompleted_charts
      FROM ipt i
      LEFT JOIN iptdiag idx ON i.an = idx.an AND idx.diagtype = 1
      LEFT JOIN doctor d2 ON d2.code = i.dch_doctor
      WHERE i.dchdate BETWEEN ? AND ?
      GROUP BY IFNULL(i.dch_doctor, 'UNKNOWN'), IFNULL(d2.name, IFNULL(i.dch_doctor, 'ไม่ระบุแพทย์'))
      HAVING uncompleted_charts > 0
      ORDER BY uncompleted_charts DESC, total_charts DESC
    `;

    const [rows] = await connection.query(query, [startDate, endDate]);

    // Query ยอดรวมทั้งโรงพยาบาล
    const grandQuery = `
      SELECT 
        COUNT(DISTINCT i.an) AS total_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NOT NULL THEN i.an END) AS completed_charts,
        COUNT(DISTINCT CASE WHEN idx.modify_datetime IS NULL THEN i.an END) AS uncompleted_charts
      FROM ipt i
      LEFT JOIN iptdiag idx ON i.an = idx.an AND idx.diagtype = 1
      WHERE i.dchdate BETWEEN ? AND ?
    `;
    const [grandRows] = await connection.query(grandQuery, [startDate, endDate]);
    const grand = (grandRows as any[])[0] || { total_charts: 0, completed_charts: 0, uncompleted_charts: 0 };

    const totalCharts = Number(grand.total_charts) || 0;
    const completedCharts = Number(grand.completed_charts) || 0;
    const uncompletedCharts = Number(grand.uncompleted_charts) || 0;
    const completedPercentage = totalCharts > 0 ? (completedCharts / totalCharts) * 100 : 0;

    const doctors: DoctorChartSummary[] = (rows as any[]).map(r => ({
      doctor_code: r.doctor_code,
      doctor_name: r.doctor_name,
      total_charts: Number(r.total_charts) || 0,
      completed_charts: Number(r.completed_charts) || 0,
      uncompleted_charts: Number(r.uncompleted_charts) || 0,
    }));

    // จัดรูปแบบวันที่ภาษาไทย
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const reportDateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

    return {
      fiscalYear: fiscalYear + 543,
      startDate,
      endDate,
      reportDateStr,
      grandTotal: {
        total_charts: totalCharts,
        completed_charts: completedCharts,
        uncompleted_charts: uncompletedCharts,
        completed_percentage: completedPercentage,
      },
      doctors,
    };
  } finally {
    connection.release();
  }
}

/**
 * สร้างข้อความแจ้งเตือน Telegram จัด Format สวยงามตามความต้องการ
 */
export function formatTelegramMessage(data: IPDChartReportData): string {
  const timeStr = '08:30 น.';
  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const now = new Date();
  const shortDateStr = `${now.getDate()} ${thaiMonthsShort[now.getMonth()]} ${String(now.getFullYear() + 543).slice(-2)}`;
  const shortFyStr = `ปีงบ ${String(data.fiscalYear).slice(-2)}`;

  let msg = `🏥 <b>สรุปชาร์ต IPD ค้างสรุป</b>\n`;
  msg += `📅 ${shortDateStr} | ${timeStr} | ${shortFyStr}\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `📊 รวม <b>${data.grandTotal.total_charts.toLocaleString()}</b> ชาร์ต | สรุปแล้ว <b>${data.grandTotal.completed_charts.toLocaleString()}</b> (${data.grandTotal.completed_percentage.toFixed(1)}%)\n`;
  msg += `⏳ ค้าง <b>${data.grandTotal.uncompleted_charts.toLocaleString()}</b> ชาร์ต จาก <b>${data.doctors.length}</b> ท่าน\n`;
  msg += `━━━━━━━━━━━━━━━\n\n`;

  if (data.doctors.length === 0) {
    msg += `✅ <i>ไม่มีแพทย์ที่มีชาร์ตค้างสรุปในขณะนี้</i>\n`;
    msg += `━━━━━━━━━━━━━━━`;
    return msg;
  }

  data.doctors.forEach((doc, idx) => {
    msg += `${idx + 1}. ${doc.doctor_name}\n`;
    msg += `   ✅ ลง ${doc.completed_charts.toLocaleString()}/${doc.total_charts.toLocaleString()} ชาร์ต • ⏳ ยังไม่ได้สรุป <b>${doc.uncompleted_charts.toLocaleString()}</b> ชาร์ต\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━`;
  return msg;
}
