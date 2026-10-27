'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Filter,
  MoreVertical,
  Download,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  User,
  CreditCard,
  X,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

interface Transaction {
  _id: string;
  title?: string;
  type: 'fee' | 'deposit' | 'refund' | 'penalty' | 'other' | 'income' | 'expense' | string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'fake' | string;
  isFake?: boolean;
  fakeReason?: string;
  fakeFlaggedAt?: string;
  description?: string;
  transactionId: string;
  receiptNumber: string;
  utr?: string;
  month?: string;
  year?: number;
  date?: string;
  createdAt: string;
  student?: {
    name: string;
    email: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Mark as fake modal state
  const [selectedTxnForFake, setSelectedTxnForFake] = useState<Transaction | null>(null);
  const [fakeReason, setFakeReason] = useState('Payment verification failed: Fake transaction screenshot / Unverified UTR provided.');
  const [isMarkingFake, setIsMarkingFake] = useState(false);

  // View details modal state
  const [viewingTxn, setViewingTxn] = useState<Transaction | null>(null);

  // Feedback notification state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterStatus, filterMonth]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (filterMonth) params.append('month', filterMonth);

      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFake = async () => {
    if (!selectedTxnForFake) return;
    setIsMarkingFake(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/transactions/${selectedTxnForFake._id}/mark-fake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: fakeReason }),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: data.message || 'Transaction flagged as fake! Student fee status reverted to unpaid and a stern fraud warning email was dispatched.',
        });
        setSelectedTxnForFake(null);
        fetchTransactions();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to mark transaction as fake',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while updating transaction',
      });
    } finally {
      setIsMarkingFake(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fee':
      case 'income':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-500/20';
      case 'deposit':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-500/20';
      case 'refund':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-500/20';
      case 'penalty':
      case 'expense':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-500/20';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const getStatusColor = (status: string, isFake?: boolean) => {
    if (isFake || status === 'fake') {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/40 font-bold';
    }
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border border-red-500/30 font-medium';
      case 'refunded':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-medium';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  // Exclude fake payments from legitimate revenue calculation
  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && !t.isFake && ['fee', 'income', 'deposit'].includes(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const fakeTransactionsCount = transactions.filter(t => t.status === 'fake' || t.isFake).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions & Accounting</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Monitor verified collections, refunds, and fraud prevention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Verified Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Excludes fake/unverified payments</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {transactions.filter(t => t.status === 'completed' && !t.isFake).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Audited transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {transactions.filter(t => t.status === 'pending').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting bank verification</p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-800 ${fakeTransactionsCount > 0 ? 'ring-1 ring-rose-500/40' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Fake / Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-500">
              {fakeTransactionsCount}
            </div>
            <p className="text-[11px] text-rose-400/80 mt-1">Reverted & warned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-950 text-slate-200"
            >
              <option value="">All Types</option>
              <option value="fee">Fee Collection</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="deposit">Deposit</option>
              <option value="refund">Refund</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-950 text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="fake">Fake / Flagged</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-950 text-slate-200"
            />

            {(filterType || filterStatus || filterMonth) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setFilterMonth('');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-base font-bold text-white flex items-center justify-between">
            <span>Transaction Records</span>
            <span className="text-xs text-slate-400 font-normal">
              Showing {transactions.length} record{transactions.length === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span>Loading transaction records...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                    <TableHead className="py-3 px-4">Transaction Ref</TableHead>
                    <TableHead className="py-3 px-4">Type</TableHead>
                    <TableHead className="py-3 px-4">Student / Party</TableHead>
                    <TableHead className="py-3 px-4">Amount</TableHead>
                    <TableHead className="py-3 px-4">Method</TableHead>
                    <TableHead className="py-3 px-4">Status</TableHead>
                    <TableHead className="py-3 px-4">Date</TableHead>
                    <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60">
                  {transactions.map((transaction) => {
                    const isFake = transaction.isFake || transaction.status === 'fake';
                    return (
                      <TableRow
                        key={transaction._id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isFake ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <TableCell className="py-3 px-4 font-mono text-xs text-indigo-300">
                          {transaction.transactionId || transaction.utr || transaction._id.slice(-8)}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 font-medium text-slate-200 text-xs">
                          {transaction.student?.name || transaction.title || 'General'}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-bold text-slate-100 text-sm">
                          ₹{transaction.amount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="py-3 px-4 capitalize text-slate-300 text-xs">
                          {transaction.paymentMethod || 'cash'}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${getStatusColor(transaction.status, isFake)}`}>
                            {isFake ? 'FAKE / REVERTED' : transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(transaction.createdAt || transaction.date || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                              <DropdownMenuItem
                                onClick={() => setViewingTxn(transaction)}
                                className="cursor-pointer hover:bg-slate-800 text-xs py-2"
                              >
                                <FileText className="h-4 w-4 mr-2 text-indigo-400" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-slate-800" />

                              {isFake ? (
                                <div className="px-2 py-2 text-xs text-rose-400 font-semibold flex items-center gap-2 bg-rose-950/30 rounded">
                                  <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
                                  <span>Flagged as Fake Payment</span>
                                </div>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTxnForFake(transaction);
                                    setFakeReason('Payment verification failed: Fake transaction screenshot / Unverified UTR provided.');
                                  }}
                                  className="cursor-pointer text-rose-400 hover:!bg-rose-950/40 hover:!text-rose-300 text-xs py-2 font-bold"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2 text-rose-500" />
                                  Mark as Fake Payment
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MARK AS FAKE CONFIRMATION DIALOG */}
      {selectedTxnForFake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-rose-500/50 p-6 space-y-5 text-slate-100 shadow-2xl shadow-rose-950/60">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mark as Fake Payment</h3>
                  <p className="text-xs text-rose-400 font-medium">Fraud Protocol & Student Warning</p>
                </div>
              </div>
              <button
                onClick={() => !isMarkingFake && setSelectedTxnForFake(null)}
                className="text-slate-400 hover:text-white p-1"
                disabled={isMarkingFake}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Transaction Brief */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-white">{selectedTxnForFake.student?.name || selectedTxnForFake.title || 'Student'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flagged Amount:</span>
                <span className="font-extrabold text-rose-400 text-sm">₹{selectedTxnForFake.amount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference / UTR:</span>
                <span className="font-mono text-slate-300">{selectedTxnForFake.transactionId || selectedTxnForFake.utr || selectedTxnForFake._id}</span>
              </div>
            </div>

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="fakeReason" className="text-xs font-semibold text-slate-300">
                Reason for Flagging as Fake *
              </Label>
              <Textarea
                id="fakeReason"
                rows={3}
                value={fakeReason}
                onChange={(e) => setFakeReason(e.target.value)}
                placeholder="Specify reason (e.g. Bank statement mismatch, edited screenshot, invalid UTR)"
                className="bg-slate-950 border-slate-800 text-xs focus:border-rose-500"
                disabled={isMarkingFake}
              />
            </div>

            {/* Consequences Notice */}
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300/90 space-y-1.5 leading-relaxed">
              <p className="font-bold text-rose-300">Automated Security Actions Taken:</p>
              <p>• Transaction & Payment status will be set to <strong>FAKE</strong>.</p>
              <p>• Student fee status will be immediately reverted to <strong>UNPAID</strong>.</p>
              <p>• A stern <strong>Fraud Warning Email</strong> will be automatically dispatched to the student.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTxnForFake(null)}
                disabled={isMarkingFake}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleMarkAsFake}
                disabled={isMarkingFake || !fakeReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isMarkingFake ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Fraud Flag...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Confirm & Send Warning Mail
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                Transaction Details
              </h3>
              <button onClick={() => setViewingTxn(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-200">{viewingTxn.transactionId || viewingTxn._id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-white">{viewingTxn.student?.name || viewingTxn.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{viewingTxn.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Type:</span>
                <span className="uppercase text-slate-300 font-semibold">{viewingTxn.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(viewingTxn.status, viewingTxn.isFake)}`}>
                  {viewingTxn.isFake ? 'FAKE / FRAUDULENT' : viewingTxn.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Payment Method:</span>
                <span className="capitalize text-slate-300">{viewingTxn.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-300">{new Date(viewingTxn.createdAt || viewingTxn.date || Date.now()).toLocaleString()}</span>
              </div>
              {viewingTxn.isFake && viewingTxn.fakeReason && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 mt-2">
                  <span className="font-bold block mb-1">Fraud Flag Reason:</span>
                  <span>{viewingTxn.fakeReason}</span>
                </div>
              )}
            </div>

            <Button onClick={() => setViewingTxn(null)} className="w-full mt-4" variant="outline">
              Close Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}