'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Database, CreditCard, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your library settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Super Admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="superadmin@library.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Super Admin" disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-slate-500">Receive email notifications for important events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-slate-500">Receive SMS notifications for urgent matters</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Fee Reminders</Label>
              <p className="text-sm text-slate-500">Get notified about fee due dates</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Attendance Alerts</Label>
              <p className="text-sm text-slate-500">Get notified about attendance issues</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Library Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Library Settings
          </CardTitle>
          <CardDescription>Configure library-specific settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total Seats</Label>
              <Input id="totalSeats" type="number" defaultValue="50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeAmount">Default Fee Amount (₹)</Label>
              <Input id="feeAmount" type="number" defaultValue="1000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-In Time</Label>
              <Input id="checkInTime" type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Check-Out Time</Label>
              <Input id="checkOutTime" type="time" defaultValue="18:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gracePeriod">Grace Period (minutes)</Label>
              <Input id="gracePeriod" type="number" defaultValue="15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penaltyAmount">Penalty Amount (₹)</Label>
              <Input id="penaltyAmount" type="number" defaultValue="50" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance & Wi-Fi Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Attendance & Wi-Fi Settings
          </CardTitle>
          <CardDescription>Configure Wi-Fi verification and get the common QR code for student attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allowedWifiIps">Allowed Wi-Fi IP Addresses (Comma separated)</Label>
                <Input id="allowedWifiIps" defaultValue="127.0.0.1, ::1" placeholder="e.g. 192.168.1.1, 10.0.0.1" />
                <p className="text-xs text-slate-500">Students must be connected to a network with one of these public/gateway IPs to mark attendance.</p>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Library Latitude</Label>
                  <Input id="latitude" type="number" step="any" defaultValue="28.6139" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Library Longitude</Label>
                  <Input id="longitude" type="number" step="any" defaultValue="77.2090" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input id="radius" type="number" defaultValue="50" />
                </div>
              </div>
              <p className="text-xs text-slate-500">Students must be physically within this radius to mark attendance via GPS.</p>
            </div>
            
            <div className="w-full md:w-64 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <h3 className="font-semibold mb-2 text-center">Common Attendance QR</h3>
              <p className="text-xs text-slate-500 text-center mb-4">Print and place this at the entrance.</p>
              <div className="bg-white p-2 rounded-lg shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/attendance' : 'https://library.com/attendance')}`}
                  alt="Attendance QR Code"
                  width={150}
                  height={150}
                  className="rounded-md"
                />
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => window.open('/attendance', '_blank')}>
                Open Page
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription & Billing
          </CardTitle>
          <CardDescription>Manage your subscription and payment methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Current Plan</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                Pro
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Your Pro plan renews on April 28, 2024
            </p>
            <div className="flex gap-2">
              <Button variant="outline">Manage Subscription</Button>
              <Button variant="outline">View Invoices</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}