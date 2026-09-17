'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import { 
  BedDouble, 
  Stethoscope, 
  ArrowRight, 
  Database, 
  CheckCircle2, 
  Activity, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  TrendingUp,
  Download,
  Filter,
  Check,
  Building2,
  PieChart,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* Floating Presentation Navigator */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3 bg-white/90 backdrop-blur-md p-3 rounded-full border border-emerald-200 shadow-xl">
        {[
          { id: 'hero', label: 'หน้าหลัก' },
          { id: 'problem-solution', label: 'วิสัยทัศน์ & ที่มา' },
          { id: 'module-sss', label: '2.1.1.1 ทันตกรรมประกันสังคม' },
          { id: 'module-opd', label: '2.1.1.2 OPD' },
          { id: 'module-ipd', label: '2.1.2.1 IPD' },
          { id: 'data-flow', label: 'สถาปัตยกรรมข้อมูล' },
          { id: 'start', label: 'เข้าใช้งาน' }
        ].map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            title={sec.label}
            className="w-3.5 h-3.5 rounded-full bg-emerald-200 hover:bg-emerald-600 border border-emerald-300 hover:scale-125 transition-all duration-300 focus:ring-2 focus:ring-emerald-500"
          />
        ))}
      </nav>

      <main className="relative">

        {/* ================= SLIDE 1: HERO COVER (WHITE-EMERALD THEME) ================= */}
        <section id="hero" className="min-h-[88vh] flex flex-col justify-center items-center relative px-4 sm:px-6 lg:px-8 text-center overflow-hidden border-b border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-slate-50">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-emerald-200/40 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-100/40 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-6 relative z-10 py-12">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300/80 text-emerald-900 text-xs sm:text-sm font-semibold tracking-wide shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-400" />
              <span>ระบบนำเสนอและกำกับติดตามรายได้โรงพยาบาล</span>
              <span className="text-emerald-400">|</span>
              <span className="text-emerald-700 font-mono">HOSxP RCM 2026</span>
            </div>

            {/* Main Presentation Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
              Hospital Revenue Cycle <br />
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                Management (RCM)
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
              ยกระดับการบริหารข้อมูลการเงินค่ารักษาพยาบาล สิทธิเบิกชดเชย e-Claim และประสิทธิภาพการเรียกเก็บหนี้ โรงพยาบาลเถิน
              เชื่อมตรงฐานข้อมูล <strong className="text-emerald-800 font-bold">HOSxP MySQL</strong> แบบอัตโนมัติและแม่นยำ
            </p>

            {/* Quick Metrics Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
              <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-mono">37</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">กลุ่มสิทธิ e-Claim มาตรฐาน</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono">100%</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">ดึงข้อมูลจริงจาก HOSxP</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-teal-700 font-mono">3 Modules</p>
                <p className="text-xs font-semibold text-slate-600 mt-1">ทันตกรรม, OPD & IPD</p>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="pt-6">
              <a 
                href="#problem-solution" 
                className="inline-flex flex-col items-center gap-2 text-xs font-medium text-slate-500 hover:text-emerald-700 transition"
              >
                <span>เลื่อนลงเพื่อดูการนำเสนอ</span>
                <ChevronDown className="w-5 h-5 animate-bounce text-emerald-600" />
              </a>
            </div>
          </div>
        </section>

        {/* ================= SLIDE 2: THE CHALLENGE & SOLUTION ================= */}
        <section id="problem-solution" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-emerald-100">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-emerald-700 font-mono text-xs uppercase tracking-widest font-bold bg-emerald-100 px-3 py-1 rounded-full">
              Why Dashboard-RCM?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              ตอบโจทย์การบริหารจัดการรายได้ และปิดรอยรั่วทางการเงิน
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              การบริหารสิทธิการรักษาพยาบาลมีความซับซ้อน ระบบนี้จึงถูกออกแบบมาเพื่อเป็นเครื่องมือนำเสนอและกำกับติดตาม (Monitoring Hub) ของผู้บริหารและฝ่ายการเงิน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-5 group-hover:scale-110 transition">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ติดตามลูกหนี้คงค้าง</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                แยกชัดเจนระหว่าง <strong className="text-slate-800">สิทธิเบิกจ่าย (UC)</strong>, <strong className="text-slate-800">ชำระเงินสดเอง (Paid)</strong>, และ <strong className="text-emerald-700 font-bold">ลูกหนี้คงค้าง (Debit)</strong> ช่วยให้ฝ่ายการเงินติดตามทวงถามได้ทันท่วงที
              </p>
            </div>

            <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 mb-5 group-hover:scale-110 transition">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">รองรับ 37 สิทธิ e-Claim</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                จำแนกสิทธิการรักษาตรงตามมาตรฐาน สปสช. และกรมบัญชีกลาง ทั้งบัตรทอง, ข้าราชการ, ประกันสังคม, อปท., พรบ. และกลุ่มตรวจสุขภาพ พร้อมระบบ Multi-choice กรองเฉพาะกลุ่มที่สนใจได้ทันที
              </p>
            </div>

            <div className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-5 group-hover:scale-110 transition">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ส่งออก Excel (CSV) ทันที</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ทุกหน้าจอรองรับการส่งออกข้อมูลดิบในรูปแบบ CSV พร้อม UTF-8 BOM เปิดใน Microsoft Excel ได้ภาษาไทยไม่เพี้ยน สะดวกต่อการนำไปจัดทำรายงานเสนอกรรมการบริหาร
              </p>
            </div>

          </div>
        </section>

        {/* ================= SLIDE 3: MODULE 2.1.1.1 DENTAL ================= */}
        <section id="module-sss" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-emerald-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>ระบบรายงานทันตกรรม</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                2.1.1.1 รายงานการให้บริการทันตกรรม <br />
                <span className="text-emerald-700">สิทธิ์ประกันสังคม โรงพยาบาลเถิน</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                รายงานการให้บริการทันตกรรมสิทธิ์ประกันสังคม จำแนกตามทันตแพทย์ผู้ให้การตรวจรักษา สรุปยอดเงินบำรุง สิทธิเบิกชดเชย (UC) และลูกหนี้ค้างชำระ
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>เจาะจงเฉพาะทันตกรรมประกันสังคม:</strong> กรองเฉพาะสิทธิ์ประกันสังคมและหัตถการทันตกรรมโดยเฉพาะ</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>แจกแจงรายทันตแพทย์:</strong> ทราบยอดจำนวนครั้งตรวจและรายได้แยกตามทันตแพทย์แต่ละท่าน</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>เลือกดูได้ 3 รูปแบบเวลา:</strong> กำหนดวันถึงวัน (Custom), รายเดือน (Monthly), หรือรายปีงบประมาณ</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/sss-dental"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 transition hover:scale-105 cursor-pointer text-sm"
                >
                  <span>เปิดหน้ารายงาน 2.1.1.1 (ทันตกรรมประกันสังคม)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Clean White-Emerald Mock Card Preview */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold font-mono text-emerald-900 ml-1">รายงานทันตกรรมประกันสังคม (2.1.1.1)</span>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">Live Query</span>
                </div>

                {/* KPI Grid Mock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">จำนวนครั้งรับบริการ</p>
                    <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">856 <span className="text-xs text-slate-500 font-normal">ครั้ง</span></p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">ค่ารักษาพยาบาลรวม</p>
                    <p className="text-xl font-bold text-emerald-700 font-mono mt-0.5">฿782,400</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">สิทธิเบิกจ่าย (UC)</p>
                    <p className="text-xl font-bold text-teal-700 font-mono mt-0.5">฿765,000</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">ชำระเงินเอง</p>
                    <p className="text-xl font-bold text-slate-700 font-mono mt-0.5">฿17,400</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SLIDE 4: MODULE 2.1.2.1 IPD ================= */}
        <section id="module-ipd" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-emerald-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <BedDouble className="w-4 h-4 text-emerald-600" />
                <span>ระบบรายงานผู้ป่วยใน</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                2.1.2.1 รายงานสรุปการให้บริการ <br />
                <span className="text-emerald-700">ผู้ป่วยในโรงพยาบาลเถิน</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                รายงานสรุปการให้บริการผู้ป่วยในโรงพยาบาลเถิน จำแนกข้อมูลผู้ป่วยที่จำหน่ายออกจากโรงพยาบาล วิเคราะห์มิติความรุนแรงของโรคและการใช้ทรัพยากร ด้วยค่า AdjRW รวม และ Case Mix Index (CMI)
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>ตัวชี้วัดสำคัญครบถ้วน:</strong> ผู้ป่วยจำหน่าย, วันนอนรวม (LOS), ค่ารักษาพยาบาล, ยอดชำระเอง, และลูกหนี้เบิกจ่าย</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>เจาะลึก 2 มิติ:</strong> ตารางแจกแจงแยกตาม <span className="text-emerald-800 font-bold">หอผู้ป่วย (Ward)</span> และตาม <span className="text-emerald-800 font-bold">แพทย์ผู้สั่งจำหน่าย</span></span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>เลือกดูได้ 3 รูปแบบเวลา:</strong> กำหนดวันถึงวัน (Custom), รายเดือน (Monthly), หรือรายปีงบประมาณ (Fiscal Year ต.ค. - ก.ย.)</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/ipd"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 transition hover:scale-105 cursor-pointer text-sm"
                >
                  <span>เปิดหน้ารายงาน 2.1.2.1 (IPD)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Clean White-Emerald Mock Card Preview */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold font-mono text-emerald-900 ml-1">Dashboard 2.1.2.1 (IPD Preview)</span>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">Live Query</span>
                </div>

                {/* KPI Grid Mock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">ผู้ป่วยจำหน่ายทั้งหมด</p>
                    <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">1,248 <span className="text-xs text-slate-500 font-normal">ราย</span></p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">ค่ารักษาพยาบาลรวม</p>
                    <p className="text-xl font-bold text-emerald-700 font-mono mt-0.5">฿18,450,200</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">AdjRW รวม (ค่าน้ำหนัก)</p>
                    <p className="text-xl font-bold text-teal-700 font-mono mt-0.5">1,580.45</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500">CMI เฉลี่ย (ความซับซ้อน)</p>
                    <p className="text-xl font-bold text-emerald-800 font-mono mt-0.5">1.266</p>
                  </div>
                </div>

                {/* Table Mock */}
                <div className="bg-slate-50 rounded-xl p-3 border border-emerald-100 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600 font-bold border-b border-emerald-200 pb-1.5">
                    <span>หอผู้ป่วย (Ward)</span>
                    <span>ยอดเงินรวม (บาท)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>หอผู้ป่วยพิเศษ 1</span>
                    <span className="font-mono font-semibold text-emerald-700">฿5,420,100</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>หอผู้ป่วยอายุรกรรมชาย</span>
                    <span className="font-mono font-semibold text-emerald-700">฿4,890,300</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>หอผู้ป่วยศัลยกรรม</span>
                    <span className="font-mono font-semibold text-emerald-700">฿3,710,500</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SLIDE 4: MODULE 2.1.1.2 OPD ================= */}
        <section id="module-opd" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-emerald-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Clean White-Emerald Mock Card Preview */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold font-mono text-teal-900 ml-1">Dashboard 2.1.1.2 (OPD Preview)</span>
                  </div>
                  <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-semibold">37 สิทธิ์</span>
                </div>

                {/* Filter Badge Demonstration */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>ตัวเลือกสิทธิ์ที่กำลังเลือก (Filter active)</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">✓ เลือกทุกสิทธิ (37)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">16: เบิกจ่ายตรงข้าราชการ</span>
                    <span className="text-[11px] bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">17: จ่ายตรง อปท.</span>
                    <span className="text-[11px] bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">28: บัตรทอง UCS</span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">+ อีก 34 สิทธิ์</span>
                  </div>
                </div>

                {/* Doctor Monthly Breakdown Mock */}
                <div className="bg-slate-50 rounded-xl p-3 border border-emerald-100 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600 font-bold border-b border-emerald-200 pb-1.5">
                    <span>รายชื่อแพทย์</span>
                    <span>ต.ค. 68</span>
                    <span>พ.ย. 68</span>
                    <span>รวมทั้งปี</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold text-slate-900 truncate max-w-[120px]">นพ. สาธิต ...</span>
                    <span className="font-mono text-slate-600">22.7k</span>
                    <span className="font-mono text-slate-600">28.4k</span>
                    <span className="font-mono text-emerald-700 font-bold">฿184,200</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold text-slate-900 truncate max-w-[120px]">พญ. รัตนา ...</span>
                    <span className="font-mono text-slate-600">19.2k</span>
                    <span className="font-mono text-slate-600">21.8k</span>
                    <span className="font-mono text-emerald-700 font-bold">฿142,500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Description */}
            <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>ระบบสรุปรายได้แพทย์ผู้ป่วยนอก</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                2.1.1.2 สรุปค่าบริการผู้ป่วยนอก <br />
                <span className="text-teal-700">OPD ตามสิทธิ์การรักษา</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                รายงานค่ารักษาพยาบาลผู้ป่วยนอกจำแนกรายแพทย์ พร้อมการกระจายยอดรายเดือนตลอดปีงบประมาณ และระบบกรองสิทธิการรักษาแบบละเอียด
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Multi-choice 37 สิทธิ์:</strong> เลือกรวมหรือแยกสิทธิการรักษาได้ตามต้องการ พร้อมปุ่ม "✓ เลือกทุกสิทธิ (37)" ในคลิกเดียว</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>แจกแจงรายเดือนย่อยอัตโนมัติ:</strong> เมื่อเลือกดูรายปีงบประมาณ ระบบจะสร้างคอลัมน์ ต.ค. - ก.ย. และยอดรวมทั้งปีให้ทันที</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>ค้นหาแพทย์สะดวกรวดเร็ว:</strong> มีช่องค้นหาตามรหัสแพทย์หรือชื่อ-สกุล พร้อมแถบสรุปยอดรวมท้ายตาราง</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/opd-doctor"
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg shadow-teal-600/20 transition hover:scale-105 cursor-pointer text-sm"
                >
                  <span>เปิดหน้ารายงาน 2.1.1.2 (OPD)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SLIDE 5: SYSTEM ARCHITECTURE ================= */}
        <section id="data-flow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-emerald-100">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-emerald-800 font-mono text-xs uppercase tracking-widest font-bold bg-emerald-100 px-3 py-1 rounded-full">
              Behind The Scene
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              สถาปัตยกรรมข้อมูลและการเชื่อมโยง HOSxP
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              ทุกข้อมูลผ่านการประมวลผลด้วย SQL Index ที่มีประสิทธิภาพสูง ไม่รบกวนการทำงานของระบบห้องตรวจหลัก
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            
            {/* Step 1 */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Step 01</span>
              <div className="text-slate-900 font-bold text-base mt-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>HOSxP Database</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                เชื่อมต่อไปยัง MySQL Server ดึงตาราง <code>ovst</code>, <code>ipt</code>, <code>vn_stat</code>, <code>an_stat</code>, <code>incpmpt</code>
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">Step 02</span>
              <div className="text-slate-900 font-bold text-base mt-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>e-Claim Grouping</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                จับคู่รหัสสิทธิ์ใน pttype เข้ากับ 37 กลุ่มสิทธิ์มาตรฐานของ สปสช. เพื่อความถูกต้องในการตั้งหนี้
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Step 03</span>
              <div className="text-slate-900 font-bold text-base mt-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>RCM Analytics API</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                คำนวณลูกหนี้คงค้าง สรุปรายเดือนของปีงบประมาณ และหาค่า CMI / AdjRW รวมแบบ Real-time
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-emerald-100 hover:border-emerald-300 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">Step 04</span>
              <div className="text-slate-900 font-bold text-base mt-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span>Interactive View</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                นำเสนอผลผ่าน UI สีขาว-เขียวมรกตสะอาดตา พร้อมปุ่ม Export CSV เพื่อเปิดใน Excel ได้ทันที
              </p>
            </div>

          </div>
        </section>

        {/* ================= SLIDE 6: CALL TO ACTION ================= */}
        <section id="start" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">พร้อมเข้าสู่ระบบรายงาน</h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              เลือกโมดูลที่ต้องการเริ่มต้นใช้งาน หรือสลับดูข้อมูลผ่านแถบเมนูด้านบนได้ตลอดเวลา
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/sss-dental"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg shadow-emerald-700/20 transition hover:scale-105"
            >
              <Stethoscope className="w-5 h-5" />
              <span>เข้าสู่ 2.1.1.1 (ทันตกรรม)</span>
            </Link>

            <Link
              href="/opd-doctor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold px-7 py-3.5 rounded-xl shadow-sm hover:shadow-md transition hover:scale-105"
            >
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>เข้าสู่ 2.1.1.2 (OPD)</span>
            </Link>

            <Link
              href="/ipd"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 transition hover:scale-105"
            >
              <BedDouble className="w-5 h-5" />
              <span>เข้าสู่ 2.1.2.1 (IPD)</span>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-600">Dashboard-RCM • Hospital Revenue Cycle Management Platform</p>
        <p className="mt-1">เชื่อมต่อฐานข้อมูล HOSxP MySQL • Next.js & Tailwind CSS</p>
      </footer>
    </div>
  );
}
