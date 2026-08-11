'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Users,
  Armchair,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  QrCode,
  UserPlus,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  Receipt,
  Building2
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalStudents: number;
    occupiedSeats: number;
    totalSeats: number;
    availableSeats: number;
    revenue: number;
    expenses: number;
    profit: number;
    todayAttendance: number;
    absentToday: number;
    expiringSoonCount: number;
    totalActiveStudents: number;
    overdueStudents: number;
  };
  students: {
    paid: number;
    unpaid: number;
    total: number;
  };
  recentTransactions: any[];
  suspiciousAttempts: any[];
  expiringMemberships: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load dashboard data. Please refresh.</p>
        <Button onClick={fetchDashboardStats} className="mt-4">Retry</Button>
      </div>
    );
  }

  const paymentRate = stats.students.total > 0
    ? ((stats.students.paid / stats.students.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-600 dark:text-slate-400">Welcome back! Real-time statistics and quick management links.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/payments">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Collect Fee
            </Button>
          </Link>
          <Link href="/attendance" target="_blank">
            <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">
              <QrCode className="h-4 w-4 mr-1.5" />
              QR Scanner
            </Button>
          </Link>
        </div>
      </div>

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
          trend="Active Members"
          trendUp={true}
        />
        <StatCard
          title="Present Today"
          value={stats.overview.todayAttendance}
          icon={<Calendar className="h-5 w-5 text-emerald-500" />}
          trend="In Library"
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

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <Armchair className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.availableSeats}</div>
            <p className="text-xs text-slate-500 mt-1">
              Out of {stats.overview.totalSeats} total desks ({stats.overview.occupiedSeats} occupied)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">₹{(stats.overview.expenses || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Operational & Maintenance costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues & Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.overview.overdueStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Students requiring fee collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status & Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Fee Payment Collection Status</CardTitle>
            <Link href="/dashboard/payments" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
              View Payments <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Paid Students</span>
                  <span className="text-sm font-bold text-emerald-600">{stats.students.paid} ({paymentRate}%)</span>
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
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Unpaid / Overdue</span>
                  <span className="text-sm font-bold text-orange-500">
                    {stats.students.unpaid} ({stats.students.total > 0 ? (100 - parseFloat(paymentRate)).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${stats.students.total > 0 ? 100 - parseFloat(paymentRate) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="border-indigo-100 dark:border-indigo-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white">Financial Summary & Profitability</CardTitle>
            <Link href="/dashboard/finance" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
              Full Statement <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue (Fee Collections)</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(stats.overview.revenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Operating Expenses</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  ₹{(stats.overview.expenses || 0).toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Net Operating Profit</span>
                <span className={`text-xl font-extrabold ${stats.overview.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ₹{(stats.overview.profit || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions & Payments</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Live stream of fee collections and expense transactions</p>
          </div>
          <Link href="/dashboard/payments">
            <Button variant="outline" size="sm" className="text-xs">
              View All Payments
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'expense' 
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' 
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}>
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
                        {transaction.subtitle || (transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'Cash')} • {new Date(transaction.date || transaction.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${transaction.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {transaction.type === 'expense' ? '-' : '+'}₹{(transaction.amount || 0).toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {transaction.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No recent transactions or payments recorded yet.</p>
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
                  <div key={attempt._id} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{attempt.studentName}</span>
                      <span className="text-xs text-slate-500">{new Date(attempt.time).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-xs text-rose-600 dark:text-rose-400">{attempt.reason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No suspicious activity detected today.</p>
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
                  <div key={member._id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                    <div>
                      <span className="font-semibold text-sm block">{member.name}</span>
                      <span className="text-xs text-slate-500">Seat: {member.seatNumber || 'Unassigned'}</span>
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
              <p className="text-sm text-slate-500 text-center py-4">No memberships expiring in the next 7 days.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: {
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
          <span className={trendUp ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{trend}</span>
        </p>
      </CardContent>
    </Card>
  );
}