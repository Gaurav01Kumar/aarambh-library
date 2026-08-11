import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/lib/models/Organization';

export async function GET() {
  try {
    await connectDB();
    let org = await Organization.findOne();

    if (!org) {
      org = await Organization.create({
        name: 'Aarambh Library',
        slug: 'aarambh-library',
        email: 'info@aarambhlibrary.com',
        phone: '+91 9876543210',
        settings: {
          totalSeats: 50,
          feeAmount: 1000,
          checkInTime: '09:00',
          checkOutTime: '18:00',
          gracePeriod: 15,
          allowedWifiIps: ['127.0.0.1', '::1'],
          notificationEmails: ['info@aarambhlibrary.com'],
          notificationPreferences: {
            studentRegistration: true,
            attendanceMark: true,
            paymentReceived: true,
            feeReminders: true,
          },
          location: { latitude: 28.6139, longitude: 77.209, radiusMeters: 50 },
        },
      });
    }

    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    let org = await Organization.findOne();
    if (!org) {
      org = new Organization({
        name: body.name || 'Aarambh Library',
        slug: 'aarambh-library',
        email: body.email || 'info@aarambhlibrary.com',
      });
    }

    if (body.name) org.name = body.name;
    if (body.email) org.email = body.email;
    if (body.phone) org.phone = body.phone;
    if (body.address) org.address = body.address;

    if (!org.settings) org.settings = {};

    if (body.totalSeats !== undefined) org.settings.totalSeats = body.totalSeats;
    if (body.feeAmount !== undefined) org.settings.feeAmount = body.feeAmount;
    if (body.checkInTime) org.settings.checkInTime = body.checkInTime;
    if (body.checkOutTime) org.settings.checkOutTime = body.checkOutTime;
    if (body.gracePeriod !== undefined) org.settings.gracePeriod = body.gracePeriod;

    if (body.allowedWifiIps !== undefined) {
      if (typeof body.allowedWifiIps === 'string') {
        org.settings.allowedWifiIps = body.allowedWifiIps.split(',').map((ip: string) => ip.trim()).filter(Boolean);
      } else {
        org.settings.allowedWifiIps = body.allowedWifiIps;
      }
    }

    if (body.notificationEmails !== undefined) {
      if (typeof body.notificationEmails === 'string') {
        org.settings.notificationEmails = body.notificationEmails.split(',').map((e: string) => e.trim()).filter(Boolean);
      } else {
        org.settings.notificationEmails = body.notificationEmails;
      }
    }

    if (body.notificationPreferences) {
      org.settings.notificationPreferences = {
        ...org.settings.notificationPreferences,
        ...body.notificationPreferences,
      };
    }

    if (body.location) {
      org.settings.location = {
        ...org.settings.location,
        ...body.location,
      };
    }

    await org.save();

    return NextResponse.json({ success: true, data: org });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
