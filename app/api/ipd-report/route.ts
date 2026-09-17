import { NextResponse } from 'next/server';
import { getDbPool, IPDRecord } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ds1 = searchParams.get('ds1') || '2026-09-01';
  const ds2 = searchParams.get('ds2') || '2026-09-10';
  const pttype = searchParams.get('pttype') || '';

  const pool = getDbPool();

  if (!pool) {
    return NextResponse.json(
      { success: false, error: 'Database connection is not configured in .env.local' },
      { status: 500 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Query ดึงข้อมูลจริงจาก HOSxP MySQL 100% (ไม่มี Mock)
    const query = `
      SELECT 
        i.an,
        i.hn,
        IFNULL(pt.cid, '') AS cid,
        CONCAT(IFNULL(pt.pname,''), IFNULL(pt.fname,''), ' ', IFNULL(pt.lname,'')) AS ptname,
        CASE pt.sex WHEN '1' THEN 'ชาย' WHEN '2' THEN 'หญิง' ELSE 'ไม่ระบุ' END AS sex,
        IFNULL(TIMESTAMPDIFF(YEAR, pt.birthday, i.regdate), 0) AS age,
        DATE_FORMAT(i.regdate, '%Y-%m-%d') AS admdate,
        DATE_FORMAT(i.dchdate, '%Y-%m-%d') AS dchdate,
        IFNULL(DATEDIFF(i.dchdate, i.regdate), 0) AS los,
        DATE_FORMAT(idx.modify_datetime, '%Y-%m-%d') AS editdate,
        DATEDIFF(idx.modify_datetime, i.dchdate) AS summary_days,
        IFNULL(i.ward, '') AS ward,
        IFNULL(w.name, i.ward) AS ward_name,
        '' AS bedno,
        IFNULL(sp.name, i.spclty) AS clinic,
        IFNULL(i.prediag, '') AS prediag,
        IFNULL(a.pdx, '') AS pdx,
        IFNULL(icd.name, a.pdx) AS pdxname,
        '' AS sdx,
        '' AS proc,
        IFNULL(i.adjrw, 0) AS adjrw,
        IFNULL(d1.name, i.admdoctor) AS admdoctor,
        IFNULL(d2.name, i.dch_doctor) AS dchdoctor,
        '' AS authencode,
        IFNULL(i.pttype, '') AS pttype,
        IFNULL(ptt.name, i.pttype) AS pttypename,
        IFNULL(ptt.pttype_eclaim_id, '') AS pttype_eclaim_id,
        IFNULL(e.ar_ipd, '') AS accountcode,
        '' AS hospmain,
        '' AS hospsub,
        IFNULL(ds.name, i.dchstts) AS dchstts,
        IFNULL(dt.name, i.dchtype) AS dchtype,
        IF(idx.modify_datetime IS NOT NULL, 'สรุปผลแล้ว', 'รอสรุป') AS status,
        IFNULL(a.income, 0) AS income,
        IFNULL(a.uc_money, 0) AS uc_money,
        IFNULL(a.discount_money, 0) AS discount_money,
        IFNULL(a.paid_money, 0) AS paid_money,
        IFNULL(a.rcpt_money, 0) AS rcpt_money,
        IFNULL(a.rcpno_list, '') AS rcpno,
        (IFNULL(a.income, 0) - IFNULL(a.discount_money, 0) - IFNULL(a.rcpt_money, 0)) AS debit,
        0 AS room, 0 AS prosthesis, 0 AS drug, 0 AS medhome, 0 AS nondrug,
        0 AS blood, 0 AS lab, 0 AS xray, 0 AS special, 0 AS equip,
        0 AS operate, 0 AS nurse, 0 AS dent, 0 AS physic, 0 AS therapy,
        0 AS other, 0 AS ned, 0 AS feedoctor
      FROM ipt i
      LEFT JOIN an_stat a ON a.an = i.an
      LEFT JOIN patient pt ON i.hn = pt.hn
      LEFT JOIN pttype ptt ON ptt.pttype = i.pttype
      LEFT JOIN pttype_eclaim e ON e.code = ptt.pttype_eclaim_id
      LEFT JOIN ward w ON w.ward = i.ward
      LEFT JOIN spclty sp ON sp.spclty = i.spclty
      LEFT JOIN icd101 icd ON icd.code = a.pdx
      LEFT JOIN doctor d1 ON d1.code = i.admdoctor
      LEFT JOIN doctor d2 ON d2.code = i.dch_doctor
      LEFT JOIN dchstts ds ON ds.dchstts = i.dchstts
      LEFT JOIN dchtype dt ON dt.dchtype = i.dchtype
      LEFT JOIN iptdiag idx ON i.an = idx.an AND idx.diagtype = 1
      WHERE i.dchdate BETWEEN ? AND ?
      ${pttype ? 'AND i.pttype = ?' : ''}
      GROUP BY i.an
      ORDER BY i.dchdate DESC, i.an DESC
    `;

    const params = pttype ? [ds1, ds2, pttype] : [ds1, ds2];
    const [rows] = await connection.query(query, params);

    return NextResponse.json({
      success: true,
      source: 'database',
      count: (rows as any[]).length,
      data: rows as IPDRecord[],
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/ipd-report Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
