import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool() {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    return null;
  }
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'hos',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export interface IPDRecord {
  an: string;
  hn: string;
  cid: string;
  ptname: string;
  sex: string;
  age: number;
  admdate: string;
  dchdate: string;
  los: number;
  editdate: string | null;
  summary_days: number | null;
  ward: string;
  ward_name: string;
  bedno: string;
  clinic: string;
  prediag: string;
  pdx: string;
  pdxname: string;
  sdx: string;
  proc: string;
  adjrw: number;
  admdoctor: string;
  dchdoctor: string;
  authencode: string;
  pttype: string;
  pttypename: string;
  pttype_eclaim_id: string;
  accountcode: string;
  hospmain: string;
  hospsub: string;
  dchstts: string;
  dchtype: string;
  status: string;
  income: number;
  uc_money: number;
  discount_money: number;
  paid_money: number;
  rcpt_money: number;
  rcpno: string;
  debit: number;
  room: number;
  prosthesis: number;
  drug: number;
  medhome: number;
  nondrug: number;
  blood: number;
  lab: number;
  xray: number;
  special: number;
  equip: number;
  operate: number;
  nurse: number;
  dent: number;
  physic: number;
  therapy: number;
  other: number;
  ned: number;
  feedoctor: number;
}

export function generateMockIPDData(ds1: string, ds2: string): IPDRecord[] {
  const wards = [
    { code: '01', name: 'หอผู้ป่วยอายุรกรรมชาย' },
    { code: '02', name: 'หอผู้ป่วยอายุรกรรมหญิง' },
    { code: '03', name: 'หอผู้ป่วยศัลยกรรม' },
    { code: '04', name: 'หอผู้ป่วยสูติ-นรีเวชกรรม' },
    { code: '05', name: 'หอผู้ป่วยกุมารเวชกรรม' },
    { code: '06', name: 'ICU รวม' }
  ];

  const pttypes = [
    { code: 'UCS', name: 'ประกันสุขภาพถ้วนหน้า (บัตรทอง)', eclaim: '10', acc: '1102050101.101' },
    { code: 'OFC', name: 'ข้าราชการ กรมบัญชีกลาง', eclaim: '01', acc: '1102050101.201' },
    { code: 'SSS', name: 'ประกันสังคม', eclaim: '03', acc: '1102050101.301' },
    { code: 'LGO', name: 'องค์กรปกครองส่วนท้องถิ่น (อปท.)', eclaim: '07', acc: '1102050101.202' },
    { code: 'CASH', name: 'ชำระเงินสด / สิทธิอื่นๆ', eclaim: '99', acc: '1102050101.999' }
  ];

  const diseases = [
    { pdx: 'J189', name: 'Pneumonia, unspecified', adjrw: 1.4520 },
    { pdx: 'I500', name: 'Congestive heart failure', adjrw: 2.1540 },
    { pdx: 'E119', name: 'Type 2 diabetes mellitus without complications', adjrw: 0.8420 },
    { pdx: 'K358', name: 'Other and unspecified acute appendicitis', adjrw: 1.8900 },
    { pdx: 'A099', name: 'Gastroenteritis and colitis of unspecified origin', adjrw: 0.5210 },
    { pdx: 'N390', name: 'Urinary tract infection, site not specified', adjrw: 0.9120 },
    { pdx: 'I639', name: 'Cerebral infarction, unspecified', adjrw: 2.7630 },
    { pdx: 'J441', name: 'Chronic obstructive pulmonary disease with acute exacerbation', adjrw: 1.6200 },
    { pdx: 'S060', name: 'Concussion', adjrw: 0.7800 },
    { pdx: 'K802', name: 'Calculus of gallbladder without cholecystitis', adjrw: 1.9400 }
  ];

  const doctors = ['นพ.สมชาย วิจิตรศิลป์', 'พญ.กานดา สุขสวัสดิ์', 'นพ.เกียรติศักดิ์ ชัยมงคล', 'พญ.พิมพ์ใจ เกียรติสกุล', 'นพ.ประเสริฐ เลิศรัศมี'];

  const results: IPDRecord[] = [];
  const count = 45;

  for (let i = 1; i <= count; i++) {
    const an = `67${String(i).padStart(6, '0')}`;
    const hn = `59${String(1000 + i * 37).padStart(7, '0')}`;
    const w = wards[i % wards.length];
    const pt = pttypes[i % pttypes.length];
    const d = diseases[i % diseases.length];
    const doc = doctors[i % doctors.length];
    
    let summary_days: number | null = null;
    if (i % 7 === 0) {
      summary_days = null;
    } else if (i % 5 === 0) {
      summary_days = 16 + (i % 10);
    } else if (i % 3 === 0) {
      summary_days = 8 + (i % 8);
    } else {
      summary_days = (i % 7);
    }

    const los = 2 + (i % 12);
    const room = los * 1200;
    const drug = 1500 + (i * 350);
    const lab = 800 + (i * 120);
    const xray = i % 2 === 0 ? 600 : 0;
    const operate = i % 3 === 0 ? 7500 : 0;
    const nurse = los * 300;
    const feedoctor = los * 400;
    const other = 500;
    const income = room + drug + lab + xray + operate + nurse + feedoctor + other;
    
    const paid_money = pt.code === 'CASH' ? income : (i % 4 === 0 ? 500 : 0);
    const discount_money = 0;
    const uc_money = income - paid_money;
    const rcpt_money = paid_money;
    const debit = income - discount_money - rcpt_money;

    results.push({
      an,
      hn,
      cid: `1100${String(100000000 + i * 821).slice(0, 9)}`,
      ptname: ['นายสมพร เจริญผล', 'นางสมศรี ใจดี', 'นายประยุทธ์ สว่างวงศ์', 'นางสาวกาญจนา มงคล', 'ด.ช.ธนากร บุญรอด', 'นางปราณี รัตนกาญจน์'][i % 6] + ` (${i})`,
      sex: i % 2 === 0 ? 'หญิง' : 'ชาย',
      age: 18 + (i * 2) % 65,
      admdate: ds1 || '2024-03-01',
      dchdate: ds2 || '2024-03-05',
      los,
      editdate: summary_days !== null ? '2024-03-10' : null,
      summary_days,
      ward: w.code,
      ward_name: w.name,
      bedno: `B${(i % 20) + 1}`,
      clinic: 'IPD-MED',
      prediag: d.name,
      pdx: d.pdx,
      pdxname: d.name,
      sdx: i % 2 === 0 ? 'I10:Essential (primary) hypertension' : '',
      proc: operate > 0 ? '4709:Other appendectomy' : '',
      adjrw: d.adjrw,
      admdoctor: doc,
      dchdoctor: doc,
      authencode: i % 4 === 0 ? '' : `AUTH${String(100000 + i)}`,
      pttype: pt.code,
      pttypename: pt.name,
      pttype_eclaim_id: pt.eclaim,
      accountcode: pt.acc,
      hospmain: '10670:รพ.ศูนย์ตัวอย่าง',
      hospsub: '10670:รพ.ศูนย์ตัวอย่าง',
      dchstts: '01:Complete Recovery',
      dchtype: '01:With Approval',
      status: summary_days !== null ? 'สรุปผลแล้ว' : 'รอแพทย์สรุป',
      income,
      uc_money,
      discount_money,
      paid_money,
      rcpt_money,
      rcpno: paid_money > 0 ? `RCP67/${String(1000 + i)}` : '',
      debit,
      room,
      prosthesis: 0,
      drug,
      medhome: 300,
      nondrug: 450,
      blood: 0,
      lab,
      xray,
      special: 0,
      equip: 0,
      operate,
      nurse,
      dent: 0,
      physic: 0,
      therapy: 0,
      other,
      ned: 0,
      feedoctor,
    });
  }

  return results;
}
