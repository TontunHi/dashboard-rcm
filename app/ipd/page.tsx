'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { IPDRecord } from '@/lib/db';
import { OPDRecord } from '@/app/api/opd-report/route';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, Activity, DollarSign, Clock, Search, 
  Download, Filter, RefreshCw, FileText, AlertCircle, AlertTriangle, CheckCircle, HelpCircle,
  Building, Stethoscope, BedDouble, ChevronRight, Calendar, CalendarRange, RotateCcw, ChevronDown, X,
  CreditCard, Receipt, Send
} from 'lucide-react';

const COLORS = ['#059669', '#10b981', '#14b8a6', '#0d9488', '#34d399', '#2dd4bf', '#047857'];

export default function AppBrowserTabs() {
  // Main Browser Tabs: 'ipd' | 'opd'
  const [mainTab, setMainTab] = useState<'ipd' | 'opd'>('ipd');

  // Dates & Time Range Modes: 'custom' | 'month' | 'year'
  const today = new Date();
  const currentCalYear = today.getFullYear();
  // ปีงบประมาณไทย: ถ้าเดือนตั้งแต่ตุลาคม (10) เป็นต้นไป ให้นับเป็นปีงบประมาณถัดไป (CalYear + 1)
  const defaultFiscalYear = today.getMonth() + 1 >= 10 ? currentCalYear + 1 : currentCalYear;

  const [dateMode, setDateMode] = useState<'custom' | 'month' | 'year'>('custom');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(defaultFiscalYear);

  const [ds1, setDs1] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [ds2, setDs2] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Telegram Notification Test State
  const [telegramLoading, setTelegramLoading] = useState<boolean>(false);

  const handleSendTelegramTest = async () => {
    if (!confirm('ต้องการส่งข้อความสรุปชาร์ตค้าง IPD เข้ากลุ่ม Telegram ตอนนี้เลยใช่หรือไม่?')) {
      return;
    }
    setTelegramLoading(true);
    try {
      const res = await fetch('/api/telegram-notify', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('✅ ' + json.message);
      } else {
        alert('❌ เกิดข้อผิดพลาด: ' + (json.error || 'ไม่สามารถส่งข้อความได้'));
      }
    } catch (err: any) {
      alert('❌ ไม่สามารถเชื่อมต่อ API ได้: ' + err.message);
    } finally {
      setTelegramLoading(false);
    }
  };

  const thaiMonths = [
    { value: 1, name: 'มกราคม' },
    { value: 2, name: 'กุมภาพันธ์' },
    { value: 3, name: 'มีนาคม' },
    { value: 4, name: 'เมษายน' },
    { value: 5, name: 'พฤษภาคม' },
    { value: 6, name: 'มิถุนายน' },
    { value: 7, name: 'กรกฎาคม' },
    { value: 8, name: 'สิงหาคม' },
    { value: 9, name: 'กันยายน' },
    { value: 10, name: 'ตุลาคม' },
    { value: 11, name: 'พฤศจิกายน' },
    { value: 12, name: 'ธันวาคม' }
  ];

  // Helper to change Month (กำหนดช่วงวันที่ของเดือน แต่ไม่ยิง fetch อัตโนมัติ ให้กดปุ่มดึงข้อมูล)
  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
    const mStr = String(month).padStart(2, '0');
    // คำนวณวันสุดท้ายของเดือน
    const lastDay = new Date(currentCalYear, month, 0).getDate();
    const start = `${currentCalYear}-${mStr}-01`;
    const end = `${currentCalYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    setDs1(start);
    setDs2(end);
  };

  // Helper to change Fiscal Year (1 ต.ค. ปี [Y-1] ถึง 30 ก.ย. ปี [Y])
  const handleSelectFiscalYear = (fiscalYear: number) => {
    setSelectedYear(fiscalYear);
    const start = `${fiscalYear - 1}-10-01`;
    const end = `${fiscalYear}-09-30`;
    setDs1(start);
    setDs2(end);
  };

  const fetchWithDates = (start: string, end: string) => {
    if (mainTab === 'ipd') {
      fetchIPDWithDates(start, end);
    } else {
      fetchOPDWithDates(start, end);
    }
  };

  // IPD States
  const [ipdData, setIpdData] = useState<IPDRecord[]>([]);
  const [ipdLoading, setIpdLoading] = useState<boolean>(false);
  const [ipdSearch, setIpdSearch] = useState<string>('');
  const [ipdWard, setIpdWard] = useState<string>('all');
  const [ipdPttype, setIpdPttype] = useState<string>('all');
  const [ipdDoctor, setIpdDoctor] = useState<string>('all');
  const [ipdDoctorDc, setIpdDoctorDc] = useState<string>('all');
  const [ipdDelayGroup, setIpdDelayGroup] = useState<string>('all');
  const [ipdSubTab, setIpdSubTab] = useState<'list' | 'doctor' | 'doctor_dc' | 'overview'>('list');

  // OPD States (2.1.1.2)
  const [opdData, setOpdData] = useState<OPDRecord[]>([]);
  const [opdLoading, setOpdLoading] = useState<boolean>(false);
  const [opdSearch, setOpdSearch] = useState<string>('');
  const [opdDept, setOpdDept] = useState<string>('all');
  const [opdPttype, setOpdPttype] = useState<string>('all');
  const [opdClinic, setOpdClinic] = useState<string>('all');
  const [opdEclaimFilter, setOpdEclaimFilter] = useState<string>('all');
  const [opdSubTab, setOpdSubTab] = useState<'list' | 'eclaim' | 'overview'>('eclaim');
  const [opdIncludeAdmit, setOpdIncludeAdmit] = useState<boolean>(false);

  // กลุ่มสิทธิการเงินเป้าหมาย 2.1.1.2: 16-20, 27, 28, 29, 30 พร้อมชื่อมาตรฐาน
  const TARGET_ECLAIMS_MAP: Record<string, string> = useMemo(() => ({
    '16': 'เบิกต้นสังกัด',
    '17': 'เบิกจ่ายตรงกรมบัญชีกลาง',
    '18': 'เบิกจ่ายตรง อปท.',
    '19': 'เบิกจ่ายตรง อปท.รูปแบบพิเศษ (กทม)',
    '20': 'เบิกจ่ายตรง อปท.รูปแบบพิเศษ (พัทยา)',
    '27': 'ชำระเงิน',
    '28': 'พรบ.รถ',
    '29': 'ตรวจสุขภาพหน่วยงานภาครัฐ',
    '30': 'ค่าตรวจสุขภาพบุคคลภายนอก',
  }), []);

  const TARGET_ECLAIMS = useMemo(() => Object.keys(TARGET_ECLAIMS_MAP), [TARGET_ECLAIMS_MAP]);

  // Fetch IPD
  const fetchIPDWithDates = async (start = ds1, end = ds2) => {
    setIpdLoading(true);
    try {
      const res = await fetch(`/api/ipd-report?ds1=${start}&ds2=${end}`);
      const json = await res.json();
      if (json.success) {
        setIpdData(json.data);
      } else {
        alert('เกิดข้อผิดพลาดในการดึงข้อมูล IPD: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIpdLoading(false);
    }
  };

  const fetchIPD = () => fetchIPDWithDates(ds1, ds2);

  // Fetch OPD
  const fetchOPDWithDates = async (start = ds1, end = ds2) => {
    setOpdLoading(true);
    try {
      const res = await fetch(`/api/opd-report?ds1=${start}&ds2=${end}&all=${opdIncludeAdmit}`);
      const json = await res.json();
      if (json.success) {
        setOpdData(json.data);
      } else {
        alert('เกิดข้อผิดพลาดในการดึงข้อมูล OPD: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOpdLoading(false);
    }
  };

  const fetchOPD = () => fetchOPDWithDates(ds1, ds2);

  useEffect(() => {
    fetchIPD();
  }, []);

  // IPD Filtered Data
  const filteredIPD = useMemo(() => {
    return ipdData.filter((item) => {
      const q = ipdSearch.toLowerCase();
      const matchesSearch = 
        !ipdSearch ||
        (item.an || '').toLowerCase().includes(q) ||
        (item.hn || '').toLowerCase().includes(q) ||
        (item.ptname || '').toLowerCase().includes(q) ||
        (item.pdx || '').toLowerCase().includes(q) ||
        (item.pdxname || '').toLowerCase().includes(q) ||
        (item.admdoctor || '').toLowerCase().includes(q);

      const matchesWard = ipdWard === 'all' || item.ward_name === ipdWard;
      const matchesPttype = ipdPttype === 'all' || item.pttype === ipdPttype;
      const matchesDoctor = ipdDoctor === 'all' || item.admdoctor === ipdDoctor;
      const matchesDoctorDc = ipdDoctorDc === 'all' || item.dchdoctor === ipdDoctorDc;

      let matchesDelay = true;
      if (ipdDelayGroup === 'gt15') matchesDelay = item.summary_days !== null && item.summary_days > 15;
      else if (ipdDelayGroup === '8-15') matchesDelay = item.summary_days !== null && item.summary_days >= 8 && item.summary_days <= 15;
      else if (ipdDelayGroup === 'lt8') matchesDelay = item.summary_days !== null && item.summary_days < 8;
      else if (ipdDelayGroup === 'null') matchesDelay = item.summary_days === null;

      return matchesSearch && matchesWard && matchesPttype && matchesDoctor && matchesDoctorDc && matchesDelay;
    });
  }, [ipdData, ipdSearch, ipdWard, ipdPttype, ipdDoctor, ipdDoctorDc, ipdDelayGroup]);

  // OPD Filtered Data (กรองเฉพาะสิทธิเป้าหมาย 16-20, 27-30 ตามสเปก 2.1.1.2)
  const filteredOPD = useMemo(() => {
    return opdData.filter((item) => {
      // 1. ตรวจสอบสิทธิ eClaim ต้องเป็น 16-20, 27-30
      const eclaimId = (item.pttype_eclaim_id || '').trim();
      const inTargetEclaims = TARGET_ECLAIMS.includes(eclaimId);
      if (!inTargetEclaims) return false;

      const q = opdSearch.toLowerCase();
      const matchesSearch = 
        !opdSearch ||
        (item.vn || '').toLowerCase().includes(q) ||
        (item.hn || '').toLowerCase().includes(q) ||
        (item.ptname || '').toLowerCase().includes(q) ||
        (item.pdx || '').toLowerCase().includes(q) ||
        (item.pdxname || '').toLowerCase().includes(q) ||
        (item.doctorname || '').toLowerCase().includes(q);

      const matchesDept = opdDept === 'all' || item.department === opdDept;
      const matchesPttype = opdPttype === 'all' || item.pttype === opdPttype;
      const matchesClinic = opdClinic === 'all' || item.clinic === opdClinic;
      const matchesEclaim = opdEclaimFilter === 'all' || eclaimId === opdEclaimFilter;

      return matchesSearch && matchesDept && matchesPttype && matchesClinic && matchesEclaim;
    });
  }, [opdData, opdSearch, opdDept, opdPttype, opdClinic, opdEclaimFilter, TARGET_ECLAIMS]);

  // IPD Summary Metrics
  const ipdMetrics = useMemo(() => {
    const totalCases = filteredIPD.length;
    const totalIncome = filteredIPD.reduce((acc, curr) => acc + (Number(curr.income) || 0), 0);
    const totalDebit = filteredIPD.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
    const totalAdjrw = filteredIPD.reduce((acc, curr) => acc + (Number(curr.adjrw) || 0), 0);
    const avgCmi = totalCases > 0 ? totalAdjrw / totalCases : 0;
    const totalLos = filteredIPD.reduce((acc, curr) => acc + (Number(curr.los) || 0), 0);
    const avgLos = totalCases > 0 ? totalLos / totalCases : 0;

    const gt15 = filteredIPD.filter(d => d.summary_days !== null && d.summary_days > 15).length;
    const b8to15 = filteredIPD.filter(d => d.summary_days !== null && d.summary_days >= 8 && d.summary_days <= 15).length;
    const lt8 = filteredIPD.filter(d => d.summary_days !== null && d.summary_days >= 0 && d.summary_days < 8).length;
    const notFinal = filteredIPD.filter(d => d.summary_days === null).length;

    return { totalCases, totalIncome, totalDebit, totalAdjrw, avgCmi, totalLos, avgLos, gt15, b8to15, lt8, notFinal };
  }, [filteredIPD]);

  // OPD Summary Metrics (แยกตัวเลขรายได้ชัดเจน)
  const opdMetrics = useMemo(() => {
    const totalVisits = filteredOPD.length;
    const totalHn = new Set(filteredOPD.map(d => d.hn)).size;
    const totalIncome = filteredOPD.reduce((acc, curr) => acc + (Number(curr.income) || 0), 0);
    const totalUcMoney = filteredOPD.reduce((acc, curr) => acc + (Number(curr.uc_money) || 0), 0);
    const totalDiscount = filteredOPD.reduce((acc, curr) => acc + (Number(curr.discount_money) || 0), 0);
    const totalPaidMoney = filteredOPD.reduce((acc, curr) => acc + (Number(curr.paid_money) || 0), 0);
    const totalRcptMoney = filteredOPD.reduce((acc, curr) => acc + (Number(curr.rcpt_money) || 0), 0);
    const totalDebit = filteredOPD.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
    const avgIncome = totalVisits > 0 ? totalIncome / totalVisits : 0;
    return { 
      totalVisits, 
      totalHn, 
      totalIncome, 
      totalUcMoney, 
      totalDiscount, 
      totalPaidMoney, 
      totalRcptMoney, 
      totalDebit, 
      avgIncome 
    };
  }, [filteredOPD]);

  // OPD Group by สิทธิการเงิน (eClaim 16-20, 27-30)
  const opdEclaimSummaryData = useMemo(() => {
    const map: Record<string, {
      code: string;
      name: string;
      cases: number;
      visits: number;
      totalIncome: number;
      totalUcMoney: number;
      totalDiscount: number;
      totalPaidMoney: number;
      totalRcptMoney: number;
      totalDebit: number;
    }> = {};

    // เริ่มต้นให้มีครบทุกกลุ่มเป้าหมาย (16, 17, 18, 19, 20, 27, 28, 29, 30) เสมอ แม้ยังไม่มียอด
    TARGET_ECLAIMS.forEach(code => {
      map[code] = {
        code,
        name: TARGET_ECLAIMS_MAP[code] || code,
        cases: 0,
        visits: 0,
        totalIncome: 0,
        totalUcMoney: 0,
        totalDiscount: 0,
        totalPaidMoney: 0,
        totalRcptMoney: 0,
        totalDebit: 0,
      };
    });

    filteredOPD.forEach(d => {
      const code = (d.pttype_eclaim_id || '').trim();
      if (!code) return;
      if (!map[code]) {
        map[code] = {
          code,
          name: d.pttype_eclaim_name || d.pttypename || TARGET_ECLAIMS_MAP[code] || code,
          cases: 0,
          visits: 0,
          totalIncome: 0,
          totalUcMoney: 0,
          totalDiscount: 0,
          totalPaidMoney: 0,
          totalRcptMoney: 0,
          totalDebit: 0,
        };
      } else if (d.pttype_eclaim_name) {
        map[code].name = d.pttype_eclaim_name;
      }

      map[code].visits += 1;
      map[code].totalIncome += Number(d.income || 0);
      map[code].totalUcMoney += Number(d.uc_money || 0);
      map[code].totalDiscount += Number(d.discount_money || 0);
      map[code].totalPaidMoney += Number(d.paid_money || 0);
      map[code].totalRcptMoney += Number(d.rcpt_money || 0);
      map[code].totalDebit += Number(d.debit || 0);
    });

    return Object.values(map).sort((a, b) => Number(a.code) - Number(b.code));
  }, [filteredOPD, TARGET_ECLAIMS, TARGET_ECLAIMS_MAP]);

  const availableYears = useMemo(() => {
    const list = [];
    for (let y = defaultFiscalYear; y >= defaultFiscalYear - 7; y--) {
      list.push(y);
    }
    return list;
  }, [defaultFiscalYear]);

  const ipdWards = useMemo(() => Array.from(new Set(ipdData.map(d => d.ward_name).filter(Boolean))).sort(), [ipdData]);
  const ipdDoctors = useMemo(() => Array.from(new Set(ipdData.map(d => d.admdoctor).filter(Boolean))).sort(), [ipdData]);
  const ipdDoctorsDc = useMemo(() => Array.from(new Set(ipdData.map(d => d.dchdoctor).filter(Boolean))).sort(), [ipdData]);
  const ipdPttypes = useMemo(() => {
    const map = new Map<string, string>();
    ipdData.forEach(d => {
      if (d.pttype) {
        map.set(d.pttype, d.pttypename || d.pttype);
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [ipdData]);

  // Doctor Admit Breakdown (แพทย์ admit, จำนวน, SumAdjRW, CMI, Income)
  const doctorSummaryData = useMemo(() => {
    const map: Record<string, { doctor: string; cases: number; sumAdjrw: number; totalIncome: number }> = {};
    filteredIPD.forEach(d => {
      const doc = d.admdoctor || 'ไม่ระบุแพทย์ Admit';
      if (!map[doc]) {
        map[doc] = { doctor: doc, cases: 0, sumAdjrw: 0, totalIncome: 0 };
      }
      map[doc].cases += 1;
      map[doc].sumAdjrw += Number(d.adjrw || 0);
      map[doc].totalIncome += Number(d.income || 0);
    });
    return Object.values(map).sort((a, b) => b.cases - a.cases);
  }, [filteredIPD]);

  // Doctor D/C Breakdown (แพทย์จำหน่าย, จำนวน, SumAdjRW, CMI, Income)
  const doctorDcSummaryData = useMemo(() => {
    const map: Record<string, { doctor: string; cases: number; sumAdjrw: number; totalIncome: number }> = {};
    filteredIPD.forEach(d => {
      const doc = d.dchdoctor || 'ไม่ระบุแพทย์ D/C';
      if (!map[doc]) {
        map[doc] = { doctor: doc, cases: 0, sumAdjrw: 0, totalIncome: 0 };
      }
      map[doc].cases += 1;
      map[doc].sumAdjrw += Number(d.adjrw || 0);
      map[doc].totalIncome += Number(d.income || 0);
    });
    return Object.values(map).sort((a, b) => b.cases - a.cases);
  }, [filteredIPD]);
  const opdDepts = useMemo(() => Array.from(new Set(opdData.map(d => d.department).filter(Boolean))).sort(), [opdData]);
  const opdPttypes = useMemo(() => {
    const map = new Map<string, string>();
    opdData.forEach(d => {
      if (d.pttype) {
        map.set(d.pttype, d.pttypename || d.pttype);
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [opdData]);
  const opdClinics = useMemo(() => Array.from(new Set(opdData.map(d => d.clinic).filter(Boolean))).sort(), [opdData]);
  const opdEclaims = useMemo(() => {
    const map = new Map<string, string>();
    TARGET_ECLAIMS.forEach(code => {
      map.set(code, TARGET_ECLAIMS_MAP[code] || code);
    });
    opdData.forEach(d => {
      const code = (d.pttype_eclaim_id || '').trim();
      if (TARGET_ECLAIMS.includes(code) && d.pttype_eclaim_name) {
        map.set(code, d.pttype_eclaim_name);
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => Number(a.code) - Number(b.code));
  }, [opdData, TARGET_ECLAIMS, TARGET_ECLAIMS_MAP]);

  // Export CSV IPD
  const exportIPDCSV = () => {
    const headers = ['AN', 'HN', 'ชื่อผู้ป่วย', 'สิทธิ', 'วันนอน (LOS)', 'PDX', 'โรคหลัก', 'AdjRW', 'ค่ารักษา', 'ลูกหนี้ค้างชำระ', 'สถานะสรุปชาร์ต (วัน)'];
    const rows = filteredIPD.map(d => [
      d.an, d.hn, `"${d.ptname}"`, `"${d.pttypename}"`, d.los, d.pdx, `"${d.pdxname}"`, d.adjrw, d.income, d.debit, d.summary_days !== null ? d.summary_days : 'ยังไม่สรุป'
    ]);
    downloadCSV(`ipd_report_${ds1}_${ds2}.csv`, headers, rows);
  };

  // Export CSV OPD
  const exportOPDCSV = () => {
    const headers = ['VN', 'HN', 'ชื่อผู้ป่วย', 'เพศ', 'อายุ', 'วันที่ตรวจ', 'เวลา', 'ห้องตรวจ/จุดบริการ', 'แผนก', 'แพทย์', 'สิทธิการรักษา', 'PDX', 'โรคหลัก', 'ค่ารักษา (บาท)', 'ชำระเอง', 'ลูกหนี้คงค้าง'];
    const rows = filteredOPD.map(d => [
      d.vn, d.hn, `"${d.ptname}"`, d.sex, d.age, d.vstdate, d.vsttime, `"${d.department}"`, `"${d.clinic}"`, `"${d.doctorname}"`, `"${d.pttypename}"`, d.pdx, `"${d.pdxname}"`, d.income, d.rcpt_money, d.debit
    ]);
    downloadCSV(`opd_report_${ds1}_${ds2}.csv`, headers, rows);
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // OPD Dept Chart
  const opdDeptChartData = useMemo(() => {
    const map: Record<string, { name: string; visits: number; income: number }> = {};
    filteredOPD.forEach(d => {
      const dep = d.department || 'ไม่ระบุ';
      if (!map[dep]) map[dep] = { name: dep, visits: 0, income: 0 };
      map[dep].visits += 1;
      map[dep].income += Number(d.income) || 0;
    });
    return Object.values(map).sort((a, b) => b.visits - a.visits).slice(0, 10);
  }, [filteredOPD]);

  // OPD Pttype Chart
  const opdPttypeChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    filteredOPD.forEach(d => {
      const pt = d.pttypename || 'ไม่ระบุ';
      if (!map[pt]) map[pt] = { name: pt, value: 0 };
      map[pt].value += 1;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [filteredOPD]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Top Navigation Bar with Fixed Tabs Order */}
      <Navbar />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        {/* Global Control Bar (Date range, Filters & Actions) */}
        <section className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 space-y-3.5">
          {/* แถวที่ 1: การเลือกช่วงเวลา & ปุ่มดึงข้อมูล & ส่งออกข้อมูล */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Selector Buttons */}
              <div className="bg-emerald-50/70 p-1 rounded-lg flex items-center border border-emerald-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDateMode('custom')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    dateMode === 'custom' 
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' 
                      : 'text-emerald-700 hover:text-emerald-950'
                  }`}
                >
                  📅 กำหนดเอง (วันถึงวัน)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode('month');
                    handleSelectMonth(selectedMonth);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    dateMode === 'month' 
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' 
                      : 'text-emerald-700 hover:text-emerald-950'
                  }`}
                >
                  🗓️ รายเดือน ({currentCalYear + 543})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode('year');
                    handleSelectFiscalYear(selectedYear);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    dateMode === 'year' 
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' 
                      : 'text-emerald-700 hover:text-emerald-950'
                  }`}
                >
                  📆 รายปีงบประมาณ (1 ต.ค. - 30 ก.ย.)
                </button>
              </div>

              {/* Mode 1: Custom Date Range (วันถึงวัน) */}
              {dateMode === 'custom' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">
                    จำหน่าย:
                  </span>
                  <input 
                    type="date" 
                    value={ds1} 
                    onChange={e => setDs1(e.target.value)} 
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                  />
                  <span className="text-slate-400 text-xs">ถึง</span>
                  <input 
                    type="date" 
                    value={ds2} 
                    onChange={e => setDs2(e.target.value)} 
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                  />
                </div>
              )}

              {/* Mode 2: Month Range */}
              {dateMode === 'month' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">เดือน:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedMonth}
                      onChange={e => handleSelectMonth(Number(e.target.value))}
                      className="appearance-none border border-slate-200 bg-white hover:border-emerald-400 text-slate-800 font-semibold rounded-md pl-2.5 pr-7 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {thaiMonths.map(m => (
                        <option key={m.value} value={m.value}>
                          เดือน {m.name} (ปี {currentCalYear + 543})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Mode 3: Fiscal Year Range (1 ต.ค. - 30 ก.ย.) */}
              {dateMode === 'year' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">ปีงบประมาณ:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedYear}
                      onChange={e => handleSelectFiscalYear(Number(e.target.value))}
                      className="appearance-none border border-slate-200 bg-white hover:border-emerald-400 text-slate-800 font-semibold rounded-md pl-2.5 pr-7 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {availableYears.map(yr => (
                        <option key={yr} value={yr}>
                          ปีงบประมาณ {yr + 543}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* ปุ่มดึงข้อมูล */}
              <button 
                onClick={() => fetchWithDates(ds1, ds2)} 
                disabled={mainTab === 'ipd' ? ipdLoading : opdLoading}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" /> ดึงข้อมูล
              </button>
            </div>

            {/* Action Buttons: ส่งออก Excel & ทดสอบส่ง Telegram */}
            <div className="flex items-center gap-2">
              {mainTab === 'ipd' && (
                <button
                  onClick={handleSendTelegramTest}
                  disabled={telegramLoading}
                  className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 hover:text-sky-900 text-xs font-semibold px-3 py-2 rounded-lg border border-sky-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  title="ทดสอบส่งสรุปชาร์ตค้างเข้ากลุ่ม Telegram ตอนนี้"
                >
                  <Send className={`h-3.5 w-3.5 ${telegramLoading ? 'animate-bounce' : ''}`} />
                  <span>{telegramLoading ? 'กำลังส่ง...' : 'ทดสอบส่ง Telegram'}</span>
                </button>
              )}

              <button 
                onClick={mainTab === 'ipd' ? exportIPDCSV : exportOPDCSV}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-600" /> ส่งออก Excel (CSV)
              </button>
            </div>
          </div>

          {/* แถวที่ 2: เมนูกรองข้อมูล IPD (หอผู้ป่วย, สิทธิ, แพทย์) */}
          {mainTab === 'ipd' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-emerald-600" /> ตัวกรองข้อมูล:
                </span>

                {/* Ward Filter */}
                <div className="relative inline-flex items-center">
                  <select 
                    value={ipdWard} 
                    onChange={e => setIpdWard(e.target.value)}
                    className="appearance-none border border-slate-200 hover:border-emerald-400 bg-white text-slate-700 font-medium rounded-lg pl-3 pr-7 py-1.5 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer max-w-[170px] truncate"
                  >
                    <option value="all">🏥 ทุกหอผู้ป่วย</option>
                    {ipdWards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Pttype Filter */}
                <div className="relative inline-flex items-center">
                  <select 
                    value={ipdPttype} 
                    onChange={e => setIpdPttype(e.target.value)}
                    className="appearance-none border border-slate-200 hover:border-emerald-400 bg-white text-slate-700 font-medium rounded-lg pl-3 pr-7 py-1.5 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer max-w-[210px] truncate"
                  >
                    <option value="all">💳 ทุกสิทธิการรักษา</option>
                    {ipdPttypes.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.code} : {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Doctor Admit Filter */}
                <div className="relative inline-flex items-center">
                  <select 
                    value={ipdDoctor} 
                    onChange={e => setIpdDoctor(e.target.value)}
                    className="appearance-none border border-slate-200 hover:border-emerald-400 bg-white text-slate-700 font-medium rounded-lg pl-3 pr-7 py-1.5 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="all">👨‍⚕️ แพทย์ Admit ทั้งหมด</option>
                    {ipdDoctors.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Doctor D/C Filter */}
                <div className="relative inline-flex items-center">
                  <select 
                    value={ipdDoctorDc} 
                    onChange={e => setIpdDoctorDc(e.target.value)}
                    className="appearance-none border border-slate-200 hover:border-emerald-400 bg-white text-slate-700 font-medium rounded-lg pl-3 pr-7 py-1.5 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="all">👨‍⚕️ แพทย์ D/C ทั้งหมด</option>
                    {ipdDoctorsDc.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Reset Filter Button */}
                {(ipdDelayGroup !== 'all' || ipdWard !== 'all' || ipdPttype !== 'all' || ipdDoctor !== 'all' || ipdDoctorDc !== 'all' || ipdSearch) && (
                  <button 
                    type="button"
                    onClick={() => { setIpdDelayGroup('all'); setIpdWard('all'); setIpdPttype('all'); setIpdDoctor('all'); setIpdDoctorDc('all'); setIpdSearch(''); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200/70 border border-rose-200 shadow-2xs transition cursor-pointer"
                    title="ล้างค่าตัวกรองทั้งหมด"
                  >
                    <RotateCcw className="h-3 w-3 animate-none hover:-rotate-45 transition-transform" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>

              {/* แสดงสถานะจำนวนผลลัพธ์ที่ตรงเงื่อนไข */}
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                แสดงผล <b className="text-emerald-700 font-mono">{filteredIPD.length.toLocaleString()}</b> / {ipdData.length.toLocaleString()} ราย
              </div>
            </div>
          )}
        </section>

        {/* ======================= 2.1.2.1 CONTENT (IPD) ======================= */}
        {mainTab === 'ipd' && (
        <div className="space-y-5">
          {/* IPD KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">ผู้ป่วยจำหน่ายทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-800">{ipdMetrics.totalCases.toLocaleString()} <span className="text-sm font-normal text-slate-500">ราย</span></p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-lg text-teal-700"><Activity className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">CMI เฉลี่ย / วันนอนเฉลี่ย</p>
                <p className="text-2xl font-bold text-slate-800">{ipdMetrics.avgCmi.toFixed(4)} <span className="text-sm font-normal text-slate-500">({ipdMetrics.avgLos.toFixed(1)} วัน)</span></p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><DollarSign className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">ค่ารักษาพยาบาลรวม</p>
                <p className="text-2xl font-bold text-slate-800">฿{ipdMetrics.totalIncome.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="bg-rose-100 p-3 rounded-lg text-rose-600"><Clock className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">ลูกหนี้คงค้าง (Debit)</p>
                <p className="text-2xl font-bold text-rose-600">฿{ipdMetrics.totalDebit.toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* สรุปโดยรวม: ค่าผลรวมวันนอน (LOS) และ ค่ารวมของ AdjRW */}
          <section className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                สรุปโดยรวม
              </h2>
              <span className="text-xs text-slate-400">
                คำนวณจากข้อมูลชุดปัจจุบัน ({filteredIPD.length.toLocaleString()} ราย)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* ค่ารวมวันนอน (Total LOS) */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" /> ผลรวมวันนอน (LOS)
                  </div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5 font-mono">
                    {ipdMetrics.totalLos.toLocaleString()}
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium bg-white/80 px-2 py-0.5 rounded">
                  {ipdMetrics.avgLos.toFixed(1)} วัน/ราย
                </span>
              </div>

              {/* ค่ารวมน้ำหนักสัมพัทธ์ (Total AdjRW) */}
              <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> ผลรวม AdjRW
                  </div>
                  <div className="text-xl font-bold text-teal-800 mt-0.5 font-mono">
                    {ipdMetrics.totalAdjrw.toFixed(4)}
                  </div>
                </div>
                <span className="text-[11px] text-teal-600 font-medium bg-white/80 px-2 py-0.5 rounded">
                  SumAdjRW
                </span>
              </div>
            </div>
          </section>

          {/* IPD Chart Audit Breakdown */}
          <section className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                รายงานสถานะระยะเวลาสรุปชาร์ต IPD (คลิกเพื่อกรองรายชื่อ)
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => setIpdDelayGroup(ipdDelayGroup === 'null' ? 'all' : 'null')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                  ipdDelayGroup === 'null' ? 'ring-2 ring-red-600 bg-red-100/90 border-red-400' : 'bg-red-50/80 border-red-300 hover:bg-red-100/70'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-red-800 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-red-600" /> 1. ยังไม่สรุป</div>
                  <div className="text-xl font-bold text-red-900 mt-0.5">{ipdMetrics.notFinal}</div>
                </div>
                <span className="text-[11px] text-red-700 font-bold bg-white/90 px-2 py-0.5 rounded shadow-2xs">ร้ายแรง</span>
              </button>

              <button 
                onClick={() => setIpdDelayGroup(ipdDelayGroup === 'gt15' ? 'all' : 'gt15')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                  ipdDelayGroup === 'gt15' ? 'ring-2 ring-orange-500 bg-orange-50/90 border-orange-300' : 'bg-orange-50/40 border-orange-200 hover:bg-orange-100/50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-orange-700 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-orange-500" /> 2. นานเกิน 15 วัน</div>
                  <div className="text-xl font-bold text-orange-800 mt-0.5">{ipdMetrics.gt15}</div>
                </div>
                <span className="text-[11px] text-orange-600 font-medium bg-white/80 px-2 py-0.5 rounded">วิกฤต</span>
              </button>

              <button 
                onClick={() => setIpdDelayGroup(ipdDelayGroup === '8-15' ? 'all' : '8-15')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                  ipdDelayGroup === '8-15' ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300' : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> 3. นานเกิน 8 - 15 วัน</div>
                  <div className="text-xl font-bold text-amber-800 mt-0.5">{ipdMetrics.b8to15}</div>
                </div>
                <span className="text-[11px] text-amber-600 font-medium bg-white/80 px-2 py-0.5 rounded">เตือน</span>
              </button>

              <button 
                onClick={() => setIpdDelayGroup(ipdDelayGroup === 'lt8' ? 'all' : 'lt8')}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                  ipdDelayGroup === 'lt8' ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300' : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> 4. น้อยกว่า 8 วัน</div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">{ipdMetrics.lt8}</div>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium bg-white/80 px-2 py-0.5 rounded">ปกติ</span>
              </button>
            </div>
          </section>

          {/* IPD View Switcher */}
          <div className="flex border-b border-emerald-200 space-x-4">
            <button
              onClick={() => setIpdSubTab('list')}
              className={`pb-2.5 text-sm font-medium transition border-b-2 cursor-pointer ${
                ipdSubTab === 'list' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 ตารางรายชื่อผู้ป่วยใน (IPD Grid)
            </button>
            <button
              onClick={() => setIpdSubTab('doctor')}
              className={`pb-2.5 text-sm font-medium transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                ipdSubTab === 'doctor' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              👨‍⚕️ แพทย์ Admit (จำนวน & SumAdjRW)
            </button>
            <button
              onClick={() => setIpdSubTab('doctor_dc')}
              className={`pb-2.5 text-sm font-medium transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                ipdSubTab === 'doctor_dc' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              👨‍⚕️ แพทย์ D/C (จำนวน & SumAdjRW)
            </button>
            <button
              onClick={() => setIpdSubTab('overview')}
              className={`pb-2.5 text-sm font-medium transition border-b-2 cursor-pointer ${
                ipdSubTab === 'overview' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 กราฟสรุปหอผู้ป่วย & สิทธิ (Charts)
            </button>
          </div>

          {/* SubTab: Doctor Admit Drill-down Table & Stats */}
          {ipdSubTab === 'doctor' && (
            <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    👨‍⚕️ รายงานสรุป IPD ตามรายชื่อแพทย์ Admit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แสดงข้อมูลตามสเปก VFP: <b>แพทย์ Admit</b>, <b>จำนวนผู้ป่วย (Cases)</b>, <b>SumAdjRW</b>, <b>CMI เฉลี่ย</b>, และ <b>ค่ารักษาพยาบาลรวม</b>
                  </p>
                </div>
                <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  คลิกที่ชื่อแพทย์เพื่อกรองรายชื่อในตารางคนไข้ทันที
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-emerald-100">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-emerald-50/80 text-emerald-950 border-b border-emerald-200 font-semibold">
                    <tr>
                      <th className="py-3 px-3 text-center w-16">ลำดับ</th>
                      <th className="py-3 px-4 text-left">รายชื่อแพทย์ Admit (ADMDOCTOR)</th>
                      <th className="py-3 px-4 text-center">จำนวนผู้ป่วย (ราย)</th>
                      <th className="py-3 px-4 text-center">ผลรวมน้ำหนักสัมพัทธ์ (SumAdjRW)</th>
                      <th className="py-3 px-4 text-center">CMI เฉลี่ย</th>
                      <th className="py-3 px-4 text-center">ค่ารักษาพยาบาลรวม (บาท)</th>
                      <th className="py-3 px-3 text-center w-28">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white">
                    {doctorSummaryData.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">ไม่พบข้อมูลแพทย์ Admit</td></tr>
                    ) : (
                      doctorSummaryData.map((d, idx) => {
                        const avgCmi = d.cases > 0 ? (d.sumAdjrw / d.cases) : 0;
                        return (
                          <tr key={d.doctor} className="hover:bg-emerald-50/50 transition">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800 text-left">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>{d.doctor}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                              {d.cases.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-teal-800 bg-teal-50/30">
                              {d.sumAdjrw.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-emerald-800">
                              {avgCmi.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-medium text-slate-800 font-mono">
                              ฿{d.totalIncome.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  setIpdDoctor(d.doctor);
                                  setIpdSubTab('list');
                                }}
                                className="inline-flex items-center justify-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 transition font-medium cursor-pointer"
                              >
                                ดูรายชื่อ <ChevronRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50/50 font-bold border-t border-emerald-200 text-emerald-950">
                    <tr>
                      <td className="py-3 px-3 text-center" colSpan={2}>รวมทั้งหมด ({doctorSummaryData.length} ท่าน)</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-800 text-sm">
                        {doctorSummaryData.reduce((acc, c) => acc + c.cases, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-teal-800 text-sm">
                        {doctorSummaryData.reduce((acc, c) => acc + c.sumAdjrw, 0).toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-800 text-sm">
                        {(doctorSummaryData.reduce((acc, c) => acc + c.cases, 0) > 0 
                          ? (doctorSummaryData.reduce((acc, c) => acc + c.sumAdjrw, 0) / doctorSummaryData.reduce((acc, c) => acc + c.cases, 0)) 
                          : 0).toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-900 font-mono text-sm">
                        ฿{doctorSummaryData.reduce((acc, c) => acc + c.totalIncome, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* SubTab: Doctor D/C Drill-down Table & Stats */}
          {ipdSubTab === 'doctor_dc' && (
            <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    👨‍⚕️ รายงานสรุป IPD ตามรายชื่อแพทย์ จำหน่าย (D/C Doctor)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แสดงข้อมูลตามแพทย์ผู้จำหน่าย: <b>แพทย์ D/C</b>, <b>จำนวนผู้ป่วย (Cases)</b>, <b>SumAdjRW</b>, <b>CMI เฉลี่ย</b>, และ <b>ค่ารักษาพยาบาลรวม</b>
                  </p>
                </div>
                <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  คลิกที่ชื่อแพทย์เพื่อกรองรายชื่อในตารางคนไข้ทันที
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-emerald-100">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-emerald-50/80 text-emerald-950 border-b border-emerald-200 font-semibold">
                    <tr>
                      <th className="py-3 px-3 text-center w-16">ลำดับ</th>
                      <th className="py-3 px-4 text-left">รายชื่อแพทย์ จำหน่าย (DCH_DOCTOR)</th>
                      <th className="py-3 px-4 text-center">จำนวนผู้ป่วย (ราย)</th>
                      <th className="py-3 px-4 text-center">ผลรวมน้ำหนักสัมพัทธ์ (SumAdjRW)</th>
                      <th className="py-3 px-4 text-center">CMI เฉลี่ย</th>
                      <th className="py-3 px-4 text-center">ค่ารักษาพยาบาลรวม (บาท)</th>
                      <th className="py-3 px-3 text-center w-28">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white">
                    {doctorDcSummaryData.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">ไม่พบข้อมูลแพทย์ จำหน่าย</td></tr>
                    ) : (
                      doctorDcSummaryData.map((d, idx) => {
                        const avgCmi = d.cases > 0 ? (d.sumAdjrw / d.cases) : 0;
                        return (
                          <tr key={d.doctor} className="hover:bg-emerald-50/50 transition">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800 text-left">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                                <span>{d.doctor}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-teal-700">
                              {d.cases.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                              {d.sumAdjrw.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-emerald-800">
                              {avgCmi.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-medium text-slate-800 font-mono">
                              ฿{d.totalIncome.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  setIpdDoctorDc(d.doctor);
                                  setIpdSubTab('list');
                                }}
                                className="inline-flex items-center justify-center gap-1 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md border border-teal-200 transition font-medium cursor-pointer"
                              >
                                ดูรายชื่อ <ChevronRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50/50 font-bold border-t border-emerald-200 text-emerald-950">
                    <tr>
                      <td className="py-3 px-3 text-center" colSpan={2}>รวมทั้งหมด ({doctorDcSummaryData.length} ท่าน)</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-800 text-sm">
                        {doctorDcSummaryData.reduce((acc, c) => acc + c.cases, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-teal-800 text-sm">
                        {doctorDcSummaryData.reduce((acc, c) => acc + c.sumAdjrw, 0).toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-800 text-sm">
                        {(doctorDcSummaryData.reduce((acc, c) => acc + c.cases, 0) > 0 
                          ? (doctorDcSummaryData.reduce((acc, c) => acc + c.sumAdjrw, 0) / doctorDcSummaryData.reduce((acc, c) => acc + c.cases, 0)) 
                          : 0).toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-900 font-mono text-sm">
                        ฿{doctorDcSummaryData.reduce((acc, c) => acc + c.totalIncome, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* SubTab: Charts Overview */}
          {ipdSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-700">จำนวนผู้ป่วยแยกตามหอผู้ป่วย (Ward)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorSummaryData.slice(0, 10).map(d => ({ name: d.doctor, cases: d.cases }))} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: any) => [`${val} ราย`, 'ผู้ป่วย Admit']} />
                      <Bar dataKey="cases" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-700">ผลรวมค่าความยากโรค (SumAdjRW แยกตามแพทย์ Admit)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorSummaryData.slice(0, 10).map(d => ({ name: d.doctor, sumAdjrw: Number(d.sumAdjrw.toFixed(2)) }))} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: any) => [`${val}`, 'SumAdjRW']} />
                      <Bar dataKey="sumAdjrw" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: IPD Table */}
          <section className={`bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden ${ipdSubTab !== 'list' && 'hidden'}`}>
            <div className="p-3.5 border-b border-emerald-100 bg-emerald-50/40 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหา AN, HN, ชื่อ, รหัสโรค..."
                  value={ipdSearch}
                  onChange={e => setIpdSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {(ipdSearch || ipdDelayGroup !== 'all') && (
                <button 
                  type="button"
                  onClick={() => { setIpdSearch(''); setIpdDelayGroup('all'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 shadow-2xs transition cursor-pointer"
                  title="ล้างคำค้นหาและตัวกรองสถานะสรุปชาร์ต"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>ล้างการค้นหา</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-emerald-50/80 text-emerald-950 sticky top-0 z-10 border-b border-emerald-200 shadow-sm font-semibold">
                  <tr>
                    <th className="p-2.5 text-center w-12 whitespace-nowrap">ลำดับ</th>
                    <th className="p-2.5 text-center whitespace-nowrap">AN</th>
                    <th className="p-2.5 text-center whitespace-nowrap">HN</th>
                    <th className="p-2.5 text-left whitespace-nowrap">ชื่อ-สกุลผู้ป่วย</th>
                    <th className="p-2.5 text-center whitespace-nowrap">หอผู้ป่วย</th>
                    <th className="p-2.5 text-center whitespace-nowrap">แพทย์ Admit</th>
                    <th className="p-2.5 text-center whitespace-nowrap">แพทย์ D/C</th>
                    <th className="p-2.5 text-center whitespace-nowrap">สิทธิการรักษา</th>
                    <th className="p-2.5 text-center whitespace-nowrap">วันนอน (LOS)</th>
                    <th className="p-2.5 text-center whitespace-nowrap">PDX (โรคหลัก)</th>
                    <th className="p-2.5 text-center whitespace-nowrap">AdjRW</th>
                    <th className="p-2.5 text-center whitespace-nowrap">ค่ารักษา (บาท)</th>
                    <th className="p-2.5 text-center whitespace-nowrap">ลูกหนี้ค้าง</th>
                    <th className="p-2.5 text-center whitespace-nowrap">สรุปชาร์ต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {ipdLoading ? (
                    <tr>
                      <td colSpan={14} className="text-center py-10 text-slate-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        กำลังโหลดข้อมูล IPD จาก HOSxP...
                      </td>
                    </tr>
                  ) : filteredIPD.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-10 text-slate-400">
                        ไม่พบข้อมูลผู้ป่วยในตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredIPD.map((row, idx) => (
                      <tr key={row.an} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 text-center font-mono font-semibold text-emerald-700">{row.an}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.hn}</td>
                        <td className="p-2.5 text-left font-medium text-slate-800 whitespace-nowrap">{row.ptname}</td>
                        <td className="p-2.5 text-center text-slate-600 whitespace-nowrap">{row.ward_name}</td>
                        <td className="p-2.5 text-center text-slate-700 font-medium whitespace-nowrap">{row.admdoctor || '-'}</td>
                        <td className="p-2.5 text-center text-slate-700 font-medium whitespace-nowrap">{row.dchdoctor || '-'}</td>
                        <td className="p-2.5 text-center text-slate-600 whitespace-nowrap">{row.pttypename}</td>
                        <td className="p-2.5 text-center text-slate-700 font-medium whitespace-nowrap">{row.los} วัน</td>
                        <td className="p-2.5 text-center">
                          <span className="font-mono font-bold text-slate-700 block">{row.pdx}</span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[130px] block mx-auto">{row.pdxname}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-medium text-slate-700">{Number(row.adjrw || 0).toFixed(4)}</td>
                        <td className="p-2.5 text-center font-mono font-medium text-slate-900">{Number(row.income || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-center font-mono font-medium text-rose-600">{Number(row.debit || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            row.summary_days === null 
                              ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                              : row.summary_days > 15 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : row.summary_days >= 8 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {row.summary_days !== null ? `${row.summary_days} วัน` : 'ยังไม่สรุป'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-emerald-50/30 border-t border-emerald-100 text-xs text-emerald-800 font-medium">
              แสดงข้อมูล IPD ทั้งหมด {filteredIPD.length} รายการ
            </div>
          </section>
        </div>
        )}

        {/* ======================= 2.1.1.2 CONTENT (OPD สิทธิการเงิน) ======================= */}
        {mainTab === 'opd' && (
        <div className="space-y-5">
          {/* OPD Financial KPI Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. จำนวนครั้งและผู้รับบริการ */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">ผู้รับบริการ (ครั้ง/คน)</span>
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600"><Users className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-mono">
                  {opdMetrics.totalVisits.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">ครั้ง</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {opdMetrics.totalHn.toLocaleString()} คน
                </p>
              </div>
            </div>

            {/* 2. ค่ารักษาทั้งหมด (income) */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">ค่ารักษาทั้งหมด</span>
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700"><DollarSign className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 font-mono">
                  ฿{opdMetrics.totalIncome.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เฉลี่ย ฿{Math.round(opdMetrics.avgIncome).toLocaleString()}/ครั้ง
                </p>
              </div>
            </div>

            {/* 3. สิทธิเรียกเก็บ (uc_money) */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-teal-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">สิทธิเรียกเก็บ (UC)</span>
                <div className="bg-teal-50 p-1.5 rounded-lg text-teal-600"><CreditCard className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-teal-700 font-mono">
                  ฿{opdMetrics.totalUcMoney.toLocaleString()}
                </p>
                <p className="text-[11px] text-teal-600 mt-0.5">
                  {opdMetrics.totalIncome > 0 ? ((opdMetrics.totalUcMoney / opdMetrics.totalIncome) * 100).toFixed(1) : 0}% ของค่ารักษา
                </p>
              </div>
            </div>

            {/* 4. ชำระเอง/ใบเสร็จ (rcpt_money) */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">ชำระเงินเอง</span>
                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><Receipt className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-indigo-700 font-mono">
                  ฿{opdMetrics.totalRcptMoney.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  จ่ายแล้ว ฿{opdMetrics.totalPaidMoney.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 5. ส่วนลด (discount_money) */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">ส่วนลด</span>
                <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600"><Activity className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-amber-700 font-mono">
                  ฿{opdMetrics.totalDiscount.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  สงเคราะห์/ยกเว้น
                </p>
              </div>
            </div>

            {/* 6. ลูกหนี้คงค้าง (debit) */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">ลูกหนี้คงค้าง (Debit)</span>
                <div className="bg-rose-50 p-1.5 rounded-lg text-rose-600"><Clock className="h-4 w-4" /></div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-rose-600 font-mono">
                  ฿{opdMetrics.totalDebit.toLocaleString()}
                </p>
                <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                  {opdMetrics.totalIncome > 0 ? ((opdMetrics.totalDebit / opdMetrics.totalIncome) * 100).toFixed(1) : 0}% ของค่ารักษา
                </p>
              </div>
            </div>
          </section>

          {/* Subtabs Switcher: สรุปตามสิทธิการเงิน (e-Claim) vs รายชื่อผู้ป่วย (Grid) */}
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpdSubTab('eclaim')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
                  opdSubTab === 'eclaim'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>💳 สรุปแยกตามสิทธิการเงิน (e-Claim 16-20, 27-30)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  opdSubTab === 'eclaim' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {opdEclaimSummaryData.length} กลุ่ม
                </span>
              </button>

              <button
                onClick={() => setOpdSubTab('list')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
                  opdSubTab === 'list'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>📋 รายชื่อผู้ป่วยนอก (OPD Grid)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  opdSubTab === 'list' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {filteredOPD.length} รายการ
                </span>
              </button>
            </div>

            {/* Note สิทธิการเงิน */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100">
              <span className="font-semibold text-emerald-800">ขอบเขตข้อมูล:</span>
              <span>เฉพาะผู้ป่วยนอก (ไม่รวม Admit) • กลุ่มสิทธิ e-Claim: 16, 17, 18, 19, 20, 27, 28, 29, 30</span>
            </div>
          </div>

          {/* Subtab 1: ตารางสรุปแยกตามสิทธิการเงิน (e-Claim 16-20, 27-30) */}
          {opdSubTab === 'eclaim' && (
            <div className="space-y-4">
              <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="p-4 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/40">
                  <div>
                    <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-700" />
                      สรุปยอดเงินและจำนวนผู้รับบริการ แยกตามสิทธิการเงิน (e-Claim)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เปรียบเทียบค่ารักษาพยาบาลทุกยอด: ทั้งหมด (income), สิทธิเรียกเก็บ (uc_money), ส่วนลด, ชำระเอง, และลูกหนี้คงค้าง
                    </p>
                  </div>
                  {opdEclaimFilter !== 'all' && (
                    <button
                      onClick={() => setOpdEclaimFilter('all')}
                      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" /> ล้างตัวกรองสิทธิ ({opdEclaimFilter})
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-100 bg-emerald-50/60 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-3 text-center">รหัส e-Claim</th>
                        <th className="p-3">ชื่อสิทธิการเงิน (e-Claim / pttype)</th>
                        <th className="p-3 text-center">จำนวนรับบริการ (ครั้ง)</th>
                        <th className="p-3 text-right">ค่ารักษาทั้งหมด (income)</th>
                        <th className="p-3 text-right text-teal-800">สิทธิเรียกเก็บ (uc_money)</th>
                        <th className="p-3 text-right text-amber-800">ส่วนลด (discount)</th>
                        <th className="p-3 text-right text-indigo-800">ชำระเงินเอง (rcpt)</th>
                        <th className="p-3 text-right text-rose-800">ลูกหนี้คงค้าง (debit)</th>
                        <th className="p-3 text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {opdLoading ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                            กำลังโหลดข้อมูลผู้ป่วยนอก...
                          </td>
                        </tr>
                      ) : opdEclaimSummaryData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            ไม่พบข้อมูลตามช่วงเวลาหรือเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        opdEclaimSummaryData.map((item) => (
                          <tr 
                            key={item.code} 
                            className={`hover:bg-emerald-50/50 transition ${
                              opdEclaimFilter === item.code ? 'bg-emerald-50/80 font-medium' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {item.code}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {item.name}
                            </td>
                            <td className="p-3 text-center font-mono font-medium text-slate-800">
                              {item.visits.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              ฿{item.totalIncome.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-teal-700">
                              ฿{item.totalUcMoney.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono text-amber-700">
                              ฿{item.totalDiscount.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono text-indigo-700">
                              ฿{item.totalRcptMoney.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-rose-600">
                              ฿{item.totalDebit.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setOpdEclaimFilter(item.code);
                                  setOpdSubTab('list');
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-200 transition cursor-pointer"
                              >
                                ดูกริดคนไข้ ({item.visits})
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {opdEclaimSummaryData.length > 0 && (
                      <tfoot>
                        <tr className="bg-emerald-100/70 font-bold border-t-2 border-emerald-300 text-emerald-950 text-xs">
                          <td colSpan={2} className="p-3 text-center">
                            รวมทั้งหมด ({opdEclaimSummaryData.length} กลุ่มสิทธิ)
                          </td>
                          <td className="p-3 text-center font-mono">
                            {opdMetrics.totalVisits.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono">
                            ฿{opdMetrics.totalIncome.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-teal-800">
                            ฿{opdMetrics.totalUcMoney.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-800">
                            ฿{opdMetrics.totalDiscount.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-indigo-800">
                            ฿{opdMetrics.totalRcptMoney.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-700">
                            ฿{opdMetrics.totalDebit.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">-</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Subtab 2: รายชื่อผู้ป่วยนอก (OPD Grid Table) */}
          {opdSubTab === 'list' && (
            <div className="space-y-4">
              {/* Filter Controls Bar */}
              <section className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Search Box */}
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                    <input
                      type="text"
                      placeholder="ค้นหา VN, HN, ชื่อผู้ป่วย, PDX, แพทย์..."
                      value={opdSearch}
                      onChange={(e) => setOpdSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 w-full border border-emerald-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                    {opdSearch && (
                      <button 
                        onClick={() => setOpdSearch('')} 
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter: สิทธิการเงิน e-Claim */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">สิทธิ e-Claim:</span>
                    <select
                      value={opdEclaimFilter}
                      onChange={(e) => setOpdEclaimFilter(e.target.value)}
                      className="border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">ทั้งหมด (เป้าหมาย 16-20, 27-30)</option>
                      {opdEclaims.map(e => (
                        <option key={e.code} value={e.code}>
                          [{e.code}] {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter: แผนกห้องตรวจ */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">จุดบริการ/แผนก:</span>
                    <select
                      value={opdDept}
                      onChange={(e) => setOpdDept(e.target.value)}
                      className="border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px]"
                    >
                      <option value="all">ทุกแผนก</option>
                      {opdDepts.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter: คลินิก/สาขา */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">คลินิก:</span>
                    <select
                      value={opdClinic}
                      onChange={(e) => setOpdClinic(e.target.value)}
                      className="border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px]"
                    >
                      <option value="all">ทุกคลินิก</option>
                      {opdClinics.map(cli => (
                        <option key={cli} value={cli}>{cli}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="flex items-center gap-2">
                  {(opdSearch || opdEclaimFilter !== 'all' || opdDept !== 'all' || opdClinic !== 'all') && (
                    <button
                      onClick={() => {
                        setOpdSearch('');
                        setOpdEclaimFilter('all');
                        setOpdDept('all');
                        setOpdClinic('all');
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" /> ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                  <button
                    onClick={fetchOPD}
                    disabled={opdLoading}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${opdLoading ? 'animate-spin' : ''}`} /> รีเฟรช
                  </button>
                </div>
              </section>

              {/* OPD Data Table Grid */}
              <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="p-3 bg-emerald-50/40 border-b border-emerald-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">
                    แสดงรายการผู้ป่วยนอก: {filteredOPD.length.toLocaleString()} รายการ
                  </span>
                  <span className="text-slate-500">
                    เรียงตาม วันที่-เวลารับบริการ (ล่าสุดไปเก่าสุด)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-100 bg-emerald-50/60 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-2.5 text-center">VN</th>
                        <th className="p-2.5 text-center">HN</th>
                        <th className="p-2.5">ชื่อ-สกุล ผู้ป่วย</th>
                        <th className="p-2.5 text-center">วัน-เวลารับบริการ</th>
                        <th className="p-2.5">จุดบริการ / คลินิก</th>
                        <th className="p-2.5">สิทธิ e-Claim</th>
                        <th className="p-2.5 text-center">PDX</th>
                        <th className="p-2.5">แพทย์</th>
                        <th className="p-2.5 text-right">ค่ารักษา (บาท)</th>
                        <th className="p-2.5 text-right text-teal-800">สิทธิเบิก (UC)</th>
                        <th className="p-2.5 text-right text-indigo-800">ชำระเอง</th>
                        <th className="p-2.5 text-right text-rose-800">ค้างชำระ (Debit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {opdLoading ? (
                        <tr>
                          <td colSpan={12} className="p-8 text-center text-slate-400">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                            กำลังโหลดรายชื่อผู้ป่วยนอก...
                          </td>
                        </tr>
                      ) : filteredOPD.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="p-8 text-center text-slate-400">
                            ไม่พบข้อมูลผู้ป่วยนอกตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredOPD.slice(0, 500).map((row) => (
                          <tr key={row.vn} className="hover:bg-emerald-50/40 transition">
                            <td className="p-2.5 text-center font-mono font-semibold text-emerald-800 whitespace-nowrap">
                              {row.vn}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-700 whitespace-nowrap">
                              {row.hn}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <p className="font-semibold text-slate-900">{row.ptname}</p>
                              <p className="text-[10px] text-slate-400">{row.sex} • {row.age} ปี</p>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span className="font-mono text-slate-700 block">{row.vstdate}</span>
                              <span className="font-mono text-[10px] text-slate-400">{row.vsttime}</span>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <p className="font-medium text-slate-800">{row.department || '-'}</p>
                              <p className="text-[10px] text-slate-400">{row.clinic || '-'}</p>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 mr-1">
                                {row.pttype_eclaim_id || '-'}
                              </span>
                              <span className="text-slate-700 text-[11px] truncate max-w-[130px] inline-block align-middle">
                                {row.pttype_eclaim_name || row.pttypename}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="font-mono font-bold text-slate-800 block">{row.pdx || '-'}</span>
                              <span className="text-[10px] text-slate-500 truncate max-w-[120px] block mx-auto">{row.pdxname}</span>
                            </td>
                            <td className="p-2.5 text-slate-700 text-xs whitespace-nowrap">
                              {row.doctorname || '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              ฿{Number(row.income || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-medium text-teal-700 whitespace-nowrap">
                              ฿{Number(row.uc_money || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-medium text-indigo-700 whitespace-nowrap">
                              ฿{Number(row.rcpt_money || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                              ฿{Number(row.debit || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-emerald-50/30 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-medium">
                  <span>
                    แสดงข้อมูล OPD ทั้งหมด {filteredOPD.length.toLocaleString()} รายการ
                    {filteredOPD.length > 500 && ' (แสดงตัวอย่าง 500 รายการแรกในหน้าจอ สามารถกดปุ่มส่งออก Excel CSV เพื่อดูทั้งหมดได้)'}
                  </span>
                  <span>
                    รวมค่ารักษาทั้งหมด: ฿{opdMetrics.totalIncome.toLocaleString()} | สิทธิเรียกเก็บ: ฿{opdMetrics.totalUcMoney.toLocaleString()}
                  </span>
                </div>
              </section>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
