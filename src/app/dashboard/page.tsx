'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Armchair,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const occupancyRate = ((stats.overview.occupiedSeats / stats.overview.totalSeats) * 100).toFixed(1);
  const paymentRate = ((stats.students.paid / stats.students.total) * 100).toFixed(1);

  // Chart data
  const paymentData = [
    { name: 'Paid', value: stats.students.paid, color: '#22c55e' },
    { name: 'Unpaid', value: stats.students.unpaid, color: '#f97316' },
  ];

  const financialData = [
    { name: 'Revenue', value: stats.overview.revenue, color: '#22c55e' },
    { name: 'Expenses', value: stats.overview.expenses, color: '#ef4444' },
    { name: 'Profit', value: stats.overview.profit, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Active"
          value={stats.overview.totalActiveStudents}
          icon={<Users className="h-5 w-5" />}
          trend="Active"
          trendUp={true}
        />
        <StatCard
          title="Present Today"
          value={stats.overview.todayAttendance}
          icon={<Calendar className="h-5 w-5" />}
          trend="In Library"
          trendUp={true}
        />
        <StatCard
          title="Absent Today"
          value={stats.overview.absentToday}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          trend="Not Here"
          trendUp={false}
        />
        <StatCard
          title="Empty Seats"
          value={stats.overview.availableSeats}
          icon={<Armchair className="h-5 w-5" />}
          trend="Available"
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <Armchair className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.availableSeats}</div>
            <p className="text-xs text-slate-500">
              {stats.overview.totalSeats - stats.overview.availableSeats} seats occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.overview.expenses.toLocaleString()}</div>
            <p className="text-xs text-slate-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Students</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.overview.overdueStudents}</div>
            <p className="text-xs text-slate-500">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Paid Students</span>
                  <span className="text-sm text-slate-500">{stats.students.paid} ({paymentRate}%)</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Unpaid Students</span>
                  <span className="text-sm text-slate-500">{stats.students.unpaid} ({(100 - parseFloat(paymentRate)).toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${100 - parseFloat(paymentRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
                <span className="text-sm font-medium">₹{stats.overview.revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</span>
                <span className="text-sm font-medium">₹{stats.overview.expenses.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Profit</span>
                <span className={`text-sm font-bold ${stats.overview.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{stats.overview.profit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.type}</p>
                      <p className="text-xs text-slate-500">
                        {transaction.student?.name || 'Unknown'} • {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{transaction.amount.toLocaleString()}</p>
                    <p className={`text-xs ${transaction.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No recent transactions</p>
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
            {stats.suspiciousAttempts?.length > 0 ? (
              <div className="space-y-4">
                {stats.suspiciousAttempts.map((attempt) => (
                  <div key={attempt._id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{attempt.studentName} (Seat: {attempt.seatNumber})</span>
                      <span className="text-xs text-slate-500">{new Date(attempt.time).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-sm text-rose-600 dark:text-rose-400">{attempt.reason}</span>
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
            {stats.expiringMemberships?.length > 0 ? (
              <div className="space-y-4">
                {stats.expiringMemberships.map((member) => (
                  <div key={member._id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <span className="font-semibold block">{member.name}</span>
                      <span className="text-xs text-slate-500">Seat: {member.seatNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
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
        <p className="text-xs text-slate-500 flex items-center gap-1">
          {trendUp ? (
            <ArrowUpRight className="h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span className={trendUp ? 'text-green-500' : 'text-red-500'}>{trend}</span>
          <span className="text-slate-400">from last month</span>
        </p>
      </CardContent>
    </Card>
  );
}