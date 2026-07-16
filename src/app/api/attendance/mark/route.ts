import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Organization from '@/lib/models/Organization';
import Attendance from '@/lib/models/Attendance';

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2-lat1);  
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { seatNumber, deviceId, latitude, longitude } = body;

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.ip || '127.0.0.1');

    if (!seatNumber || !deviceId) {
      return NextResponse.json({ success: false, error: 'Seat Number and Device ID are required' }, { status: 400 });
    }

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

    // 2.5 Check Time Slot
    if (student.startTime && student.endTime) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = student.startTime.split(':').map(Number);
      const [endH, endM] = student.endTime.split(':').map(Number);
      
      let startTotal = startH * 60 + startM;
      let endTotal = endH * 60 + endM;
      
      // Allow 30 mins buffer before start and after end
      startTotal -= 30;
      endTotal += 30;
      
      if (startTotal < 0) startTotal += 1440;
      if (endTotal >= 1440) endTotal -= 1440;
      
      let isWithinTime = false;
      if (startTotal <= endTotal) {
        isWithinTime = currentMinutes >= startTotal && currentMinutes <= endTotal;
      } else {
        isWithinTime = currentMinutes >= startTotal || currentMinutes <= endTotal;
      }
      
      if (!isWithinTime) {
        return logFailure(student._id, `Outside Shift Hours. Your shift is ${student.startTime} to ${student.endTime}.`, 403);
      }
    }

    // 3. Check Duplicate Attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasAttendedToday = student.attendance?.some((record: any) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    if (hasAttendedToday) {
      return logFailure(student._id, 'Attendance already marked for today.', 400);
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
      
      if (!allowedIps.includes(clientIp) && !allowedIps.includes('0.0.0.0')) {
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

    // A. Create the robust log
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
    });

    // B. Push to student array for backward compatibility
    if (!student.attendance) {
      student.attendance = [];
    }
    student.attendance.push({
      date: new Date(),
      checkIn: new Date(),
    });
    await student.save();

    let warningMessage = undefined;
    if (student.feeStatus === 'unpaid' || student.feeStatus === 'partial') {
      warningMessage = 'Payment Reminder: Your library fee is pending. Please complete your payment.';
    }

    return NextResponse.json({ 
      success: true, 
      message: `Welcome ${student.name}! Attendance verified and marked successfully.`,
      warning: warningMessage
    });

  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
