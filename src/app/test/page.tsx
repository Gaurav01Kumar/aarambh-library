'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestPage() {
  const [tests, setTests] = useState([
    { name: 'MongoDB Connection', status: 'pending', message: '' },
    { name: 'Students API', status: 'pending', message: '' },
    { name: 'Seats API', status: 'pending', message: '' },
    { name: 'Subscriptions API', status: 'pending', message: '' },
    { name: 'QR Code Generation', status: 'pending', message: '' },
    { name: 'Authentication API', status: 'pending', message: '' },
  ]);

  const runTests = async () => {
    // Test MongoDB Connection
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(t => t.name === 'MongoDB Connection' ? { ...t, status: 'success', message: 'Connected successfully' } : t));
      } else {
        setTests(prev => prev.map(t => t.name === 'MongoDB Connection' ? { ...t, status: 'error', message: 'Failed to connect' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'MongoDB Connection' ? { ...t, status: 'error', message: 'Connection error' } : t));
    }

    // Test Students API
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(t => t.name === 'Students API' ? { ...t, status: 'success', message: `Found ${data.data.length} students` } : t));
      } else {
        setTests(prev => prev.map(t => t.name === 'Students API' ? { ...t, status: 'error', message: 'Failed to fetch students' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'Students API' ? { ...t, status: 'error', message: 'API error' } : t));
    }

    // Test Seats API
    try {
      const response = await fetch('/api/seats');
      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(t => t.name === 'Seats API' ? { ...t, status: 'success', message: `Found ${data.data.length} seats` } : t));
      } else {
        setTests(prev => prev.map(t => t.name === 'Seats API' ? { ...t, status: 'error', message: 'Failed to fetch seats' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'Seats API' ? { ...t, status: 'error', message: 'API error' } : t));
    }

    // Test Subscriptions API
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(t => t.name === 'Subscriptions API' ? { ...t, status: 'success', message: `Found ${data.data.length} subscriptions` } : t));
      } else {
        setTests(prev => prev.map(t => t.name === 'Subscriptions API' ? { ...t, status: 'error', message: 'Failed to fetch subscriptions' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'Subscriptions API' ? { ...t, status: error, message: 'API error' } : t));
    }

    // Test QR Code Generation
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const studentId = data.data[0]._id;
        const qrResponse = await fetch(`/api/students/${studentId}/qr-code`, {
          method: 'POST',
        });
        const qrData = await qrResponse.json();
        if (qrData.success) {
          setTests(prev => prev.map(t => t.name === 'QR Code Generation' ? { ...t, status: 'success', message: 'QR code generated successfully' } : t));
        } else {
          setTests(prev => prev.map(t => t.name === 'QR Code Generation' ? { ...t, status: 'error', message: 'Failed to generate QR code' } : t));
        }
      } else {
        setTests(prev => prev.map(t => t.name === 'QR Code Generation' ? { ...t, status: 'warning', message: 'No students to test' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'QR Code Generation' ? { ...t, status: 'error', message: 'QR code error' } : t));
    }

    // Test Authentication API
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'test123',
          phone: '+91 9876543210',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(t => t.name === 'Authentication API' ? { ...t, status: 'success', message: 'Authentication API working' } : t));
      } else {
        setTests(prev => prev.map(t => t.name === 'Authentication API' ? { ...t, status: 'error', message: 'Authentication API error' } : t));
      }
    } catch (error) {
      setTests(prev => prev.map(t => t.name === 'Authentication API' ? { ...t, status: 'error', message: 'Auth API error' } : t));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Test</h1>
        <p className="text-slate-600 dark:text-slate-400">Test all system components</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {test.status === 'pending' && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
                  {test.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {test.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {test.status === 'warning' && <CheckCircle className="h-5 w-5 text-yellow-500" />}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-slate-500">{test.message}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  test.status === 'success' ? 'bg-green-100 text-green-800' :
                  test.status === 'error' ? 'bg-red-100 text-red-800' :
                  test.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {test.status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button onClick={runTests} className="w-full">
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={() => window.location.href = '/dashboard/students'}
              className="w-full"
            >
              Go to Students Page
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/seats'}
              className="w-full"
            >
              Go to Seats Page
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/subscriptions'}
              className="w-full"
            >
              Go to Subscriptions Page
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}