import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();

  // IST formatted values
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const istDateOnly = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(now);

  const istTimeOnly = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  return NextResponse.json({
    success: true,
    server: {
      iso: now.toISOString(),
      timestamp: now.getTime(),
      ist: istFormatter.format(now),
      istDate: istDateOnly,
      istTime: istTimeOnly,
      timezone: 'Asia/Kolkata',
      utcOffset: '+05:30',
    },
  });
}
