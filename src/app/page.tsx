'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  IndianRupee,
  Lock,
  Mail,
  MapPin,
  Menu,
  QrCode,
  Sparkles,
  UserPlus,
  FileCheck2,
  X,
} from 'lucide-react';

/* ───────────────────────── Design tokens ─────────────────────────
   Cream paper background, deep "leaf" green, warm amber/yellow/coral
   accents and a near-black ink — an editorial, local, friendly feel. */
const C = {
  cream: '#fffef9',
  paper: '#f7f5ec',
  line: '#e4e4d8',
  ink: '#1A1A2E',
  muted: '#5e6555',
  leaf: '#08650b',
  leafSoft: '#E8F5E9',
  amber: '#F5A623',
  yellow: '#F6DA5F',
  coral: '#FF7B7B',
};

const NAV = [
  { href: '#daily-desk', label: 'The daily desk' },
  { href: '#money-list', label: 'Fees & money' },
  { href: '#admissions', label: 'Admissions' },
  { href: '#our-promise', label: 'Why Aarambh' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'Good to know' },
];

const MOMENTS = [
  {
    tag: 'THE MORNING SHIFT',
    title: 'Chai, books, QR scan.',
    body: 'Students walk in, scan their pass and take their seat. Attendance is logged before the first page turns.',
    chips: ['QR check-in', 'Live seat map', 'Attendance log'],
    color: C.yellow,
  },
  {
    tag: 'THE AFTERNOON SWAP',
    title: 'Same desk. New student.',
    body: 'Morning batch leaves, evening batch arrives. Shift-wise seats mean no clashes and no “yeh meri seat hai” arguments.',
    chips: ['Multi-shift', 'No double booking', 'Reserved desks'],
    color: C.leafSoft,
  },
  {
    tag: 'THE EVENING CLOSE',
    title: 'Who came. Who didn’t.',
    body: 'Lights off with a clear picture: today’s present and absent list, check-out times and any suspicious scans.',
    chips: ['Check-out time', 'Absent list', 'Alerts'],
    color: '#FFE4E1',
  },
];

const STEPS = [
  { n: '01', title: 'Set up your seats', body: 'Add your seat count, shifts and monthly fee plans.' },
  { n: '02', title: 'Add your students', body: 'Enroll them yourself or share a registration link. QR passes are created automatically.' },
  { n: '03', title: 'Open the doors. We’ll keep count.', body: 'Attendance, fees, dues and monthly profit stay up to date on their own.' },
];

const FAQS = [
  {
    q: 'Do I need to install an app?',
    a: 'No. Aarambh Library runs in any modern browser on your phone, tablet or computer. Sign up, log in and start — nothing to download.',
  },
  {
    q: 'How does QR attendance work?',
    a: 'Every student gets a unique QR pass in their student portal. They scan it at your entrance device and their check-in and check-out times are recorded automatically.',
  },
  {
    q: 'Can one seat be used in multiple shifts?',
    a: 'Yes. Assign the same desk to different students in morning, evening or full-day shifts. The system stops overlapping bookings.',
  },
  {
    q: 'How do I know whose fee is due?',
    a: 'The dashboard highlights overdue students and memberships expiring in the next 7 days, and lets you send reminders. Revenue, expenses and profit can be filtered month by month.',
  },
  {
    q: 'Can my staff use it too?',
    a: 'Yes. Give staff access to daily work like attendance and fee entry while finances and settings stay with the admin. Important actions are recorded in audit logs.',
  },
  {
    q: 'How do I get help?',
    a: 'Email support@aarambhlibrary.com and our team will help you set up your library.',
  },
];

const PLANS = [
  { name: 'Free', price: '0', note: 'forever', blurb: 'For small study rooms starting out.', features: ['Up to 30 seats', 'Seat map', 'Student records', 'Basic fee tracking'], featured: false },
  { name: 'Basic', price: '799', note: '/ month', blurb: 'For busy libraries with multiple shifts.', features: ['Up to 150 seats', 'Multi-shift seats', 'QR attendance', 'Monthly P&L & expenses', 'Fee reminders', 'Student portal'], featured: true },
  { name: 'Pro', price: '1,499', note: '/ month', blurb: 'For large and multi-branch libraries.', features: ['Unlimited seats', 'Everything in Basic', 'CSV & PDF reports', 'Staff roles & audit logs', 'Priority support'], featured: false },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div
      className="min-h-screen antialiased"
      style={{ backgroundColor: C.cream, color: C.ink }}
    >
      {/* Greeting strip */}
      <div className="px-4 py-2 text-center text-xs font-medium text-white sm:text-sm" style={{ backgroundColor: C.leaf }}>
        <span className="mr-1.5">👋</span>
        Namaste! Seats, Online Admissions, QR Attendance & Monthly Hisaab — sab ek jagah.
      </div>

      {/* Navigation */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur"
        style={{ backgroundColor: 'rgba(255,254,249,0.9)', borderColor: C.line }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark />

          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" style={{ color: C.muted }}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="transition-colors hover:text-[#1A1A2E]">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/auth/signin" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-black/5">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: C.leaf }}
            >
              Let’s set up <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 hover:bg-black/5 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t px-4 pb-5 pt-3 lg:hidden" style={{ borderColor: C.line, backgroundColor: C.cream }}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/auth/signin" className="rounded-full border py-2.5 text-center text-sm font-semibold" style={{ borderColor: C.line }}>
                Sign in
              </Link>
              <Link href="/auth/signup" className="rounded-full py-2.5 text-center text-sm font-semibold text-white" style={{ backgroundColor: C.leaf }}>
                Let’s set up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Eyebrow>Silent study halls · Smart management · Zero register headache</Eyebrow>

            <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
              Your library,
              <br />
              <span style={{ color: C.leaf }}>sorted</span>
              <span style={{ color: C.amber }}>.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed sm:text-xl" style={{ color: C.muted }}>
              From{' '}
              <Highlight color={C.yellow}>“naya admission lena hai”</Highlight> to{' '}
              <Highlight color="#FFD6D6">“kiski fee 10th tak nahi aayi?”</Highlight> — bas ek dashboard, poora hisaab saaf.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: C.muted }}>
              Paperless student admissions, shift-wise seat matrix, instant QR check-in and 1st-of-month fee tracking — built for modern reading rooms.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: C.leaf, boxShadow: '0 12px 30px -12px rgba(8,101,11,0.6)' }}
              >
                Start free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/student-registration"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-4 text-base font-semibold transition-colors hover:bg-black/5"
                style={{ borderColor: C.ink }}
              >
                <UserPlus className="h-5 w-5" style={{ color: C.leaf }} />
                New Admission
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5 text-sm font-medium">
              <Pill icon={<Globe className="h-4 w-4" />}>Works in any browser — no app needed</Pill>
              <Pill icon={<MapPin className="h-4 w-4" />}>Made for Indian study halls</Pill>
            </div>
          </div>

          {/* Collage */}
          <div className="relative mx-auto h-[460px] w-full max-w-md">
            {/* Seat map card */}
            <div
              className="absolute left-0 top-6 w-[85%] rotate-[-3deg] rounded-3xl border bg-white p-5 shadow-xl"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Morning shift</p>
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: C.leafSoft, color: C.leaf }}>
                  18 / 24 filled
                </span>
              </div>
              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {Array.from({ length: 24 }).map((_, i) => {
                  const taken = [0, 1, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22, 23].includes(i);
                  const reserved = i === 9 || i === 20;
                  return (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-lg text-[9px] font-bold"
                      style={{
                        backgroundColor: reserved ? C.yellow : taken ? C.leaf : C.paper,
                        color: taken ? '#fff' : C.muted,
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR toast */}
            <div
              className="absolute right-0 top-[52%] w-[70%] rotate-[2deg] rounded-2xl border bg-white p-4 shadow-xl"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" style={{ backgroundColor: C.leafSoft }}>
                  <QrCode className="h-6 w-6" style={{ color: C.leaf }} />
                </div>
                <div>
                  <p className="text-sm font-bold">Aarav checked in</p>
                  <p className="text-xs" style={{ color: C.muted }}>Seat S-14 · 06:12 AM</p>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5" style={{ color: C.leaf }} />
              </div>
            </div>

            {/* Fee card */}
            <div
              className="absolute bottom-0 left-4 w-[62%] rotate-[-2deg] rounded-2xl p-4 text-white shadow-xl"
              style={{ backgroundColor: C.ink }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">This month</p>
              <p className="mt-1 flex items-center text-2xl font-extrabold">
                <IndianRupee className="h-5 w-5" />1,48,500
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.yellow }}>
                <ArrowUpRight className="h-3.5 w-3.5" /> 7 fees due this week
              </p>
            </div>

            {/* Sticky note */}
            <div
              className="absolute -top-2 right-2 rotate-[6deg] px-4 py-3 text-sm font-bold shadow-md"
              style={{ backgroundColor: C.yellow }}
            >
              S-03 khaali hai! ✏️
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Two lists banner ───────────────── */}
      <section className="border-y" style={{ borderColor: C.line, backgroundColor: C.paper }}>
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <Eyebrow center>Full seats. Clean accounts.</Eyebrow>
          <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            The seat list.
            <span className="mx-3 inline-block" style={{ color: C.amber }}>+</span>
            The fee list.
          </p>
        </div>
      </section>

      {/* ───────────────── Green tagline band ───────────────── */}
      <section style={{ backgroundColor: C.leaf }} className="text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">
              Apni library.
              <br />
              <span style={{ color: C.yellow }}>Apna hisaab.</span>
            </p>
          </div>
          <div className="max-w-sm">
            <p className="text-lg text-white/85">
              A little less register work. A little more time for your students.
            </p>
            <Link href="#daily-desk" className="mt-4 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4" style={{ color: C.yellow }}>
              Meet your new front desk <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── Chapter 01: Daily desk ───────────────── */}
      <section id="daily-desk" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Chapter n="01" label="The daily desk" />
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Doors open.
              <br />
              Seats fill up.
            </h2>
            <p className="text-lg" style={{ color: C.muted }}>
              For the students who come every day. And the ones who “bas aaj late ho gaya”.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {MOMENTS.map((m) => (
              <article key={m.tag} className="flex flex-col rounded-3xl p-7" style={{ backgroundColor: m.color }}>
                <p className="text-[11px] font-bold tracking-[0.2em]" style={{ color: C.ink, opacity: 0.6 }}>
                  {m.tag}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold leading-snug">{m.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: C.muted }}>
                  {m.body}
                </p>
                <p className="mt-6 text-xs font-semibold" style={{ color: C.ink }}>
                  {m.chips.join(' · ')}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white" style={{ backgroundColor: C.ink }}>
              Get your seat map ready <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── Chapter 02: Money list ───────────────── */}
      <section id="money-list" className="scroll-mt-20 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] text-white" style={{ backgroundColor: C.ink }}>
            <div className="grid gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em]" style={{ color: C.amber }}>
                  02 / THE MONEY LIST
                </p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  Give the register
                  <br />a day off.
                </h2>
                <p className="mt-5 text-lg text-white/70">
                  Fees in, expenses out, profit at a glance. Filter any month and see exactly where the money went — no calculator, no diary.
                </p>
                <ul className="mt-8 space-y-3">
                  {['Record full, partial or advance fees', 'Track rent, electricity & other expenses', 'Monthly revenue, expenses & net profit', 'Overdue students highlighted automatically'].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-white/90">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: C.amber }}>
                        <Check className="h-3.5 w-3.5" style={{ color: C.ink }} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fee ledger mock */}
              <div className="rounded-3xl bg-white p-6" style={{ color: C.ink }}>
                <div className="flex items-center justify-between">
                  <p className="font-bold">November</p>
                  <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: C.paper }}>
                    {['Sep', 'Oct', 'Nov'].map((m) => (
                      <span
                        key={m}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={m === 'Nov' ? { backgroundColor: C.leaf, color: '#fff' } : { color: C.muted }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { k: 'Fees in', v: '₹1,48,500', c: C.leaf },
                    { k: 'Expenses', v: '₹27,300', c: '#DC2626' },
                    { k: 'Profit', v: '₹1,21,200', c: C.ink },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl p-3" style={{ backgroundColor: C.paper }}>
                      <p className="text-[11px]" style={{ color: C.muted }}>{s.k}</p>
                      <p className="mt-1 text-sm font-extrabold sm:text-base" style={{ color: s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-xs font-bold tracking-widest" style={{ color: C.muted }}>FEE DUE THIS WEEK</p>
                <div className="mt-3 divide-y" style={{ borderColor: C.line }}>
                  {[
                    { n: 'Priya Patel', s: 'S-02 · Morning', d: 'Due in 2 days', c: C.amber },
                    { n: 'Rohan Verma', s: 'S-06 · Evening', d: 'Overdue', c: '#DC2626' },
                    { n: 'Neha Kapoor', s: 'S-12 · Full day', d: 'Due in 5 days', c: C.amber },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold">{r.n}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{r.s}</p>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${r.c}22`, color: r.c }}>
                        {r.d}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Chapter 03: Online Admissions ───────────────── */}
      <section id="admissions" className="scroll-mt-20 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 rounded-[2rem] border bg-white p-8 shadow-sm sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:items-center" style={{ borderColor: C.line }}>
            <div>
              <Chapter n="03" label="Online admissions" />
              <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Naya admission?
                <br />
                <span style={{ color: C.leaf }}>Bina paper, bina line.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: C.muted }}>
                “Form bharne ka register khatam, photocopy ki zaroorat nahi.” Share one admission link or QR at your reception — students enroll themselves in 60 seconds.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  {
                    title: '1. Online Admission Form',
                    body: 'Student fills name, phone, target exam (UPSC, SSC, NEET, CA) & preferred shift from their phone.',
                  },
                  {
                    title: '2. Digital ID & Photo Upload',
                    body: 'Aadhaar / ID proof and photo saved securely with the student record — no paper files.',
                  },
                  {
                    title: '3. Instant Seat & QR Entry Pass',
                    body: 'Approve admission, assign a desk and their personal QR pass activates immediately.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl p-3.5" style={{ backgroundColor: C.paper }}>
                    <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: C.leaf }} />
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: C.muted }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/student-registration"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: C.leaf }}
                >
                  Open Admission Form <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/student-portal"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3.5 text-sm font-semibold hover:bg-black/5"
                  style={{ borderColor: C.ink }}
                >
                  Student Portal Login
                </Link>
              </div>
            </div>

            {/* Visual Admission Card */}
            <div className="relative">
              <div className="rounded-3xl border p-6 shadow-xl" style={{ borderColor: C.line, backgroundColor: C.cream }}>
                <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: C.line }}>
                  <div>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: C.yellow, color: C.ink }}>
                      Admissions Open
                    </span>
                    <h3 className="mt-2 text-lg font-extrabold">Student Admission Pass</h3>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: C.leafSoft }}>
                    <UserPlus className="h-6 w-6" style={{ color: C.leaf }} />
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {[
                    { k: 'Applicant', v: 'Ananya Gupta' },
                    { k: 'Target Exam', v: 'UPSC CSE 2027' },
                    { k: 'Preferred Shift', v: 'Morning (06:00 AM – 02:00 PM)' },
                    { k: 'Assigned Seat', v: 'Seat S-08 · AC Hall' },
                    { k: 'ID Proof', v: 'Verified Online ✓' },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between border-b pb-2 text-xs sm:text-sm" style={{ borderColor: C.line }}>
                      <span style={{ color: C.muted }}>{row.k}</span>
                      <span className="font-bold">{row.v}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl p-4 text-white" style={{ backgroundColor: C.ink }}>
                  <div className="flex items-center gap-3">
                    <QrCode className="h-8 w-8" style={{ color: C.yellow }} />
                    <div>
                      <p className="text-xs font-bold">QR Pass Generated</p>
                      <p className="text-[11px] text-white/70">Ready for daily check-in</p>
                    </div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: C.leafSoft, color: C.leaf }}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Steps ───────────────── */}
      <section className="border-y py-24" style={{ borderColor: C.line, backgroundColor: C.paper }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Eyebrow>Yes, you can do both.</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Students for today.
            <br />
            Accounts for tomorrow.
          </h2>
          <p className="mt-4 text-lg" style={{ color: C.muted }}>No switching between registers, diaries and spreadsheets.</p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 pt-6" style={{ borderColor: C.ink }}>
                <p className="text-5xl font-extrabold" style={{ color: C.leaf }}>{s.n}</p>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2" style={{ color: C.muted }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Rooted / promise ───────────────── */}
      <section id="our-promise" className="scroll-mt-20 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Built for the libraries of Bharat</Eyebrow>
            <p className="mt-5 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl" style={{ color: C.leaf }}>
              पढ़ाई उनकी।
              <br />
              <span style={{ color: C.ink }}>हिसाब आपका।</span>
            </p>
            <p className="mt-6 text-xl font-semibold">Great software belongs in every study hall, too.</p>
            <p className="mt-3 text-lg" style={{ color: C.muted }}>
              From a 30-seat reading room to a 300-seat library, Aarambh brings your seats, students and fees together — simple enough for the front desk, detailed enough for the owner.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <UserPlus className="h-5 w-5" />, t: '“Form aur ID proof — sab online.”', b: 'Paperless admissions in 60 seconds with instant seat & shift assignment.', bg: '#E0F2FE' },
              { icon: <QrCode className="h-5 w-5" />, t: '“Register book chhodo, QR scan apnao.”', b: 'Every student gets a QR pass — zero proxy attendance, full daily logs.', bg: C.leafSoft },
              { icon: <IndianRupee className="h-5 w-5" />, t: '“1st ko unpaid, 10th ke baad overdue alert.”', b: 'Automatic monthly fee cycle so no pending due ever slips through.', bg: '#FFF4D6' },
              { icon: <Lock className="h-5 w-5" />, t: '“Aapki library, aapka poora control.”', b: 'Staff roles, admin-only financial P&L reports and complete audit logs.', bg: '#FFE4E1' },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-4 rounded-2xl border bg-white p-5" style={{ borderColor: C.line }}>
                <div className="rounded-xl p-3" style={{ backgroundColor: f.bg, color: C.ink }}>{f.icon}</div>
                <div>
                  <p className="font-bold">{f.t}</p>
                  <p className="mt-1 text-sm" style={{ color: C.muted }}>{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Pricing ───────────────── */}
      <section id="pricing" className="scroll-mt-20 border-t py-24" style={{ borderColor: C.line, backgroundColor: C.paper }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Eyebrow>Simple pricing</Eyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Start free. Grow when you’re ready.</h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className="relative flex flex-col rounded-3xl p-8"
                style={
                  p.featured
                    ? { backgroundColor: C.leaf, color: '#fff' }
                    : { backgroundColor: '#fff', border: `1px solid ${C.line}` }
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: C.yellow, color: C.ink }}>
                    Most chosen
                  </span>
                )}
                <p className="text-lg font-bold">{p.name}</p>
                <p className="mt-1 text-sm" style={{ opacity: 0.75 }}>{p.blurb}</p>
                <p className="mt-6">
                  <span className="text-5xl font-extrabold">₹{p.price}</span>
                  <span className="ml-1 text-sm" style={{ opacity: 0.7 }}>{p.note}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4" style={{ color: p.featured ? C.yellow : C.leaf }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-8 rounded-full py-3 text-center font-semibold transition-transform hover:-translate-y-0.5"
                  style={p.featured ? { backgroundColor: C.yellow, color: C.ink } : { backgroundColor: C.ink, color: '#fff' }}
                >
                  {p.price === '0' ? 'Start free' : `Choose ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section id="faq" className="scroll-mt-20 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow>Before you begin</Eyebrow>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              A few things
              <br />
              worth knowing.
            </h2>
            <p className="mt-6" style={{ color: C.muted }}>Still have a question?</p>
            <a
              href="mailto:support@aarambhlibrary.com"
              className="mt-3 inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-semibold hover:bg-black/5"
              style={{ borderColor: C.ink }}
            >
              <Mail className="h-4 w-4" /> Talk to us
            </a>
          </div>

          <div className="divide-y border-y" style={{ borderColor: C.line }}>
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} style={{ borderColor: C.line }}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-base font-bold sm:text-lg">{f.q}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: open ? C.leaf : C.paper, color: open ? '#fff' : C.ink }}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {open && <p className="pb-5 pr-12 leading-relaxed" style={{ color: C.muted }}>{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── Final CTA ───────────────── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20" style={{ backgroundColor: C.yellow }}>
          <p className="text-[11px] font-bold tracking-[0.2em]" style={{ color: C.ink, opacity: 0.7 }}>
            ONE DASHBOARD. MANY “SHUKR HAI” MOMENTS.
          </p>
          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Your next “house full!”
            <br />
            starts here.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg" style={{ color: C.ink, opacity: 0.75 }}>
            Create your account, add your seats and let’s take the register off your to-do list.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-semibold text-white"
              style={{ backgroundColor: C.leaf }}
            >
              Start free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/student-registration"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 px-7 py-4 font-semibold hover:bg-black/5"
              style={{ borderColor: C.ink }}
            >
              I’m a student
            </Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium" style={{ color: C.ink, opacity: 0.7 }}>
            <Sparkles className="h-4 w-4" /> Seats bhi. Hisaab bhi.
          </p>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="border-t" style={{ borderColor: C.line }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-xs" style={{ color: C.muted }}>
              Your library. Your students. Your hisaab.
            </p>
          </div>
          <FooterCol
            title="Take a look around"
            links={NAV.map((n) => ({ href: n.href, label: n.label }))}
          />
          <FooterCol
            title="Let’s talk"
            links={[
              { href: 'mailto:support@aarambhlibrary.com', label: 'support@aarambhlibrary.com' },
              { href: '/auth/signin', label: 'Owner sign in' },
              { href: '/student-portal', label: 'Student portal' },
              { href: '/student-registration', label: 'Student registration' },
            ]}
          />
        </div>
        <div className="border-t" style={{ borderColor: C.line }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6" style={{ color: C.muted }}>
            <p>© {new Date().getFullYear()} Aarambh Library</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-[#1A1A2E]">Privacy policy</Link>
              <Link href="#" className="hover:text-[#1A1A2E]">Terms of service</Link>
            </div>
            <p>With love, for every study hall 📚</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Small building blocks ───────────────────────── */

function Wordmark() {
  return (
    <Link href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: C.ink }}>
      Aarambh<span style={{ color: C.leaf }}>Library</span>
      <span style={{ color: C.amber }}>.</span>
    </Link>
  );
}

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.2em] ${center ? 'text-center' : ''}`}
      style={{ color: C.leaf }}
    >
      {children}
    </p>
  );
}

function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: C.leaf }}>
      {n} / {label}
    </p>
  );
}

function Highlight({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="whitespace-nowrap rounded-md px-1.5 font-semibold" style={{ backgroundColor: color, color: C.ink }}>
      {children}
    </span>
  );
}

function Pill({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5" style={{ borderColor: C.line }}>
      <span style={{ color: C.leaf }}>{icon}</span>
      {children}
    </span>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-bold">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm" style={{ color: C.muted }}>
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-[#1A1A2E]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
