import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface DoctorSummaryItem {
  doctor_code: string;
  doctor_name: string;
  total_visits: number;
  total_income: number;
  total_uc_money: number;
  total_rcpt_money: number;
  total_discount: number;
  total_debit: number;
  monthly_income: Record<string, number>;
  monthly_visits: Record<string, number>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ds1 = searchParams.get('ds1') || '2025-10-01';
  const ds2 = searchParams.get('ds2') || '2026-09-30';
  const pttypesParam = searchParams.get('pttypes'); // comma separated list e.g. "10,11,14"
  const eclaimsParam = searchParams.get('eclaims'); // comma separated list e.g. "16,17,18"

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { success: false, error: 'Database connection is not configured in .env.local' },
      { status: 500 }
    );
  }

  try {
    const connection = await pool.getConnection();

    // Fetch exactly the 37 pttype_eclaim standard options as in FoxPro:
    // select concat(code,':',name) from pttype_eclaim order by 1
    const [allPttypeRows] = await connection.query(`
      SELECT 
        code, 
        name
      FROM pttype_eclaim 
      ORDER BY CAST(code AS UNSIGNED), code ASC
    `);

    // Build dynamic conditions
    const whereClauses: string[] = [
      'o.vstdate BETWEEN ? AND ?',
      "IFNULL(o.an, '') = ''"
    ];
    const queryParams: any[] = [ds1, ds2];

    // Filter by e-Claim ID (pttype_eclaim.code)
    const filterParam = eclaimsParam || pttypesParam;
    if (filterParam && filterParam.trim() !== '') {
      const list = filterParam.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length > 0) {
        whereClauses.push(`ptt.pttype_eclaim_id IN (${list.map(() => '?').join(',')})`);
        queryParams.push(...list);
      }
    }

    const query = `
      SELECT 
        IFNULL(o.doctor, 'UNKNOWN') AS doctor_code,
        IFNULL(d.name, IFNULL(o.doctor, 'ไม่ระบุชื่อแพทย์')) AS doctor_name,
        DATE_FORMAT(o.vstdate, '%Y-%m') AS ym,
        COUNT(DISTINCT o.vn) AS visits,
        SUM(IFNULL(v.income, 0)) AS income,
        SUM(IFNULL(v.uc_money, 0)) AS uc_money,
        SUM(IFNULL(v.discount_money, 0)) AS discount_money,
        SUM(IFNULL(v.rcpt_money, 0)) AS rcpt_money,
        SUM(IFNULL(v.income, 0) - IFNULL(v.discount_money, 0) - IFNULL(v.rcpt_money, 0)) AS debit
      FROM ovst o
      INNER JOIN vn_stat v ON v.vn = o.vn
      INNER JOIN pttype ptt ON ptt.pttype = o.pttype
      LEFT JOIN doctor d ON d.code = o.doctor
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY IFNULL(o.doctor, 'UNKNOWN'), IFNULL(d.name, IFNULL(o.doctor, 'ไม่ระบุชื่อแพทย์')), DATE_FORMAT(o.vstdate, '%Y-%m')
      ORDER BY doctor_name ASC, ym ASC
    `;

    const [rows] = await connection.query(query, queryParams);
    connection.release();

    const doctorMap: Record<string, DoctorSummaryItem> = {};
    const monthsSet = new Set<string>();

    (rows as any[]).forEach(row => {
      const docCode = row.doctor_code;
      const ym = row.ym;
      monthsSet.add(ym);

      if (!doctorMap[docCode]) {
        doctorMap[docCode] = {
          doctor_code: docCode,
          doctor_name: row.doctor_name,
          total_visits: 0,
          total_income: 0,
          total_uc_money: 0,
          total_rcpt_money: 0,
          total_discount: 0,
          total_debit: 0,
          monthly_income: {},
          monthly_visits: {},
        };
      }

      const inc = Number(row.income) || 0;
      const vis = Number(row.visits) || 0;

      doctorMap[docCode].total_visits += vis;
      doctorMap[docCode].total_income += inc;
      doctorMap[docCode].total_uc_money += Number(row.uc_money) || 0;
      doctorMap[docCode].total_rcpt_money += Number(row.rcpt_money) || 0;
      doctorMap[docCode].total_discount += Number(row.discount_money) || 0;
      doctorMap[docCode].total_debit += Number(row.debit) || 0;

      doctorMap[docCode].monthly_income[ym] = (doctorMap[docCode].monthly_income[ym] || 0) + inc;
      doctorMap[docCode].monthly_visits[ym] = (doctorMap[docCode].monthly_visits[ym] || 0) + vis;
    });

    const doctors = Object.values(doctorMap).sort((a, b) => b.total_income - a.total_income);
    const months = Array.from(monthsSet).sort();

    const monthlyTotals: Record<string, { income: number; visits: number }> = {};
    months.forEach(m => {
      monthlyTotals[m] = { income: 0, visits: 0 };
      doctors.forEach(d => {
        monthlyTotals[m].income += d.monthly_income[m] || 0;
        monthlyTotals[m].visits += d.monthly_visits[m] || 0;
      });
    });

    const grandTotal = {
      visits: doctors.reduce((sum, d) => sum + d.total_visits, 0),
      income: doctors.reduce((sum, d) => sum + d.total_income, 0),
      uc_money: doctors.reduce((sum, d) => sum + d.total_uc_money, 0),
      rcpt_money: doctors.reduce((sum, d) => sum + d.total_rcpt_money, 0),
      discount: doctors.reduce((sum, d) => sum + d.total_discount, 0),
      debit: doctors.reduce((sum, d) => sum + d.total_debit, 0),
    };

    return NextResponse.json({
      success: true,
      months,
      doctors,
      monthlyTotals,
      grandTotal,
      allPttypeOptions: allPttypeRows,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/opd-doctor-summary Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
