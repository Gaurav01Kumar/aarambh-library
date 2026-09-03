import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Organization from '@/lib/models/Organization';
import Attendance from '@/lib/models/Attendance';

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Helper to check if current time is within shift range (including overnight and 30-min buffer)
function isWithinShiftRange(startTime: string, endTime: string, currentMinutes: number, bufferMins = 30): boolean {
  if (!startTime || !endTime) return true;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return true;

  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  // 24-hour full day shift
  if ((startTotal === 0 && endTotal >= 1439) || (startTotal === endTotal)) {
    return true;
  }

  startTotal -= bufferMins;
  endTotal += bufferMins;

  // If buffer expands to cover 24h
  if (endTotal - startTotal >= 1440) {
    return true;
  }

  const normStart = ((startTotal % 1440) + 1440) % 1440;
  const normEnd = ((endTotal % 1440) + 1440) % 1440;

  if (normStart <= normEnd) {
    return currentMinutes >= normStart && currentMinutes <= normEnd;
  } else {
    // Crosses midnight (e.g., 20:00 to 06:00)
    return currentMinutes >= normStart || currentMinutes <= normEnd;
  }
}

// Get current local IST time
function getLocalISTTime() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hours = Number(parts.find(p => p.type === 'hour')?.value || 0) % 24;
  const minutes = Number(parts.find(p => p.type === 'minute')?.value || 0);
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
  };
}

function formatDurationText(minutes: number): string {
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h === 1 ? '' : 's'}`;
}

/**
 * GET: Fetch student attendance status by deviceId and/or seatNumber
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const seatNumber = searchParams.get('seatNumber');

    if (!deviceId && !seatNumber) {
      return NextResponse.json({ success: false, error: 'Device ID or Seat Number required' }, { status: 400 });
    }

    let student = null;
    if (seatNumber) {
      student = await Student.findOne({ seatNumber: seatNumber.trim().toUpperCase() });
    }
    if (!student && deviceId) {
      student = await Student.findOne({ registeredDeviceId: deviceId });
    }

    if (!student) {
      return NextResponse.json({ success: false, notFound: true, message: 'Student not found' }, { status: 404 });
    }

    // Find today's latest attendance
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayIST = istDateFormatter.format(new Date());

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAttendances = await Attendance.find({
      student: student._id,
      date: { $gte: startOfToday },
      status: 'success'
    }).sort({ checkIn: -1 });

    const activeSession = todayAttendances.find(a => !a.checkOut);
    const lastSession = todayAttendances[0] || null;

    let currentStatus: 'checked_in' | 'checked_out' | 'not_checked_in' = 'not_checked_in';
    if (activeSession) {
      currentStatus = 'checked_in';
    } else if (lastSession && lastSession.checkOut) {
      currentStatus = 'checked_out';
    }

    const shifts = (student.selectedShifts && student.selectedShifts.length > 0)
      ? student.selectedShifts
      : (student.startTime && student.endTime ? [{ startTime: student.startTime, endTime: student.endTime, label: 'Standard Shift' }] : []);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          seatNumber: student.seatNumber,
          startTime: student.startTime,
          endTime: student.endTime,
          selectedShifts: shifts,
          feeStatus: student.feeStatus,
          isActive: student.isActive,
          subscriptionPlan: student.subscriptionPlan,
        },
        currentStatus,
        activeSession: activeSession ? {
          checkIn: activeSession.checkIn,
          id: activeSession._id,
        } : null,
        lastSession: lastSession ? {
          checkIn: lastSession.checkIn,
          checkOut: lastSession.checkOut,
          duration: lastSession.duration,
          id: lastSession._id,
        } : null,
      }
    });

  } catch (error: any) {
    console.error('Error fetching attendance status:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch attendance status' }, { status: 500 });
  }
}

/**
 * POST: Mark Check-In ('in') or Check-Out ('out')
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { seatNumber, deviceId, latitude, longitude, action = 'in' } = body;

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ((request as any).ip || '127.0.0.1');

    if (!seatNumber || !deviceId) {
      return NextResponse.json({ success: false, error: 'Seat Number and Device ID are required' }, { status: 400 });
    }

    const isCheckOut = action === 'out';

    // Helper to log failed attempts
    const logFailure = async (studentId: any, reason: string, statusCode: number) => {
      if (studentId) {
        await Attendance.create({
          student: studentId,
          date: new Date(),
          checkIn: new Date(),
          seatNumber,
          deviceId,
          latitude,
          longitude,
          ipAddress: clientIp,
          status: 'failed',
          failureReason: reason,
        });
      }
      return NextResponse.json({ success: false, error: reason }, { status: statusCode });
    };

    // 1. Find student assigned to this seat
    const student = await Student.findOne({ seatNumber: seatNumber.toUpperCase() });
    
    if (!student) {
      return logFailure(null, `No student is currently assigned to seat ${seatNumber}`, 404);
    }

    // 2. Check Membership
    if (!student.isActive) {
      return logFailure(student._id, 'Membership Expired. Please renew your membership.', 403);
    }

    // Collect all shifts
    const shiftsToCheck: { startTime: string; endTime: string; label?: string }[] = [];
    if (Array.isArray(student.selectedShifts) && student.selectedShifts.length > 0) {
      student.selectedShifts.forEach((s: any) => {
        if (s.startTime && s.endTime) {
          shiftsToCheck.push({ startTime: s.startTime, endTime: s.endTime, label: s.label });
        }
      });
    }
    if (shiftsToCheck.length === 0 && student.startTime && student.endTime) {
      shiftsToCheck.push({ startTime: student.startTime, endTime: student.endTime, label: 'Shift' });
    }

    // ==========================================
    // ACTION: CHECK-OUT (No shift time restriction)
    // ==========================================
    if (isCheckOut) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Find active (unclosed) attendance record for today or recent
      let activeAttendance = await Attendance.findOne({
        student: student._id,
        status: 'success',
        checkOut: { $exists: false }
      }).sort({ checkIn: -1 });

      if (!activeAttendance) {
        activeAttendance = await Attendance.findOne({
          student: student._id,
          date: { $gte: startOfToday },
          status: 'success',
          checkOut: null
        }).sort({ checkIn: -1 });
      }

      if (!activeAttendance) {
        // Find most recent attendance today even if closed, to prevent error
        const recentToday = await Attendance.findOne({
          student: student._id,
          date: { $gte: startOfToday },
          status: 'success'
        }).sort({ checkIn: -1 });

        if (recentToday && recentToday.checkOut) {
          return NextResponse.json({
            success: true,
            message: `You are already checked out at ${new Date(recentToday.checkOut).toLocaleTimeString('en-IN')}.`,
            action: 'out',
            duration: recentToday.duration
          });
        }

        return logFailure(student._id, 'No active check-in session found for today. Please mark Check-In first.', 400);
      }

      const checkOutTime = new Date();
      const checkInTime = new Date(activeAttendance.checkIn);
      const durationMinutes = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));

      activeAttendance.checkOut = checkOutTime;
      activeAttendance.duration = durationMinutes;
      activeAttendance.checkOutMethod = 'qr';
      await activeAttendance.save();

      // Update in student's embedded attendance array
      if (Array.isArray(student.attendance) && student.attendance.length > 0) {
        const lastRec = student.attendance[student.attendance.length - 1];
        if (lastRec && !lastRec.checkOut) {
          lastRec.checkOut = checkOutTime;
          lastRec.duration = durationMinutes;
        } else {
          student.attendance.push({
            date: checkInTime,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            duration: durationMinutes,
          });
        }
        await student.save();
      }

      // Trigger Admin Check-Out Email Notification
      try {
        const { sendAdminNotification } = await import('@/lib/email');
        sendAdminNotification({
          eventType: 'attendanceMark',
          subject: `Attendance Checked Out: ${student.name} (Seat ${seatNumber})`,
          title: `👋 Student Attendance Check-Out`,
          detailsHtml: `
            <p><strong>Student Name:</strong> ${student.name}</p>
            <p><strong>Seat Assigned:</strong> Seat ${seatNumber}</p>
            <p><strong>Check-In Time:</strong> ${checkInTime.toLocaleTimeString('en-IN')}</p>
            <p><strong>Check-Out Time:</strong> ${checkOutTime.toLocaleTimeString('en-IN')}</p>
            <p><strong>Session Duration:</strong> ${formatDurationText(durationMinutes)}</p>
          `,
        }).catch(err => console.error('Admin notification check-out error:', err));
      } catch (err) {
        console.error('Failed to dispatch check-out notification:', err);
      }

      return NextResponse.json({
        success: true,
        action: 'out',
        message: `Goodbye ${student.name}! Checked out successfully. Study duration: ${formatDurationText(durationMinutes)}.`,
        duration: durationMinutes
      });
    }

    // ==========================================
    // ACTION: CHECK-IN (Within Shift Window)
    // ==========================================

    // 2.5 Check Time Slot (supports single shift, multiple selectedShifts, and 24h shifts)
    if (shiftsToCheck.length > 0) {
      const { totalMinutes: currentMinutes, formatted } = getLocalISTTime();

      const isWithinAnyShift = shiftsToCheck.some(shift =>
        isWithinShiftRange(shift.startTime, shift.endTime, currentMinutes, 30)
      );

      const isWithinOverall = student.startTime && student.endTime
        ? isWithinShiftRange(student.startTime, student.endTime, currentMinutes, 30)
        : false;

      if (!isWithinAnyShift && !isWithinOverall) {
        const shiftStrings = shiftsToCheck.map(s => 
          s.label ? `${s.label} (${s.startTime} to ${s.endTime})` : `${s.startTime} to ${s.endTime}`
        ).join(', ');
        return logFailure(student._id, `Outside Shift Hours. Your shift is ${shiftStrings}. (Current IST Time: ${formatted})`, 403);
      }
    }

    // 3. Check Duplicate Attendance / rapid double punch prevention
    const recentAttendance = student.attendance?.some((record: any) => {
      const checkInTime = new Date(record.checkIn || record.date).getTime();
      const diffMinutes = (Date.now() - checkInTime) / (1000 * 60);
      return diffMinutes >= 0 && diffMinutes < 15 && !record.checkOut;
    });

    if (recentAttendance) {
      return logFailure(student._id, 'Attendance already marked recently. You are currently checked in.', 400);
    }

    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayIST = istDateFormatter.format(new Date());

    const maxShiftsPerDay = Math.max(1, shiftsToCheck.length);
    const todayCheckIns = (student.attendance || []).filter((record: any) => {
      const recDateIST = istDateFormatter.format(new Date(record.date || record.checkIn));
      return recDateIST === todayIST;
    });

    if (todayCheckIns.length >= maxShiftsPerDay && todayCheckIns.every((r: any) => r.checkOut)) {
      return logFailure(student._id, `Attendance limit reached for today (${todayCheckIns.length}/${maxShiftsPerDay} shift check-ins completed).`, 400);
    }

    // 4. Check Device Registration
    if (student.registeredDeviceId) {
      if (student.registeredDeviceId !== deviceId) {
        return logFailure(student._id, 'Device Mismatch. Attendance must be marked from your registered device.', 403);
      }
    } else {
      // Register this device to the student if no other student has it
      const existingDeviceUser = await Student.findOne({ registeredDeviceId: deviceId });
      if (existingDeviceUser) {
        return logFailure(student._id, 'This device is already registered to another student.', 403);
      }
      student.registeredDeviceId = deviceId;
      await student.save();
    }

    // Fetch Org settings for GPS and Wi-Fi checks
    const org = await Organization.findOne();

    // 5. Check Wi-Fi IP
    if (org && org.settings?.allowedWifiIps && org.settings.allowedWifiIps.length > 0) {
      const allowedIps: string[] = org.settings.allowedWifiIps.flatMap((ipList: string) => ipList.split(',').map((ip: string) => ip.trim()));
      
      const isAllowed = 
        allowedIps.includes(clientIp) || 
        allowedIps.includes('0.0.0.0') || 
        allowedIps.includes('*') || 
        clientIp === '127.0.0.1' || 
        clientIp === '::1' || 
        clientIp === 'localhost';

      if (!isAllowed) {
        return logFailure(student._id, 'Security Alert: You are not connected to the authorized Library Wi-Fi.', 403);
      }
    }

    // 6. Check GPS Coordinates
    if (org && org.location?.latitude && org.location?.longitude && org.location?.radiusMeters > 0) {
      if (!latitude || !longitude) {
        return logFailure(student._id, 'GPS Coordinates missing. Please allow location access.', 400);
      }

      const distance = getDistanceFromLatLonInM(
        org.location.latitude,
        org.location.longitude,
        latitude,
        longitude
      );

      if (distance > org.location.radiusMeters) {
        return logFailure(student._id, `GPS Check Failed: You are ${Math.round(distance)} meters away from the library. Must be within ${org.location.radiusMeters}m.`, 403);
      }
    }

    // All checks passed - Mark Attendance IN
    await Attendance.create({
      student: student._id,
      date: new Date(),
      checkIn: new Date(),
      seatNumber,
      deviceId,
      latitude,
      longitude,
      ipAddress: clientIp,
      status: 'success',
      checkInMethod: 'qr',
    });

    if (!student.attendance) {
      student.attendance = [];
    }
    student.attendance.push({
      date: new Date(),
      checkIn: new Date(),
    });
    await student.save();

    // Trigger Admin Notification Email
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      sendAdminNotification({
        eventType: 'attendanceMark',
        subject: `Attendance Checked In: ${student.name} (Seat ${seatNumber})`,
        title: `📍 Student Attendance Check-In`,
        detailsHtml: `
          <p><strong>Student Name:</strong> ${student.name}</p>
          <p><strong>Seat Assigned:</strong> Seat ${seatNumber}</p>
          <p><strong>Check-In Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</p>
          <p><strong>Fee Status:</strong> <span style="font-weight:bold; color:${student.feeStatus === 'paid' ? '#16a34a' : '#dc2626'}">${student.feeStatus.toUpperCase()}</span></p>
        `,
      }).catch(err => console.error('Admin notification error:', err));
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
    }

    let warningMessage = undefined;
    if (student.feeStatus === 'unpaid' || student.feeStatus === 'partial') {
      warningMessage = 'Payment Reminder: Your library fee is pending. Please complete your payment.';
    }

    return NextResponse.json({ 
      success: true, 
      action: 'in',
      message: `Welcome ${student.name}! Attendance verified and marked successfully.`,
      warning: warningMessage
    });

  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
