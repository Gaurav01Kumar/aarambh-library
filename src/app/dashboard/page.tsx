'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Users,
  Armchair,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  QrCode,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  Receipt,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

interface MonthlyBreakdownItem {
  month: string;
  shortLabel: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  paymentsCount: number;
  newStudents: number;
}

interface DashboardStats {
  filter?: {
    month: string;
    year: number;
    label: string;
  };
  overview: {
    totalStudents: number;
    newStudentsInPeriod?: number;
    occupiedSeats: number;
    totalSeats: number;
    availableSeats: number;
    revenue: number;
    expenses: number;
    profit: number;
    todayAttendance: number;
    absentToday: number;
    monthlyAttendanceCount?: number;
    paymentsCount?: number;
    expiringSoonCount: number;
    totalActiveStudents: number;
    overdueStudents: number;
  };
  students: {
    paid: number;
    unpaid: number;
    total: number;
  };
  monthlyBreakdown?: MonthlyBreakdownItem[];
  recentTransactions: any[];
  suspiciousAttempts: any[];
  expiringMemberships: any[];
}

const MONTHS_LIST = [
  { num: '01', short: 'Jan', full: 'January' },
  { num: '02', short: 'Feb', full: 'February' },
  { num: '03', short: 'Mar', full: 'March' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'May', full: 'May' },
  { num: '06', short: 'Jun', full: 'June' },
  { num: '07', short: 'Jul', full: 'July' },
  { num: '08', short: 'Aug', full: 'August' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Oct', full: 'October' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Dec', full: 'December' },
];

export default function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastMonthDate = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    [now]
  );
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(
    lastMonthDate.getMonth() + 1
  ).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardStats = useCallback(
    async (monthVal: string, yearVal: number, showFullLoader = false) => {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const params = new URLSearchParams({
          month: monthVal,
          year: String(yearVal),
        });
        const response = await fetch(`/api/dashboard?${params.toString()}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboardStats(selectedMonth, selectedYear, !stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, fetchDashboardStats]);

  const handleSelectMonthPill = (monthNum: string) => {
    const key = `${selectedYear}-${monthNum}`;
    if (selectedMonth === key) {
      setSelectedMonth('all');
    } else {
      setSelectedMonth(key);
    }
  };

  const handlePresetAll = () => {
    setSelectedMonth('all');
  };

  const handlePresetThisMonth = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonthKey);
  };

  const handlePresetLastMonth = () => {
    setSelectedYear(lastMonthDate.getFullYear());
    setSelectedMonth(lastMonthKey);
  };

  const handleYearStep = (delta: number) => {
    const nextYear = selectedYear + delta;
    setSelectedYear(nextYear);
    if (selectedMonth !== 'all') {
      const monthPart = selectedMonth.split('-')[1] || '01';
      setSelectedMonth(`${nextYear}-${monthPart}`);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading dashboard analytics...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load dashboard data. Please refresh.</p>
        <Button
          onClick={() => fetchDashboardStats(selectedMonth, selectedYear, true)}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const activePeriodLabel =
    stats.filter?.label ||
    (selectedMonth === 'all' ? 'All Time' : selectedMonth);

  const paymentRate =
    stats.students.total > 0
      ? ((stats.students.paid / stats.students.total) * 100).toFixed(1)
      : '0.0';

  const filteredRecentTransactions = (stats.recentTransactions || []).filter(
    (t) => (txnTypeFilter === 'all' ? true : t.type === txnTypeFilter)
  );

  const monthlyBreakdown = stats.monthlyBreakdown || [];
  const maxMonthlyValue = Math.max(
    1,
    ...monthlyBreakdown.map((m) => Math.max(m.revenue, m.expenses))
  );

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                Updating...
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time statistics, monthly financial filters, and quick management links.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/payments">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Collect Fee
            </Button>
          </Link>
          <Link href="/attendance" target="_blank">
            <Button
              size="sm"
              variant="outline"
              className="border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
            >
              <QrCode className="h-4 w-4 mr-1.5" />
              QR Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Monthly Filter Bar ─── */}
      <Card className="border-indigo-200/70 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Filter Title & Active Period Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Monthly Analytics Filter
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    <CalendarDays className="h-3 w-3" />
                    {activePeriodLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Filter revenue, expenses, net profit, and transactions month-wise
                </p>
              </div>
            </div>

            {/* Right: Presets + Native Month Input + Year Stepper */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedMonth === 'all' ? 'default' : 'outline'}
                onClick={handlePresetAll}
                className={
                  selectedMonth === 'all'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs'
                    : 'h-8 text-xs'
                }
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={selectedMonth === currentMonthKey ? 'default' : 'outline'}
                onClick={handlePresetThisMonth}
                className={
                  selectedMonth === currentMonthKey
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs'
                    : 'h-8 text-xs'
                }
              >
                This Month
              </Button>
              <Button
                size="sm"
                variant={selectedMonth === lastMonthKey ? 'default' : 'outline'}
                onClick={handlePresetLastMonth}
                className={
                  selectedMonth === lastMonthKey
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs'
                    : 'h-8 text-xs'
                }
              >
                Last Month
              </Button>

              {/* Direct Month Input Picker */}
              <div className="relative flex items-center">
                <input
                  type="month"
                  aria-label="Select Month"
                  value={selectedMonth === 'all' ? '' : selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedMonth('all');
                    } else {
                      const [y] = val.split('-');
                      if (y) setSelectedYear(parseInt(y, 10));
                      setSelectedMonth(val);
                    }
                  }}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Year Selector Stepper */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-8 px-1">
                <button
                  type="button"
                  onClick={() => handleYearStep(-1)}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                  title="Previous Year"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => handleYearStep(1)}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                  title="Next Year"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {selectedMonth !== 'all' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePresetAll}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* 12-Month Pill Selector Row */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 pt-1">
            {MONTHS_LIST.map((m) => {
              const key = `${selectedYear}-${m.num}`;
              const isSelected = selectedMonth === key;
              const mData = monthlyBreakdown.find((b) => b.month === key);
              const hasActivity = mData && (mData.revenue > 0 || mData.expenses > 0);

              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => handleSelectMonthPill(m.num)}
                  className={`relative px-2 py-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-[1.02]'
                      : hasActivity
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/70 dark:border-indigo-800/60 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                      : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{m.short}</span>
                  <span
                    className={`text-[10px] mt-0.5 truncate max-w-full ${
                      isSelected
                        ? 'text-indigo-100 font-medium'
                        : hasActivity
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {mData && mData.revenue > 0
                      ? `₹${mData.revenue >= 1000 ? `${(mData.revenue / 1000).toFixed(1)}k` : mData.revenue}`
                      : '₹0'}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions / Quick Links Bar */}
      <Card className="border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-slate-50 dark:from-slate-900/60 dark:via-indigo-950/20 dark:to-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Quick Shortcuts & Navigation
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Link href="/dashboard/seats">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                  <Armchair className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Seat Map</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{stats.overview.availableSeats} Available</span>
              </div>
            </Link>

            <Link href="/dashboard/students">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Students</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{stats.overview.totalActiveStudents} Active</span>
              </div>
            </Link>

            <Link href="/dashboard/payments">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                  <Receipt className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Payments & Invoices</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Collect Dues</span>
              </div>
            </Link>

            <Link href="/dashboard/finance">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Finance & Expenses</span>
                <span className="text-[10px] text-slate-400 mt-0.5">P&L Reports</span>
              </div>
            </Link>

            <Link href="/dashboard/reports">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Reports</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Monthly Summaries</span>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center">
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2 group-hover:scale-110 transition-transform">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Settings</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Email Alerts</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Active"
          value={stats.overview.totalActiveStudents}
          icon={<Users className="h-5 w-5 text-indigo-500" />}
          trend={
            selectedMonth === 'all'
              ? 'Active Members'
              : `+${stats.overview.newStudentsInPeriod ?? 0} Joined in ${activePeriodLabel}`
          }
          trendUp={true}
        />
        <StatCard
          title="Present Today"
          value={stats.overview.todayAttendance}
          icon={<Calendar className="h-5 w-5 text-emerald-500" />}
          trend={
            selectedMonth === 'all'
              ? 'In Library Today'
              : `${stats.overview.monthlyAttendanceCount ?? 0} Scans in Month`
          }
          trendUp={true}
        />
        <StatCard
          title="Absent Today"
          value={stats.overview.absentToday}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          trend="Not Present"
          trendUp={false}
        />
        <StatCard
          title="Empty Seats"
          value={stats.overview.availableSeats}
          icon={<Armchair className="h-5 w-5 text-blue-500" />}
          trend="Vacant Desks"
          trendUp={true}
        />
        <StatCard
          title="Expiring Soon"
          value={stats.overview.expiringSoonCount}
          icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
          trend="< 7 Days"
          trendUp={false}
        />
      </div>

      {/* Period Financial KPIs (Updates dynamically with selected month) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200/60 dark:border-emerald-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue ({activePeriodLabel})
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{(stats.overview.revenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.overview.paymentsCount ?? 0} fee payments recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200/60 dark:border-rose-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expenses ({activePeriodLabel})
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ₹{(stats.overview.expenses || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Operational & maintenance costs
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/60 dark:border-indigo-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Profit ({activePeriodLabel})
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.overview.profit >= 0
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₹{(stats.overview.profit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Out of {stats.overview.totalSeats} total desks ({stats.overview.occupiedSeats} occupied)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues & Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats.overview.overdueStudents}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Students requiring fee collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 12-Month Interactive Revenue vs Expense Chart */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Monthly Revenue vs Expenses ({selectedYear})
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any month bar below to filter the dashboard to that specific month
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" />
                Expenses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2 items-end h-44 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-slate-800">
              {monthlyBreakdown.map((item) => {
                const revHeight = Math.max(
                  4,
                  Math.round((item.revenue / maxMonthlyValue) * 120)
                );
                const expHeight = Math.max(
                  4,
                  Math.round((item.expenses / maxMonthlyValue) * 120)
                );
                const isActive = selectedMonth === item.month;

                return (
                  <button
                    key={item.month}
                    type="button"
                    onClick={() =>
                      setSelectedMonth(isActive ? 'all' : item.month)
                    }
                    title={`${item.label}\nRevenue: ₹${item.revenue.toLocaleString()}\nExpenses: ₹${item.expenses.toLocaleString()}\nProfit: ₹${item.profit.toLocaleString()}`}
                    className={`group flex flex-col items-center justify-end h-full rounded-lg p-1 transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-end justify-center gap-1 w-full flex-1">
                      <div
                        style={{ height: `${revHeight}px` }}
                        className="w-2.5 sm:w-3.5 rounded-t bg-emerald-500 group-hover:bg-emerald-400 transition-all"
                      />
                      <div
                        style={{ height: `${expHeight}px` }}
                        className="w-2.5 sm:w-3.5 rounded-t bg-rose-500 group-hover:bg-rose-400 transition-all"
                      />
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-bold ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status & Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Fee Payment Collection Status</CardTitle>
            <Link
              href="/dashboard/payments"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              View Payments <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Paid Students
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {stats.students.paid} ({paymentRate}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Unpaid / Overdue
                  </span>
                  <span className="text-sm font-bold text-orange-500">
                    {stats.students.unpaid} (
                    {stats.students.total > 0
                      ? (100 - parseFloat(paymentRate)).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{
                      width: `${
                        stats.students.total > 0
                          ? 100 - parseFloat(paymentRate)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="border-indigo-100 dark:border-indigo-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">
                Financial Summary ({activePeriodLabel})
              </CardTitle>
            </div>
            <Link
              href="/dashboard/finance"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Full Statement <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Revenue (Fee Collections)
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(stats.overview.revenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Total Operating Expenses
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  ₹{(stats.overview.expenses || 0).toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Net Operating Profit
                </span>
                <span
                  className={`text-xl font-extrabold ${
                    stats.overview.profit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  ₹{(stats.overview.profit || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Payments */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>
              Recent Transactions & Payments ({activePeriodLabel})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered stream of fee collections and expense transactions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
              {(['all', 'income', 'expense'] as const).map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => setTxnTypeFilter(tType)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                    txnTypeFilter === tType
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tType}
                </button>
              ))}
            </div>
            <Link href="/dashboard/payments">
              <Button variant="outline" size="sm" className="text-xs h-8">
                View All Payments
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecentTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredRecentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'expense'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      {transaction.type === 'expense' ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {transaction.title || transaction.studentName || 'Transaction'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {transaction.subtitle ||
                          (transaction.paymentMethod
                            ? transaction.paymentMethod.toUpperCase()
                            : 'Cash')}{' '}
                        •{' '}
                        {new Date(
                          transaction.date || transaction.createdAt
                        ).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        transaction.type === 'expense'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}₹
                      {(transaction.amount || 0).toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {transaction.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">
              No transactions recorded for {activePeriodLabel}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts and Expiring Memberships */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
              <AlertCircle className="h-5 w-5" />
              Suspicious Attendance Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.suspiciousAttempts && stats.suspiciousAttempts.length > 0 ? (
              <div className="space-y-4">
                {stats.suspiciousAttempts.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{attempt.studentName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(attempt.time).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs text-rose-600 dark:text-rose-400">
                      {attempt.reason}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No suspicious activity detected in {activePeriodLabel}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
              <Calendar className="h-5 w-5" />
              Memberships Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.expiringMemberships && stats.expiringMemberships.length > 0 ? (
              <div className="space-y-4">
                {stats.expiringMemberships.map((member) => (
                  <div
                    key={member._id}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0"
                  >
                    <div>
                      <span className="font-semibold text-sm block">{member.name}</span>
                      <span className="text-xs text-slate-500">
                        Seat: {member.seatNumber || 'Unassigned'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {new Date(member.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No memberships expiring in the next 7 days.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
          {trendUp ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span
            className={
              trendUp
                ? 'text-emerald-500 font-semibold'
                : 'text-rose-500 font-semibold'
            }
          >
            {trend}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
