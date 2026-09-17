'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/app/components/Navbar';
import { DoctorSummaryItem } from '@/app/api/opd-doctor-summary/route';
import { 
  Users, DollarSign, CreditCard, Receipt, Clock, Download, 
  Filter, RefreshCw, Search, Calendar, ChevronDown, RotateCcw, X, Stethoscope, Check
} from 'lucide-react';

export interface PttypeOption {
  code: string;
  name: string;
}

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export default function OpdDoctorReportPage() {
  const today = new Date();
  const currentCalYear = today.getFullYear();
  const defaultFiscalYear = today.getMonth() + 1 >= 10 ? currentCalYear + 1 : currentCalYear;

  // Date controls - เรียงลำดับโหมด: วัน (custom) -> เดือน (month) -> ปี (year) เหมือน 2.1.2.1
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

  // Pttype Multi-select State
  const [allPttypes, setAllPttypes] = useState<PttypeOption[]>([]);
  const [selectedPttypes, setSelectedPttypes] = useState<string[]>([]); // empty array means "All สิทธิ์"
  const [pttypeDropdownOpen, setPttypeDropdownOpen] = useState<boolean>(false);
  const [pttypeSearch, setPttypeSearch] = useState<string>('');

  // Data & State
  const [loading, setLoading] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<DoctorSummaryItem[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, { income: number; visits: number }>>({});
  const [grandTotal, setGrandTotal] = useState<any>({
    visits: 0,
    income: 0,
    uc_money: 0,
    rcpt_money: 0,
    discount: 0,
    debit: 0,
  });

  const [searchDoctor, setSearchDoctor] = useState<string>('');

  // 12 Months for fiscal year order: 10, 11, 12, 01, 02, ..., 09
  const fiscalMonthColumns = useMemo(() => {
    if (dateMode !== 'year') return [];
    const prevYear = selectedYear - 1;
    const curYear = selectedYear;
    return [
      { key: `${prevYear}-10`, label: 'ต.ค.', monthNum: 10, year: prevYear },
      { key: `${prevYear}-11`, label: 'พ.ย.', monthNum: 11, year: prevYear },
      { key: `${prevYear}-12`, label: 'ธ.ค.', monthNum: 12, year: prevYear },
      { key: `${curYear}-01`, label: 'ม.ค.', monthNum: 1, year: curYear },
      { key: `${curYear}-02`, label: 'ก.พ.', monthNum: 2, year: curYear },
      { key: `${curYear}-03`, label: 'มี.ค.', monthNum: 3, year: curYear },
      { key: `${curYear}-04`, label: 'เม.ย.', monthNum: 4, year: curYear },
      { key: `${curYear}-05`, label: 'พ.ค.', monthNum: 5, year: curYear },
      { key: `${curYear}-06`, label: 'มิ.ย.', monthNum: 6, year: curYear },
      { key: `${curYear}-07`, label: 'ก.ค.', monthNum: 7, year: curYear },
      { key: `${curYear}-08`, label: 'ส.ค.', monthNum: 8, year: curYear },
      { key: `${curYear}-09`, label: 'ก.ย.', monthNum: 9, year: curYear },
    ];
  }, [dateMode, selectedYear]);

  // Available Fiscal Years
  const availableYears = useMemo(() => {
    const list = [];
    for (let y = defaultFiscalYear; y >= defaultFiscalYear - 7; y--) {
      list.push(y);
    }
    return list;
  }, [defaultFiscalYear]);

  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
    const mStr = String(month).padStart(2, '0');
    const lastDay = new Date(currentCalYear, month, 0).getDate();
    const start = `${currentCalYear}-${mStr}-01`;
    const end = `${currentCalYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    setDs1(start);
    setDs2(end);
  };

  const handleSelectFiscalYear = (fiscalYear: number) => {
    setSelectedYear(fiscalYear);
    const start = `${fiscalYear - 1}-10-01`;
    const end = `${fiscalYear}-09-30`;
    setDs1(start);
    setDs2(end);
  };

  // Fetch Data
  const fetchData = async (start = ds1, end = ds2, pttypes = selectedPttypes) => {
    setLoading(true);
    try {
      let url = `/api/opd-doctor-summary?ds1=${start}&ds2=${end}`;
      if (pttypes.length > 0) {
        url += `&pttypes=${encodeURIComponent(pttypes.join(','))}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDoctors(json.doctors || []);
        setMonths(json.months || []);
        setMonthlyTotals(json.monthlyTotals || {});
        setGrandTotal(json.grandTotal || { visits: 0, income: 0 });
        if (json.allPttypeOptions && json.allPttypeOptions.length > 0) {
          setAllPttypes(json.allPttypeOptions);
        }
      } else {
        alert('เกิดข้อผิดพลาด: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(ds1, ds2, selectedPttypes);
  }, []);

  // Grouped options where 03, 04, 05 are merged into a single option
  const displayPttypeOptions = useMemo(() => {
    const list: PttypeOption[] = [];
    let addedCR = false;

    allPttypes.forEach(p => {
      if (p.code === '03' || p.code === '04' || p.code === '05') {
        if (!addedCR) {
          list.push({
            code: '03,04,05',
            name: 'บริการเฉพาะ(CR)'
          });
          addedCR = true;
        }
      } else {
        list.push(p);
      }
    });

    return list;
  }, [allPttypes]);

  // Multi-choice toggle helper
  const handleTogglePttype = (code: string) => {
    if (code === '03,04,05') {
      setSelectedPttypes(prev => {
        const isAllSelected = ['03', '04', '05'].every(c => prev.includes(c));
        if (isAllSelected) {
          return prev.filter(c => c !== '03' && c !== '04' && c !== '05');
        } else {
          const set = new Set(prev);
          set.add('03');
          set.add('04');
          set.add('05');
          return Array.from(set);
        }
      });
      return;
    }

    setSelectedPttypes(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSelectAllPttypes = () => {
    // ติ๊กเลือกทุกสิทธิ์ทั้งหมด
    setSelectedPttypes(allPttypes.map(p => p.code));
  };

  const handleClearPttypes = () => {
    // ล้างการเลือกทั้งหมด
    setSelectedPttypes([]);
  };

  // Filtered pttypes in multi-choice dropdown (รวม 03,04,05 เป็นรายการเดียว)
  const filteredPttypeOptions = useMemo(() => {
    if (!pttypeSearch.trim()) return displayPttypeOptions;
    const q = pttypeSearch.toLowerCase();
    return displayPttypeOptions.filter(
      p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [displayPttypeOptions, pttypeSearch]);

  // Check selected count for UI display (นับ 03,04,05 เป็น 1 สิทธิ์)
  const selectedDisplayCount = useMemo(() => {
    let count = 0;
    const hasCR = ['03', '04', '05'].some(c => selectedPttypes.includes(c));
    if (hasCR) count += 1;
    selectedPttypes.forEach(c => {
      if (c !== '03' && c !== '04' && c !== '05') {
        count += 1;
      }
    });
    return count;
  }, [selectedPttypes]);

  // Filtered doctors by search
  const filteredDoctors = useMemo(() => {
    if (!searchDoctor.trim()) return doctors;
    const q = searchDoctor.toLowerCase();
    return doctors.filter(
      d => d.doctor_name.toLowerCase().includes(q) || d.doctor_code.toLowerCase().includes(q)
    );
  }, [doctors, searchDoctor]);

  // Export CSV
  const exportCSV = () => {
    if (dateMode === 'year') {
      const headers = [
        'ลำดับ', 'รหัสแพทย์', 'ชื่อ-สกุลแพทย์',
        ...fiscalMonthColumns.map(m => `${m.label} (${m.year + 543})`),
        'ยอดรวมทั้งปี (บาท)', 'จำนวนครั้งตรวจรวม (ครั้ง)'
      ];
      const rows = filteredDoctors.map((d, idx) => [
        idx + 1,
        `"${d.doctor_code}"`,
        `"${d.doctor_name}"`,
        ...fiscalMonthColumns.map(m => d.monthly_income[m.key] || 0),
        d.total_income,
        d.total_visits
      ]);

      const footer = [
        'รวมทั้งหมด', '', '',
        ...fiscalMonthColumns.map(m => monthlyTotals[m.key]?.income || 0),
        grandTotal.income,
        grandTotal.visits
      ];

      downloadCSV(`opd_doctor_fiscal_${selectedYear + 543}.csv`, headers, [...rows, footer]);
    } else {
      const headers = ['ลำดับ', 'รหัสแพทย์', 'ชื่อ-สกุลแพทย์', 'จำนวนครั้งตรวจ (ครั้ง)', 'ค่ารักษาพยาบาลทั้งหมด (บาท)', 'สิทธิเบิก UC (บาท)', 'ชำระเอง (บาท)', 'ลูกหนี้คงค้าง (บาท)'];
      const rows = filteredDoctors.map((d, idx) => [
        idx + 1,
        `"${d.doctor_code}"`,
        `"${d.doctor_name}"`,
        d.total_visits,
        d.total_income,
        d.total_uc_money,
        d.total_rcpt_money,
        d.total_debit
      ]);
      const footer = [
        'รวมทั้งหมด', '', '',
        grandTotal.visits,
        grandTotal.income,
        grandTotal.uc_money,
        grandTotal.rcpt_money,
        grandTotal.debit
      ];
      downloadCSV(`opd_doctor_report_${ds1}_${ds2}.csv`, headers, [...rows, footer]);
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        {/* Page Title & Scope Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-emerald-950 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-emerald-600" />
              สรุปค่าบริการผู้ป่วยนอก OPD ตามสิทธิ์การรักษา
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปยอดค่ารักษาพยาบาลแยกตามแพทย์ผู้ตรวจ (ผู้ป่วยนอก OPD แท้จริง ไม่รวม Admit) • กรองเลือกสิทธิ์การรักษาได้ตามต้องการ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              disabled={filteredDoctors.length === 0}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> ส่งออก Excel (CSV)
            </button>
          </div>
        </div>

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
                    ตรวจวันที่:
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
                      {THAI_MONTH_NAMES.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          เดือน {name} (ปี {currentCalYear + 543})
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
                onClick={() => fetchData(ds1, ds2, selectedPttypes)} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" /> ดึงข้อมูล
              </button>
            </div>

            {/* ปุ่มส่งออก Excel */}
            <div>
              <button 
                onClick={exportCSV}
                disabled={filteredDoctors.length === 0}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-slate-600" /> ส่งออก Excel (CSV)
              </button>
            </div>
          </div>

          {/* แถวที่ 2: เมนูกรองสิทธิการรักษา & ค้นหาชื่อแพทย์ */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-emerald-600" /> ตัวกรองสิทธิ:
              </span>

              {/* Multi-choice Pttype Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPttypeDropdownOpen(!pttypeDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-2xs cursor-pointer transition"
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {selectedPttypes.length === 0 
                      ? 'ทุกสิทธิการรักษา (ทั้งหมด)' 
                      : `เลือกไว้ ${selectedDisplayCount} สิทธิ`}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${pttypeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Modal */}
                {pttypeDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-emerald-200 z-50 p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-emerald-600" /> เลือกสิทธิการรักษา (Multi-choice)
                      </span>
                      <button 
                        onClick={() => setPttypeDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Search inside pttype options */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ค้นหารหัส หรือชื่อสิทธิ..."
                        value={pttypeSearch}
                        onChange={e => setPttypeSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-xs border border-emerald-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {/* Select All / Clear Buttons */}
                    <div className="flex items-center justify-between text-xs pt-1 pb-1 px-1 bg-emerald-50/60 rounded-lg border border-emerald-100">
                      <button
                        type="button"
                        onClick={handleSelectAllPttypes}
                        className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded bg-white hover:bg-emerald-100 border border-emerald-300 shadow-xs cursor-pointer transition text-xs"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        เลือกทุกสิทธิ ({displayPttypeOptions.length})
                      </button>
                      {selectedPttypes.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearPttypes}
                          className="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer transition text-xs"
                        >
                          ล้างการเลือก ({selectedDisplayCount})
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">ยังไม่ได้เลือก</span>
                      )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-lg p-1.5 bg-slate-50/50">
                      {filteredPttypeOptions.length === 0 ? (
                        <p className="text-center py-4 text-xs text-slate-400">ไม่พบสิทธิที่ค้นหา</p>
                      ) : (
                        filteredPttypeOptions.map(p => {
                          const isChecked = p.code === '03,04,05' 
                            ? ['03', '04', '05'].some(c => selectedPttypes.includes(c))
                            : selectedPttypes.includes(p.code);

                          return (
                            <label
                              key={p.code}
                              className="flex items-start gap-2.5 p-1.5 rounded-md hover:bg-emerald-50/80 cursor-pointer text-xs transition"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePttype(p.code)}
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 font-medium truncate">
                                  <span className="font-mono text-emerald-800 font-bold mr-1">{p.code}:</span>
                                  {p.name}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>

                    {/* Apply Button */}
                    <div className="pt-1 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPttypeDropdownOpen(false);
                          fetchData(ds1, ds2, selectedPttypes);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg text-xs transition shadow-sm cursor-pointer text-center"
                      >
                        นำตัวกรองไปใช้ ({selectedPttypes.length === 0 ? 'ทุกสิทธิ' : `${selectedDisplayCount} สิทธิที่เลือก`})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedPttypes.length > 0 && (
                <button 
                  type="button"
                  onClick={() => { handleClearPttypes(); fetchData(ds1, ds2, []); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200/70 border border-rose-200 shadow-2xs transition cursor-pointer"
                  title="ล้างตัวกรองสิทธิ"
                >
                  <RotateCcw className="h-3 w-3 animate-none hover:-rotate-45 transition-transform" />
                  <span>ล้างสิทธิที่เลือก ({selectedDisplayCount})</span>
                </button>
              )}
            </div>

            {/* Quick Doctor Search in Table */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อแพทย์ หรือรหัส..."
                value={searchDoctor}
                onChange={e => setSearchDoctor(e.target.value)}
                className="pl-8 pr-8 py-1.5 w-full border border-slate-200 hover:border-emerald-400 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs bg-white"
              />
              {searchDoctor && (
                <button 
                  onClick={() => setSearchDoctor('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* KPI Metric Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700"><Stethoscope className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">จำนวนแพทย์ผู้ตรวจ</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">
                {filteredDoctors.length.toLocaleString()} <span className="text-sm font-normal text-slate-500">ท่าน</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-lg text-teal-700"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">จำนวนครั้งรับบริการรวม</p>
              <p className="text-2xl font-bold text-teal-800 font-mono">
                {grandTotal.visits.toLocaleString()} <span className="text-sm font-normal text-slate-500">ครั้ง</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><DollarSign className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">ค่ารักษาพยาบาลรวมทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                ฿{grandTotal.income.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><CreditCard className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">เฉลี่ยต่อแพทย์ 1 ท่าน</p>
              <p className="text-2xl font-bold text-indigo-700 font-mono">
                ฿{filteredDoctors.length > 0 ? Math.round(grandTotal.income / filteredDoctors.length).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </section>

        {/* Master Doctor Revenue Table */}
        <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-700" />
                ตารางแจกแจงรายได้แพทย์ {dateMode === 'year' ? `ประจำปีงบประมาณ ${selectedYear + 543} (แยกย่อยรายเดือน)` : dateMode === 'month' ? `ประจำเดือน ${THAI_MONTH_NAMES[selectedMonth - 1]} ${currentCalYear + 543}` : `(${ds1} ถึง ${ds2})`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เรียงตามลำดับยอดค่ารักษาพยาบาล (Income) สูงสุดไปต่ำสุด
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              พบแพทย์ทั้งหมด <span className="font-bold text-emerald-800 font-mono">{filteredDoctors.length}</span> ท่าน
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/70 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 text-center w-12">ลำดับ</th>
                  <th className="p-3 min-w-[200px] sticky left-0 bg-emerald-50/90 z-10">ชื่อ-สกุล แพทย์</th>
                  <th className="p-3 text-center min-w-[90px]">ตรวจ (ครั้ง)</th>

                  {/* Mode: Year -> 12 Months Columns (ต.ค. - ก.ย.) */}
                  {dateMode === 'year' && fiscalMonthColumns.map((col) => (
                    <th key={col.key} className="p-2.5 text-right min-w-[95px] whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}

                  {/* Mode: Month or Custom -> Financial Breakdown Columns */}
                  {dateMode !== 'year' && (
                    <>
                      <th className="p-3 text-right text-teal-800 min-w-[110px]">สิทธิเบิก</th>
                      <th className="p-3 text-right text-indigo-800 min-w-[110px]">ชำระเอง</th>
                      <th className="p-3 text-right text-rose-800 min-w-[110px]">ลูกหนี้คงค้าง</th>
                    </>
                  )}

                  <th className="p-3 text-right min-w-[130px] bg-emerald-100/50">
                    {dateMode === 'year' ? 'ยอดรวมทั้งปี (บาท)' : 'ค่ารักษาทั้งหมด (บาท)'}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-50">
                {loading ? (
                  <tr>
                    <td colSpan={dateMode === 'year' ? 16 : 8} className="p-12 text-center text-slate-400">
                      <RefreshCw className="h-7 w-7 animate-spin mx-auto text-emerald-600 mb-2" />
                      กำลังดึงข้อมูลและประมวลผลรายได้แพทย์...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={dateMode === 'year' ? 16 : 8} className="p-12 text-center text-slate-400">
                      ไม่พบข้อมูลแพทย์ตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc, idx) => (
                    <tr key={doc.doctor_code} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800 sticky left-0 bg-white/95 z-10 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{doc.doctor_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-medium text-slate-700">
                        {doc.total_visits.toLocaleString()}
                      </td>

                      {/* Mode: Year 12 Months Values */}
                      {dateMode === 'year' && fiscalMonthColumns.map((col) => {
                        const val = doc.monthly_income[col.key] || 0;
                        return (
                          <td 
                            key={col.key} 
                            className={`p-2.5 text-right font-mono whitespace-nowrap ${
                              val > 0 ? 'text-slate-800 font-medium' : 'text-slate-300'
                            }`}
                          >
                            {val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                          </td>
                        );
                      })}

                      {/* Mode: Month or Custom Financial details */}
                      {dateMode !== 'year' && (
                        <>
                          <td className="p-3 text-right font-mono text-teal-700 whitespace-nowrap">
                            ฿{doc.total_uc_money.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-indigo-700 whitespace-nowrap">
                            ฿{doc.total_rcpt_money.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-600 whitespace-nowrap">
                            ฿{doc.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </>
                      )}

                      {/* Total Column */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 bg-emerald-50/30 whitespace-nowrap">
                        ฿{doc.total_income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Table Footer Summary Row */}
              {filteredDoctors.length > 0 && (
                <tfoot>
                  <tr className="bg-emerald-100/70 font-extrabold border-t-2 border-emerald-300 text-emerald-950 text-xs">
                    <td colSpan={2} className="p-3 text-center sticky left-0 bg-emerald-100/90 z-10 whitespace-nowrap">
                      รวมทั้งหมด ({filteredDoctors.length} ท่าน)
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-900">
                      {grandTotal.visits.toLocaleString()}
                    </td>

                    {/* Mode: Year Monthly Column Totals */}
                    {dateMode === 'year' && fiscalMonthColumns.map((col) => {
                      const totalMonthInc = monthlyTotals[col.key]?.income || 0;
                      return (
                        <td key={col.key} className="p-2.5 text-right font-mono text-emerald-950 whitespace-nowrap">
                          {totalMonthInc > 0 ? totalMonthInc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                        </td>
                      );
                    })}

                    {/* Mode: Month or Custom Totals */}
                    {dateMode !== 'year' && (
                      <>
                        <td className="p-3 text-right font-mono text-teal-900 whitespace-nowrap">
                          ฿{grandTotal.uc_money.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-indigo-900 whitespace-nowrap">
                          ฿{grandTotal.rcpt_money.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-800 whitespace-nowrap">
                          ฿{grandTotal.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </>
                    )}

                    {/* Grand Total Income */}
                    <td className="p-3 text-right font-mono text-emerald-950 bg-emerald-200/50 whitespace-nowrap text-sm">
                      ฿{grandTotal.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="p-3 bg-emerald-50/30 border-t border-emerald-100 flex flex-wrap items-center justify-between text-xs text-emerald-800 font-medium gap-2">
            <span>
              แสดงข้อมูลแพทย์ทั้งหมด {filteredDoctors.length} ท่าน
            </span>
            <span>
              รวมยอดค่ารักษาพยาบาลทั้งสิ้น: <strong className="text-slate-900">฿{grandTotal.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
