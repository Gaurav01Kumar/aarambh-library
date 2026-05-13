'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar as CalendarIcon,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  date: string;
  description?: string;
  utr?: string;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: 'Fees',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    utr: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/api/transactions';
      if (filterType !== 'all') url += `?type=${filterType}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });
      if (response.ok) {
        setOpen(false);
        resetForm();
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'income',
      category: 'Fees',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      utr: '',
    });
  };

  const categories = {
    income: ['Fees', 'Registration', 'Late Fine', 'Other Income'],
    expense: ['Rent', 'Electricity', 'Internet', 'Salary', 'Maintenance', 'Cleaning', 'Water', 'Marketing', 'Others']
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Accounting</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your income, expenses and overall library revenue.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', category: 'Fees' })}
                      className={cn(
                        "py-1.5 text-xs font-bold rounded-md transition-all",
                        formData.type === 'income' 
                          ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" 
                          : "text-slate-500"
                      )}
                    >
                      INCOME
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense', category: 'Rent' })}
                      className={cn(
                        "py-1.5 text-xs font-bold rounded-md transition-all",
                        formData.type === 'expense' 
                          ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" 
                          : "text-slate-500"
                      )}
                    >
                      EXPENSE
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title / Name *</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Monthly Rent" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories[formData.type].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online / UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                {formData.paymentMethod !== 'cash' && (
                  <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="utr" className="text-blue-700 dark:text-blue-400 font-bold text-xs uppercase flex items-center gap-1">
                      <Hash className="h-3 w-3" /> UTR / Transaction ID
                    </Label>
                    <Input 
                      id="utr" 
                      placeholder="Enter 12-digit UTR or Txn ID"
                      value={formData.utr}
                      onChange={(e) => setFormData({ ...formData, utr: e.target.value })}
                      className="bg-white dark:bg-slate-900 border-blue-200"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Notes (Optional)</Label>
                  <Input 
                    id="description" 
                    placeholder="Add details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Income</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₹{stats.totalIncome.toLocaleString()}</div>
            <div className="flex items-center text-xs text-emerald-600/80 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> All-time earnings
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Expenses</CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">₹{stats.totalExpense.toLocaleString()}</div>
            <div className="flex items-center text-xs text-rose-600/80 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" /> All-time spending
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Net Balance</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.netProfit >= 0 ? "text-blue-700 dark:text-blue-300" : "text-rose-600"
            )}>
              ₹{stats.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600/80 mt-1">Available Profit/Loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      No transactions recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <TableCell className="text-xs font-medium text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {tx.title}
                          {tx.utr && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold uppercase">
                              {tx.utr}
                            </span>
                          )}
                        </div>
                        {tx.description && <div className="text-[10px] text-slate-400 italic">{tx.description}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {tx.category}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-xs text-slate-500">
                        {tx.paymentMethod.replace('_', ' ')}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
