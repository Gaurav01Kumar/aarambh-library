'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreVertical, Trash2, CreditCard, Clock, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddSubscriptionDialog } from '@/components/add-subscription-dialog';
import { EditSubscriptionDialog } from '@/components/edit-subscription-dialog';

interface Subscription {
  _id: string;
  name: string;
  totalHours: number;
  startTime: string;
  endTime: string;
  regularPrice: number;
  salePrice: number;
  billingCycle: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  allowDiscount: boolean;
  discountRange: string;
  planType: 'free' | 'basic' | 'pro';
  isActive: boolean;
}

function formatTime(timeStr: string) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  if (!h || !m) return timeStr;
  
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions?limit=1000');
      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSubscriptions(subscriptions.filter(s => s._id !== id));
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Subscription Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your library's time-based membership plans</p>
        </div>
        <AddSubscriptionDialog onSubscriptionAdded={fetchSubscriptions} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Price (Reg/Sale)</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-500">Loading plans...</TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-500">No subscription plans found</TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <TableCell className="font-semibold">{sub.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                      {sub.billingCycle}
                    </span>
                  </TableCell>
                  <TableCell>{sub.totalHours || 0} hrs</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={sub.salePrice ? "text-xs line-through text-slate-400" : "font-medium"}>
                        ₹{(sub.regularPrice || 0).toLocaleString()}
                      </span>
                      {sub.salePrice > 0 && (
                        <span className="font-bold text-green-600">
                          ₹{(sub.salePrice || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.allowDiscount ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full w-fit">
                        <Tag className="h-3 w-3" />
                        {sub.discountRange}% allowed
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditSubscriptionDialog subscription={sub} onSubscriptionUpdated={fetchSubscriptions} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(sub._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}