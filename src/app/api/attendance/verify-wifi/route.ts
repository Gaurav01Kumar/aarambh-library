import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.ip || '127.0.0.1');

    // Get the organization settings (assuming single tenant/org for now)
    const org = await Organization.findOne();
    
    if (!org || !org.settings?.allowedWifiIps || org.settings.allowedWifiIps.length === 0) {
      // If no IPs configured, maybe allow by default or block? Let's allow for ease of setup.
      return NextResponse.json({ success: true, ip: clientIp, warning: 'No Wi-Fi IPs configured in settings. Allowing by default.' });
    }

    const allowedIps: string[] = org.settings.allowedWifiIps.flatMap((ipList: string) => ipList.split(',').map(ip => ip.trim()));

    // Check if client IP is in the allowed list
    if (allowedIps.includes(clientIp) || allowedIps.includes('0.0.0.0')) {
      return NextResponse.json({ success: true, ip: clientIp });
    }

    // IP not allowed
    return NextResponse.json({ 
      success: false, 
      error: `Your device IP (${clientIp}) is not connected to the authorized Library Wi-Fi.` 
    }, { status: 403 });

  } catch (error) {
    console.error('Error verifying Wi-Fi:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
