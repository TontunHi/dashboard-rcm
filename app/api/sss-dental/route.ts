import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface DentalDoctorSummaryItem {
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

export interface DentalPatientVisitItem {
  vn: string;
  hn: string;
  cid: string;
  ptname: string;
  sex: string;
  age: number;
  vstdate: string;
  vsttime: string;
  department: string;
  pdx: string;
  pdxname: string;
  doctor_code: string;
  doctor_name: string;
  income: number;
  uc_money: number;
  discount_money: number;
  paid_money: number;
  rcpt_money: number;
  debit: number;
  rcpno: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ds1 = searchParams.get('ds1') || '2025-10-01';
  const ds2 = searchParams.get('ds2') || '2026-09-30';
  const doctorFilter = searchParams.get('doctor') || '';
  const fetchVisits = searchParams.get('visits') === 'true';

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { success: false, error: 'Database connection is not configured in .env.local' },
      { status: 500 }
    );
  }

  try {
    const connection = await pool.getConnection();

    // Query 1: Summary by Doctor
    const summaryWhere = [
      'o.vstdate BETWEEN ? AND ?',
      "IFNULL(o.an, '') = ''",
      "o.pttype = '00'" // สิทธิประกันสังคมทำฟัน (2.1.1.1)
    ];
    const summaryParams: any[] = [ds1, ds2];

    if (doctorFilter) {
      summaryWhere.push('o.doctor = ?');
      summaryParams.push(doctorFilter);
    }

    const summaryQuery = `
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
      LEFT JOIN doctor d ON d.code = o.doctor
      WHERE ${summaryWhere.join(' AND ')}
      GROUP BY IFNULL(o.doctor, 'UNKNOWN'), IFNULL(d.name, IFNULL(o.doctor, 'ไม่ระบุชื่อแพทย์')), DATE_FORMAT(o.vstdate, '%Y-%m')
      ORDER BY doctor_name ASC, ym ASC
    `;

    const [summaryRows] = await connection.query(summaryQuery, summaryParams);

    const doctorMap: Record<string, DentalDoctorSummaryItem> = {};
    const monthsSet = new Set<string>();

    (summaryRows as any[]).forEach(row => {
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

    // Query 2: Detailed visit items if requested
    let visitsData: DentalPatientVisitItem[] = [];
    if (fetchVisits) {
      const visitWhere = [
        'o.vstdate BETWEEN ? AND ?',
        "IFNULL(o.an, '') = ''",
        "o.pttype = '00'"
      ];
      const visitParams: any[] = [ds1, ds2];

      if (doctorFilter) {
        visitWhere.push('o.doctor = ?');
        visitParams.push(doctorFilter);
      }

      const visitQuery = `
        SELECT 
          o.vn,
          o.hn,
          IFNULL(pt.cid, '') AS cid,
          CONCAT(IFNULL(pt.pname,''), IFNULL(pt.fname,''), ' ', IFNULL(pt.lname,'')) AS ptname,
          CASE pt.sex WHEN '1' THEN 'ชาย' WHEN '2' THEN 'หญิง' ELSE 'ไม่ระบุ' END AS sex,
          IFNULL(TIMESTAMPDIFF(YEAR, pt.birthday, o.vstdate), 0) AS age,
          DATE_FORMAT(o.vstdate, '%Y-%m-%d') AS vstdate,
          TIME_FORMAT(o.vsttime, '%H:%i:%s') AS vsttime,
          IFNULL(k.department, o.main_dep) AS department,
          IFNULL(v.pdx, '') AS pdx,
          IFNULL(icd.name, v.pdx) AS pdxname,
          IFNULL(o.doctor, '') AS doctor_code,
          IFNULL(d.name, o.doctor) AS doctor_name,
          IFNULL(v.income, 0) AS income,
          IFNULL(v.uc_money, 0) AS uc_money,
          IFNULL(v.discount_money, 0) AS discount_money,
          IFNULL(v.paid_money, 0) AS paid_money,
          IFNULL(v.rcpt_money, 0) AS rcpt_money,
          (IFNULL(v.income, 0) - IFNULL(v.discount_money, 0) - IFNULL(v.rcpt_money, 0)) AS debit,
          IFNULL(v.rcpno_list, '') AS rcpno
        FROM ovst o
        INNER JOIN vn_stat v ON v.vn = o.vn
        LEFT JOIN patient pt ON pt.hn = o.hn
        LEFT JOIN kskdepartment k ON k.depcode = o.main_dep
        LEFT JOIN icd101 icd ON icd.code = v.pdx
        LEFT JOIN doctor d ON d.code = o.doctor
        WHERE ${visitWhere.join(' AND ')}
        ORDER BY o.vstdate DESC, o.vsttime DESC
        LIMIT 1000
      `;

      const [vRows] = await connection.query(visitQuery, visitParams);
      visitsData = vRows as DentalPatientVisitItem[];
    }

    connection.release();

    return NextResponse.json({
      success: true,
      months,
      doctors,
      monthlyTotals,
      grandTotal,
      visits: visitsData,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/sss-dental Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
