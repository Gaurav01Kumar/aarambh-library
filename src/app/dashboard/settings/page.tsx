'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Shield, Database, CreditCard, Save, Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: 'Super Admin',
    email: 'info@aarambhlibrary.com',
    phone: '+91 9876543210',
  });

  const [notificationEmails, setNotificationEmails] = useState(
    'info@aarambhlibrary.com, admin@aarambhlibrary.com'
  );

  const [notificationPreferences, setNotificationPreferences] = useState({
    studentRegistration: true,
    attendanceMark: true,
    paymentReceived: true,
    feeReminders: true,
  });

  const [librarySettings, setLibrarySettings] = useState({
    totalSeats: 50,
    feeAmount: 1000,
    checkInTime: '09:00',
    checkOutTime: '18:00',
    gracePeriod: 15,
    allowedWifiIps: '127.0.0.1, ::1',
    latitude: 28.6139,
    longitude: 77.209,
    radiusMeters: 50,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        const org = data.data;
        if (org.email) setProfile(prev => ({ ...prev, email: org.email }));
        if (org.name) setProfile(prev => ({ ...prev, name: org.name }));
        if (org.phone) setProfile(prev => ({ ...prev, phone: org.phone }));

        if (org.settings) {
          const s = org.settings;
          if (s.notificationEmails && Array.isArray(s.notificationEmails)) {
            setNotificationEmails(s.notificationEmails.join(', '));
          }
          if (s.notificationPreferences) {
            setNotificationPreferences({
              studentRegistration: s.notificationPreferences.studentRegistration !== false,
              attendanceMark: s.notificationPreferences.attendanceMark !== false,
              paymentReceived: s.notificationPreferences.paymentReceived !== false,
              feeReminders: s.notificationPreferences.feeReminders !== false,
            });
          }

          setLibrarySettings({
            totalSeats: s.totalSeats || 50,
            feeAmount: s.feeAmount || 1000,
            checkInTime: s.checkInTime || '09:00',
            checkOutTime: s.checkOutTime || '18:00',
            gracePeriod: s.gracePeriod || 15,
            allowedWifiIps: Array.isArray(s.allowedWifiIps) ? s.allowedWifiIps.join(', ') : '127.0.0.1, ::1',
            latitude: s.location?.latitude || 28.6139,
            longitude: s.location?.longitude || 77.209,
            radiusMeters: s.location?.radiusMeters || 50,
          });
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          notificationEmails,
          notificationPreferences,
          totalSeats: Number(librarySettings.totalSeats),
          feeAmount: Number(librarySettings.feeAmount),
          checkInTime: librarySettings.checkInTime,
          checkOutTime: librarySettings.checkOutTime,
          gracePeriod: Number(librarySettings.gracePeriod),
          allowedWifiIps: librarySettings.allowedWifiIps,
          location: {
            latitude: Number(librarySettings.latitude),
            longitude: Number(librarySettings.longitude),
            radiusMeters: Number(librarySettings.radiusMeters),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your library settings and email notification preferences</p>
        </div>
        <Button onClick={() => handleSaveSettings()} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
              Saved Successfully!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>

      {/* Admin Notification Email Settings */}
      <Card className="border-indigo-200 dark:border-indigo-900/50 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Mail className="h-5 w-5" />
            Admin Notification Email Recipients (Hostinger Webmail)
          </CardTitle>
          <CardDescription>
            Configure multiple email addresses to receive real-time admin alerts for all student activities, attendance check-ins, fee payments, and reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="notificationEmails" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Notification Email Addresses (Comma Separated)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                Multiple Emails Supported
              </span>
            </Label>
            <Input
              id="notificationEmails"
              value={notificationEmails}
              onChange={(e) => setNotificationEmails(e.target.value)}
              placeholder="e.g. info@aarambhlibrary.com, manager@aarambhlibrary.com, owner@gmail.com"
              className="font-mono text-sm bg-white dark:bg-slate-900"
            />
            <p className="text-xs text-slate-500">
              Separated by commas. All entered email addresses will receive instant notification emails via Hostinger Webmail SMTP (<code className="text-indigo-600 font-semibold">smtp.hostinger.com</code>).
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Event Alert Preferences
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <Label className="font-semibold">Student Self-Registration</Label>
                  <p className="text-xs text-slate-500">Send email when a new student registers online</p>
                </div>
                <Switch
                  checked={notificationPreferences.studentRegistration}
                  onCheckedChange={(val) =>
                    setNotificationPreferences(prev => ({ ...prev, studentRegistration: val }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <Label className="font-semibold">Daily Attendance Check-Ins</Label>
                  <p className="text-xs text-slate-500">Send alert when students mark QR/GPS attendance</p>
                </div>
                <Switch
                  checked={notificationPreferences.attendanceMark}
                  onCheckedChange={(val) =>
                    setNotificationPreferences(prev => ({ ...prev, attendanceMark: val }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <Label className="font-semibold">Payment Received Alerts</Label>
                  <p className="text-xs text-slate-500">Send alert when fee payments are collected</p>
                </div>
                <Switch
                  checked={notificationPreferences.paymentReceived}
                  onCheckedChange={(val) =>
                    setNotificationPreferences(prev => ({ ...prev, paymentReceived: val }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <Label className="font-semibold">Fee Reminders & Expiry Alerts</Label>
                  <p className="text-xs text-slate-500">Send summary alert when fee reminders run</p>
                </div>
                <Switch
                  checked={notificationPreferences.feeReminders}
                  onCheckedChange={(val) =>
                    setNotificationPreferences(prev => ({ ...prev, feeReminders: val }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Organization Info
          </CardTitle>
          <CardDescription>Update your personal and organization contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Library Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Primary Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Library Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Library Operational Settings
          </CardTitle>
          <CardDescription>Configure total seating capacity and shift timings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total Seats</Label>
              <Input
                id="totalSeats"
                type="number"
                value={librarySettings.totalSeats}
                onChange={(e) => setLibrarySettings({ ...librarySettings, totalSeats: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeAmount">Default Fee Amount (₹)</Label>
              <Input
                id="feeAmount"
                type="number"
                value={librarySettings.feeAmount}
                onChange={(e) => setLibrarySettings({ ...librarySettings, feeAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Default Check-In Time</Label>
              <Input
                id="checkInTime"
                type="time"
                value={librarySettings.checkInTime}
                onChange={(e) => setLibrarySettings({ ...librarySettings, checkInTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Default Check-Out Time</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={librarySettings.checkOutTime}
                onChange={(e) => setLibrarySettings({ ...librarySettings, checkOutTime: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance & Wi-Fi Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Attendance Wi-Fi & GPS Verification Settings
          </CardTitle>
          <CardDescription>Configure Wi-Fi verification and physical GPS location boundaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allowedWifiIps">Allowed Wi-Fi IP Addresses (Comma separated)</Label>
                <Input
                  id="allowedWifiIps"
                  value={librarySettings.allowedWifiIps}
                  onChange={(e) => setLibrarySettings({ ...librarySettings, allowedWifiIps: e.target.value })}
                  placeholder="e.g. 192.168.1.1, 10.0.0.1"
                />
                <p className="text-xs text-slate-500">Students must be connected to a network with one of these public/gateway IPs to mark attendance.</p>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Library Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={librarySettings.latitude}
                    onChange={(e) => setLibrarySettings({ ...librarySettings, latitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Library Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={librarySettings.longitude}
                    onChange={(e) => setLibrarySettings({ ...librarySettings, longitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={librarySettings.radiusMeters}
                    onChange={(e) => setLibrarySettings({ ...librarySettings, radiusMeters: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <h3 className="font-semibold mb-2 text-center text-sm">Common Attendance QR</h3>
              <p className="text-xs text-slate-500 text-center mb-4">Print and place this at the entrance.</p>
              <div className="bg-white p-2 rounded-lg shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/attendance' : 'https://aarambhlibrary.com/attendance')}`}
                  alt="Attendance QR Code"
                  width={150}
                  height={150}
                  className="rounded-md"
                />
              </div>
              <Button variant="outline" className="mt-4 w-full text-xs" onClick={() => window.open('/attendance', '_blank')}>
                Open Scanner Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button Footer */}
      <div className="flex justify-end pt-4 pb-8">
        <Button size="lg" onClick={() => handleSaveSettings()} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 text-base">
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Saving Settings...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-400" />
              Settings Saved!
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}