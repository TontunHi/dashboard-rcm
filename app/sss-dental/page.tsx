'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/app/components/Navbar';
import { DentalDoctorSummaryItem } from '@/app/api/sss-dental/route';
import { 
  Users, DollarSign, CreditCard, Receipt, Clock, Download, 
  RefreshCw, Search, Calendar, ChevronDown, Stethoscope, X
} from 'lucide-react';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function SssDentalPage() {
  const today = new Date();
  const currentCalYear = today.getFullYear();
  const defaultFiscalYear = today.getMonth() + 1 >= 10 ? currentCalYear + 1 : currentCalYear;

  // Date controls - 3 modes matching IPD and OPD
  const [dateMode, setDateMode] = useState<'custom' | 'month' | 'year'>('year');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(defaultFiscalYear);
  const [ds1, setDs1] = useState<string>(() => `${defaultFiscalYear - 1}-10-01`);
  const [ds2, setDs2] = useState<string>(() => `${defaultFiscalYear}-09-30`);

  // Filter States
  const [searchDoctor, setSearchDoctor] = useState<string>('');
  const [selectedDoctorCode, setSelectedDoctorCode] = useState<string>('');

  // Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<DentalDoctorSummaryItem[]>([]);
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

  // Fetch Data (Only summary by doctor, no patient visits needed)
  const fetchData = async (start = ds1, end = ds2, docFilter = selectedDoctorCode) => {
    setLoading(true);
    try {
      let url = `/api/sss-dental?ds1=${start}&ds2=${end}&visits=false`;
      if (docFilter) {
        url += `&doctor=${encodeURIComponent(docFilter)}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setDoctors(json.doctors || []);
        setMonths(json.months || []);
        setMonthlyTotals(json.monthlyTotals || {});
        setGrandTotal(json.grandTotal || {});
      }
    } catch (err) {
      console.error('Fetch SSS Dental Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(ds1, ds2, selectedDoctorCode);
  }, [ds1, ds2, selectedDoctorCode]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    if (!searchDoctor.trim()) return doctors;
    const q = searchDoctor.toLowerCase().trim();
    return doctors.filter(d => 
      d.doctor_name.toLowerCase().includes(q) || 
      d.doctor_code.toLowerCase().includes(q)
    );
  }, [doctors, searchDoctor]);

  // Formatter helpers
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Number(val).toLocaleString('th-TH');
  };

  // Export CSV
  const exportDoctorCSV = () => {
    if (filteredDoctors.length === 0) return;

    let headers = ['รหัสแพทย์', 'ชื่อแพทย์', 'จำนวนครั้งตรวจ', 'ค่ารักษารวม', 'สิทธิเบิก (UC)', 'ชำระเอง', 'ส่วนลด', 'ลูกหนี้ค้าง (Debit)'];
    if (dateMode === 'year') {
      fiscalMonthColumns.forEach(m => {
        headers.push(`${m.label} (งบ)`, `${m.label} (ครั้ง)`);
      });
    }

    const rows = filteredDoctors.map(d => {
      const row = [
        `"${d.doctor_code}"`,
        `"${d.doctor_name}"`,
        d.total_visits,
        d.total_income.toFixed(2),
        d.total_uc_money.toFixed(2),
        d.total_rcpt_money.toFixed(2),
        d.total_discount.toFixed(2),
        d.total_debit.toFixed(2),
      ];

      if (dateMode === 'year') {
        fiscalMonthColumns.forEach(m => {
          row.push((d.monthly_income[m.key] || 0).toFixed(2));
          row.push(String(d.monthly_visits[m.key] || 0));
        });
      }
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SSS_Dental_Doctor_Summary_${ds1}_to_${ds2}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        
        {/* Global Control Bar (Matching /ipd structure) */}
        <section className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 space-y-3.5">
          {/* Row 1: Mode Switcher + Dates + Fetch + Export CSV */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Selector Buttons */}
              <div className="bg-emerald-50/70 p-1 rounded-lg flex items-center border border-emerald-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setDateMode('custom');
                    const d = new Date();
                    setDs1(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                    setDs2(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                  }}
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

              {/* Mode 1: Custom Date Inputs */}
              {dateMode === 'custom' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">ตรวจ:</span>
                  <input
                    type="date"
                    value={ds1}
                    onChange={(e) => setDs1(e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">ถึง</span>
                  <input
                    type="date"
                    value={ds2}
                    onChange={(e) => setDs2(e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Mode 2: Month Picker Dropdown */}
              {dateMode === 'month' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">เดือน:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleSelectMonth(Number(e.target.value))}
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

              {/* Mode 3: Fiscal Year Picker Dropdown */}
              {dateMode === 'year' && (
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 pl-1.5">ปีงบประมาณ:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedYear}
                      onChange={(e) => handleSelectFiscalYear(Number(e.target.value))}
                      className="appearance-none border border-slate-200 bg-white hover:border-emerald-400 text-slate-800 font-semibold rounded-md pl-2.5 pr-7 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          ปีงบประมาณ {y + 543}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Fetch Button */}
              <button
                onClick={() => fetchData(ds1, ds2, selectedDoctorCode)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>ดึงข้อมูล</span>
              </button>
            </div>

            {/* Right Buttons: Export */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={exportDoctorCSV}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>ส่งออก Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Row 2: Search by Doctor */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs flex-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Search className="h-3.5 w-3.5 text-emerald-600" /> ค้นหาแพทย์:
              </span>

              {/* Doctor Search Filter */}
              <div className="relative min-w-[260px] max-w-sm">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อแพทย์..."
                  value={searchDoctor}
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                {searchDoctor && (
                  <button
                    onClick={() => setSearchDoctor('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
              ช่วงวันที่: <b className="text-emerald-700 font-mono">{ds1}</b> ถึง <b className="text-emerald-700 font-mono">{ds2}</b>
            </div>
          </div>
        </section>

        {/* Metric KPI Summary Cards (Styled like /ipd) */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: ผู้รับบริการทั้งหมด */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3.5">
            <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-700 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">จำนวนตรวจ</p>
              <p className="text-xl font-bold text-slate-800">
                {formatNumber(grandTotal.visits)} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
              </p>
            </div>
          </div>

          {/* Card 2: รวมค่ารักษาทั้งหมด (Income) */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3.5">
            <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-700 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">ค่ารักษาทั้งหมด</p>
              <p className="text-xl font-bold text-indigo-700">
                ฿{formatCurrency(grandTotal.income)}
              </p>
            </div>
          </div>

          {/* Card 3: สิทธิเบิก (UC / เรียกเก็บ สปส.) */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3.5">
            <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">สิทธิเบิก สปส.</p>
              <p className="text-xl font-bold text-emerald-700">
                ฿{formatCurrency(grandTotal.uc_money)}
              </p>
            </div>
          </div>

          {/* Card 4: ชำระเอง (Receipt) */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3.5">
            <div className="bg-amber-100 p-2.5 rounded-lg text-amber-700 shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">ชำระเงินเอง</p>
              <p className="text-xl font-bold text-amber-700">
                ฿{formatCurrency(grandTotal.rcpt_money)}
              </p>
            </div>
          </div>

          {/* Card 5: ลูกหนี้คงค้าง (Debit) */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3.5 col-span-2 lg:col-span-1">
            <div className="bg-rose-100 p-2.5 rounded-lg text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">ลูกหนี้คงค้าง (Debit)</p>
              <p className="text-xl font-bold text-rose-600">
                ฿{formatCurrency(grandTotal.debit)}
              </p>
            </div>
          </div>
        </section>

        {/* Doctor & Budget Summary Table */}
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                ตารางสรุปข้อมูลแพทย์และงบประมาณการรักษา
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              แพทย์ <b className="text-emerald-700 font-mono">{filteredDoctors.length}</b> ท่าน
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[200px] text-center">ชื่อแพทย์</th>
                  <th className="py-2.5 px-3 text-center">ครั้งตรวจ</th>
                  <th className="py-2.5 px-3 text-center font-bold text-slate-900 bg-emerald-50/50">ค่ารักษารวม (งบ)</th>
                  <th className="py-2.5 px-3 text-center text-emerald-800">สิทธิเบิก</th>
                  <th className="py-2.5 px-3 text-center text-amber-800">ชำระเอง</th>
                  <th className="py-2.5 px-3 text-center text-rose-800">ลูกหนี้ค้าง</th>

                  {/* Fiscal Month breakdown columns if in Year mode */}
                  {dateMode === 'year' && fiscalMonthColumns.map((m) => (
                    <th key={m.key} className="py-2.5 px-2.5 text-center font-semibold border-l border-slate-200 min-w-[90px]">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={dateMode === 'year' ? 19 : 7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>กำลังประมวลผลข้อมูล...</span>
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={dateMode === 'year' ? 19 : 7} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredDoctors.map((doc, idx) => (
                      <tr key={doc.doctor_code} className="hover:bg-slate-50/80 transition group">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 text-left pl-4">
                          <div className="font-semibold text-slate-800">
                            {doc.doctor_name}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-medium font-mono">
                          {formatNumber(doc.total_visits)}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900 bg-emerald-50/40 font-mono">
                          {formatCurrency(doc.total_income)}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-medium font-mono">
                          {formatCurrency(doc.total_uc_money)}
                        </td>
                        <td className="py-2 px-3 text-center text-amber-700 font-medium font-mono">
                          {formatCurrency(doc.total_rcpt_money)}
                        </td>
                        <td className="py-2 px-3 text-center text-rose-700 font-medium font-mono">
                          {formatCurrency(doc.total_debit)}
                        </td>

                        {/* Fiscal Months breakdown */}
                        {dateMode === 'year' && fiscalMonthColumns.map((m) => {
                          const val = doc.monthly_income[m.key] || 0;
                          return (
                            <td 
                              key={m.key} 
                              className={`py-2 px-2.5 text-center border-l border-slate-100 font-mono text-[11px] ${
                                val > 0 ? 'text-slate-800 font-medium' : 'text-slate-300'
                              }`}
                            >
                              {val > 0 ? formatCurrency(val) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Grand Total Row */}
                    <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-center">
                      <td className="py-2.5 px-3 text-center" colSpan={2}>
                        รวมทั้งหมด ({filteredDoctors.length} ท่าน)
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                        {formatNumber(grandTotal.visits)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-emerald-900 bg-emerald-100/60 font-mono">
                        {formatCurrency(grandTotal.income)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-800 font-mono">
                        {formatCurrency(grandTotal.uc_money)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-800 font-mono">
                        {formatCurrency(grandTotal.rcpt_money)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-800 font-mono">
                        {formatCurrency(grandTotal.debit)}
                      </td>

                      {/* Fiscal Months breakdown Total */}
                      {dateMode === 'year' && fiscalMonthColumns.map((m) => {
                        const totalVal = monthlyTotals[m.key]?.income || 0;
                        return (
                          <td 
                            key={m.key} 
                            className="py-2.5 px-2.5 text-center border-l border-slate-200 font-mono text-[11px] font-bold text-slate-900"
                          >
                            {totalVal > 0 ? formatCurrency(totalVal) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
