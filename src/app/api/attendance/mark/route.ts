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

// Parses time strings like "10:00", "14:00", "06:00 PM", "11:00 PM" to minutes from midnight [0, 1439]
function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');

  const numbersOnly = clean.replace(/[^0-9:]/g, '');
  const [hStr, mStr] = numbersOnly.split(':');
  if (!hStr) return null;

  let hours = parseInt(hStr, 10);
  const minutes = mStr ? parseInt(mStr, 10) : 0;

  if (isNaN(hours)) return null;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return ((hours * 60 + (isNaN(minutes) ? 0 : minutes)) % 1440 + 1440) % 1440;
}

// Helper to check if current time is within shift range (including overnight and 30-min buffer)
function isWithinShiftRange(startTime: string, endTime: string, currentMinutes: number, bufferMins = 30): boolean {
  if (!startTime || !endTime) return true;

  const startTotal = parseTimeToMinutes(startTime);
  const endTotal = parseTimeToMinutes(endTime);

  if (startTotal === null || endTotal === null) return true;

  // 24-hour full day shift
  if ((startTotal === 0 && endTotal >= 1439) || (startTotal === endTotal)) {
    return true;
  }

  let s = startTotal - bufferMins;
  let e = endTotal + bufferMins;

  // If buffer expands to cover 24h
  if (e - s >= 1440) {
    return true;
  }

  const normStart = ((s % 1440) + 1440) % 1440;
  const normEnd = ((e % 1440) + 1440) % 1440;

  if (normStart <= normEnd) {
    return currentMinutes >= normStart && currentMinutes <= normEnd;
  } else {
    // Crosses midnight (e.g., 20:00 to 06:00)
    return currentMinutes >= normStart || currentMinutes <= normEnd;
  }
}

// Check if a specific student matches the current time shift
function checkStudentShiftMatch(student: any, currentMinutes: number) {
  const shifts: { startTime: string; endTime: string }[] = [];
  if (Array.isArray(student.selectedShifts) && student.selectedShifts.length > 0) {
    student.selectedShifts.forEach((s: any) => {
      if (s.startTime && s.endTime) shifts.push({ startTime: s.startTime, endTime: s.endTime });
    });
  }
  if (shifts.length === 0 && student.startTime && student.endTime) {
    shifts.push({ startTime: student.startTime, endTime: student.endTime });
  }

  if (shifts.length === 0) return true; // No shifts defined, matches anytime

  const isWithinAny = shifts.some(s => isWithinShiftRange(s.startTime, s.endTime, currentMinutes, 30));
  const isWithinOverall = student.startTime && student.endTime
    ? isWithinShiftRange(student.startTime, student.endTime, currentMinutes, 30)
    : false;

  return isWithinAny || isWithinOverall;
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
 * Intelligent helper to resolve the right student when a seat is shared by 2 or 3 students across different shifts
 */
async function resolveStudentForSeat({
  seatNumber,
  deviceId,
  studentId,
  action = 'in',
  currentMinutes,
}: {
  seatNumber?: string;
  deviceId?: string;
  studentId?: string;
  action?: 'in' | 'out';
  currentMinutes: number;
}) {
  // 1. Explicit studentId provided
  if (studentId) {
    const s = await Student.findById(studentId);
    if (s && s.isActive) {
      const candidates = s.seatNumber ? await Student.find({ seatNumber: s.seatNumber.toUpperCase(), isActive: true }) : [s];
      return { student: s, candidates };
    }
  }

  // 2. Lookup by deviceId if registered
  if (deviceId) {
    const studentByDev = await Student.findOne({ registeredDeviceId: deviceId, isActive: true });
    if (studentByDev) {
      if (!seatNumber || studentByDev.seatNumber?.toUpperCase() === seatNumber.toUpperCase()) {
        const candidates = studentByDev.seatNumber ? await Student.find({ seatNumber: studentByDev.seatNumber.toUpperCase(), isActive: true }) : [studentByDev];
        return { student: studentByDev, candidates };
      }
    }
  }

  if (!seatNumber) {
    return { student: null, candidates: [] };
  }

  // 3. Find all active students assigned to this seat
  const seatCandidates = await Student.find({
    seatNumber: seatNumber.trim().toUpperCase(),
    isActive: true,
  });

  if (seatCandidates.length === 0) {
    return { student: null, candidates: [] };
  }

  if (seatCandidates.length === 1) {
    return { student: seatCandidates[0], candidates: seatCandidates };
  }

  // Multiple students share this seat (e.g. Morning Arif Ali & Evening Sikandar Kumar):
  
  // A. Check if device is mapped to any candidate
  if (deviceId) {
    const matchedByDev = seatCandidates.find(s => s.registeredDeviceId === deviceId);
    if (matchedByDev) {
      return { student: matchedByDev, candidates: seatCandidates };
    }
  }

  // B. If action is 'out', check which student on this seat has an active unclosed session today
  if (action === 'out') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    for (const candidate of seatCandidates) {
      const activeLog = await Attendance.findOne({
        student: candidate._id,
        date: { $gte: startOfToday },
        status: 'success',
        checkOut: { $exists: false }
      });
      if (activeLog) {
        return { student: candidate, candidates: seatCandidates };
      }
    }
  }

  // C. Match candidate whose shift window covers the current time right now (with 30-min buffer)
  const shiftMatchingCandidates = seatCandidates.filter(candidate =>
    checkStudentShiftMatch(candidate, currentMinutes)
  );

  if (shiftMatchingCandidates.length > 0) {
    return { student: shiftMatchingCandidates[0], candidates: seatCandidates };
  }

  // D. Fallback: return the first candidate
  return { student: seatCandidates[0], candidates: seatCandidates };
}

/**
 * GET: Fetch student attendance status and multi-student candidates on a seat
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;

    if (!deviceId && !studentId) {
      return NextResponse.json({
        success: false,
        notFound: true,
        isDeviceReset: true,
        message: 'No device ID provided.'
      }, { status: 400 });
    }

    let student = null;
    let candidates: any[] = [];

    if (studentId) {
      student = await Student.findById(studentId);
      if (student && student.seatNumber) {
        candidates = await Student.find({ seatNumber: student.seatNumber.toUpperCase(), isActive: true });
      }
    } else if (deviceId) {
      // Look up student by registeredDeviceId directly in DB
      student = await Student.findOne({ registeredDeviceId: deviceId, isActive: true });
      if (student && student.seatNumber) {
        candidates = await Student.find({ seatNumber: student.seatNumber.toUpperCase(), isActive: true });
      }
    }

    // If no student is bound to this device in the DB (e.g. Admin clicked Reset Device or new device)
    if (!student) {
      return NextResponse.json({
        success: false,
        notFound: true,
        isDeviceReset: true,
        message: 'Device is not registered to any student. Please enter seat number.'
      }, { status: 404 });
    }

    // Find today's attendance sessions for this student
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
      : (student.startTime && student.endTime ? [{ startTime: student.startTime, endTime: student.endTime, label: 'Shift 1' }] : []);

    // Format other candidates on the same seat for easy switching if needed
    const otherCandidates = candidates
      .filter(c => c._id.toString() !== student._id.toString())
      .map(c => ({
        id: c._id,
        name: c.name,
        seatNumber: c.seatNumber,
        shifts: (c.selectedShifts && c.selectedShifts.length > 0)
          ? c.selectedShifts
          : [{ startTime: c.startTime || '06:00', endTime: c.endTime || '23:00', label: 'Shift 1' }],
      }));

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
        otherCandidates,
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
 * POST: Mark Check-In ('in') or Check-Out ('out') with Multi-Student Seat Support
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { seatNumber, deviceId, studentId, latitude, longitude, action = 'in' } = body;

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ((request as any).ip || '127.0.0.1');

    if (!seatNumber && !studentId) {
      return NextResponse.json({ success: false, error: 'Seat Number is required' }, { status: 400 });
    }
    if (!deviceId) {
      return NextResponse.json({ success: false, error: 'Device ID is required' }, { status: 400 });
    }

    const isCheckOut = action === 'out';
    const { totalMinutes: currentMinutes, formatted } = getLocalISTTime();

    // Helper to log failed attempts
    const logFailure = async (sId: any, reason: string, statusCode: number) => {
      if (sId) {
        await Attendance.create({
          student: sId,
          date: new Date(),
          checkIn: new Date(),
          seatNumber: seatNumber || '',
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

    // 1. Resolve exact student (handles multiple students assigned to the same seat by shift / device / checkIn status)
    const { student, candidates } = await resolveStudentForSeat({
      seatNumber,
      deviceId,
      studentId,
      action: isCheckOut ? 'out' : 'in',
      currentMinutes,
    });

    if (!student) {
      return logFailure(null, `No student is currently assigned to seat ${seatNumber}`, 404);
    }

    // 2. Check Membership
    if (!student.isActive) {
      return logFailure(student._id, 'Membership Expired. Please renew your membership.', 403);
    }

    // Collect student shifts
    const shiftsToCheck: { startTime: string; endTime: string; label?: string }[] = [];
    if (Array.isArray(student.selectedShifts) && student.selectedShifts.length > 0) {
      student.selectedShifts.forEach((s: any) => {
        if (s.startTime && s.endTime) {
          shiftsToCheck.push({ startTime: s.startTime, endTime: s.endTime, label: s.label });
        }
      });
    }
    if (shiftsToCheck.length === 0 && student.startTime && student.endTime) {
      shiftsToCheck.push({ startTime: student.startTime, endTime: student.endTime, label: 'Shift 1' });
    }

    // ==========================================
    // ACTION: CHECK-OUT (No shift time restriction)
    // ==========================================
    if (isCheckOut) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Find active (unclosed) attendance record for today
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
        // Find most recent attendance today
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

        return logFailure(student._id, `No active check-in found today for ${student.name}. Please mark Check-In first.`, 400);
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
          subject: `Attendance Checked Out: ${student.name} (Seat ${student.seatNumber || seatNumber})`,
          title: `👋 Student Attendance Check-Out`,
          detailsHtml: `
            <p><strong>Student Name:</strong> ${student.name}</p>
            <p><strong>Seat Assigned:</strong> Seat ${student.seatNumber || seatNumber}</p>
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
        student: { id: student._id, name: student.name, seatNumber: student.seatNumber },
        message: `Goodbye ${student.name}! Checked out successfully. Study duration: ${formatDurationText(durationMinutes)}.`,
        duration: durationMinutes
      });
    }

    // ==========================================
    // ACTION: CHECK-IN (Within Shift Window)
    // ==========================================

    // 2.5 Check Time Slot (supports single shift, multiple selectedShifts, and 24h shifts)
    if (shiftsToCheck.length > 0) {
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
        return logFailure(student._id, `Outside Shift Hours for ${student.name}. Shift timing is ${shiftStrings}. (Current IST Time: ${formatted})`, 403);
      }
    }

    // 3. Check Duplicate Attendance / rapid double punch prevention
    const recentAttendance = student.attendance?.some((record: any) => {
      const checkInTime = new Date(record.checkIn || record.date).getTime();
      const diffMinutes = (Date.now() - checkInTime) / (1000 * 60);
      return diffMinutes >= 0 && diffMinutes < 15 && !record.checkOut;
    });

    if (recentAttendance) {
      return logFailure(student._id, `Attendance already marked recently for ${student.name}. You are currently checked in.`, 400);
    }

    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayIST = istDateFormatter.format(new Date());

    const maxShiftsPerDay = Math.max(1, shiftsToCheck.length);
    const todayCheckIns = (student.attendance || []).filter((record: any) => {
      const recDateIST = istDateFormatter.format(new Date(record.date || record.checkIn));
      return recDateIST === todayIST;
    });

    if (todayCheckIns.length >= maxShiftsPerDay && todayCheckIns.every((r: any) => r.checkOut)) {
      return logFailure(student._id, `Daily attendance limit reached for ${student.name} (${todayCheckIns.length}/${maxShiftsPerDay} shift check-ins completed).`, 400);
    }

    // 4. Check Device Registration
    if (student.registeredDeviceId) {
      if (student.registeredDeviceId !== deviceId) {
        return logFailure(student._id, 'Device Mismatch. Attendance must be marked from your registered device.', 403);
      }
    } else {
      // Register this device to the student if no other student has it
      const existingDeviceUser = await Student.findOne({ registeredDeviceId: deviceId });
      if (!existingDeviceUser) {
        student.registeredDeviceId = deviceId;
        await student.save();
      }
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
      seatNumber: student.seatNumber || seatNumber,
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
        subject: `Attendance Checked In: ${student.name} (Seat ${student.seatNumber || seatNumber})`,
        title: `📍 Student Attendance Check-In`,
        detailsHtml: `
          <p><strong>Student Name:</strong> ${student.name}</p>
          <p><strong>Seat Assigned:</strong> Seat ${student.seatNumber || seatNumber}</p>
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
      student: { id: student._id, name: student.name, seatNumber: student.seatNumber },
      message: `Welcome ${student.name}! Attendance verified and marked successfully for Seat ${student.seatNumber || seatNumber}.`,
      warning: warningMessage
    });

  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
