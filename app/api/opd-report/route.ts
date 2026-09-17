import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface OPDRecord {
  vn: string;
  hn: string;
  an: string;
  cid: string;
  ptname: string;
  sex: string;
  age: number;
  vstdate: string;
  vsttime: string;
  department: string;
  clinic: string;
  pdx: string;
  pdxname: string;
  pttype: string;
  pttypename: string;
  pttype_eclaim_id: string;
  pttype_eclaim_name: string;
  accountcode: string;
  income: number;
  uc_money: number;
  discount_money: number;
  paid_money: number;
  rcpt_money: number;
  rcpno: string;
  debit: number;
  doctorname: string;
  ct: number;
  cm: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ds1 = searchParams.get('ds1') || '2026-09-10';
  const ds2 = searchParams.get('ds2') || '2026-09-10';
  const pttype = searchParams.get('pttype') || '';
  const isAll = searchParams.get('all') === 'true'; // lall in FoxPro

  const pool = getDbPool();

  if (!pool) {
    return NextResponse.json(
      { success: false, error: 'Database connection is not configured in .env.local' },
      { status: 500 }
    );
  }

  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        o.vn,
        o.hn,
        IFNULL(o.an, '') AS an,
        IFNULL(pt.cid, '') AS cid,
        CONCAT(IFNULL(pt.pname,''), IFNULL(pt.fname,''), ' ', IFNULL(pt.lname,'')) AS ptname,
        CASE pt.sex WHEN '1' THEN 'ชาย' WHEN '2' THEN 'หญิง' ELSE 'ไม่ระบุ' END AS sex,
        IFNULL(TIMESTAMPDIFF(YEAR, pt.birthday, o.vstdate), 0) AS age,
        DATE_FORMAT(o.vstdate, '%Y-%m-%d') AS vstdate,
        TIME_FORMAT(o.vsttime, '%H:%i:%s') AS vsttime,
        IFNULL(k.department, o.main_dep) AS department,
        IFNULL(sp.name, o.spclty) AS clinic,
        IFNULL(v.pdx, '') AS pdx,
        IFNULL(icd.name, v.pdx) AS pdxname,
        IFNULL(o.pttype, '') AS pttype,
        IFNULL(ptt.name, o.pttype) AS pttypename,
        IFNULL(ptt.pttype_eclaim_id, '') AS pttype_eclaim_id,
        IFNULL(e.name, '') AS pttype_eclaim_name,
        IFNULL(e.ar_opd, '') AS accountcode,
        IFNULL(v.income, 0) AS income,
        IFNULL(v.uc_money, 0) AS uc_money,
        IFNULL(v.discount_money, 0) AS discount_money,
        IFNULL(v.paid_money, 0) AS paid_money,
        IFNULL(v.rcpt_money, 0) AS rcpt_money,
        IFNULL(v.rcpno_list, '') AS rcpno,
        (IFNULL(v.income, 0) - IFNULL(v.discount_money, 0) - IFNULL(v.rcpt_money, 0)) AS debit,
        IFNULL(d.name, o.doctor) AS doctorname,
        0 AS ct,
        0 AS cm
      FROM ovst o
      LEFT JOIN vn_stat v ON v.vn = o.vn
      LEFT JOIN patient pt ON pt.hn = o.hn
      LEFT JOIN pttype ptt ON ptt.pttype = o.pttype
      LEFT JOIN pttype_eclaim e ON e.code = ptt.pttype_eclaim_id
      LEFT JOIN kskdepartment k ON k.depcode = o.main_dep
      LEFT JOIN spclty sp ON sp.spclty = o.spclty
      LEFT JOIN icd101 icd ON icd.code = v.pdx
      LEFT JOIN doctor d ON d.code = o.doctor
      WHERE o.vstdate BETWEEN ? AND ?
      ${!isAll ? "AND IFNULL(o.an, '') = ''" : ""}
      ${pttype ? "AND o.pttype = ?" : ""}
      GROUP BY o.vn
      ORDER BY o.vstdate DESC, o.vsttime DESC
    `;

    const params = pttype ? [ds1, ds2, pttype] : [ds1, ds2];
    const [rows] = await connection.query(query, params);
    connection.release();

    return NextResponse.json({
      success: true,
      count: (rows as any[]).length,
      data: rows as OPDRecord[],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/opd-report Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
