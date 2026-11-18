import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import { generateStudyPlanAI } from '@/lib/openrouter';

interface ExamPayloadItem {
  examName: string;
  examDate: string;
  totalScore: number;
  targetScore: number;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, email, exams, examName, examDate, totalScore, targetScore } = body;

    if (!studentId && !email) {
      return NextResponse.json(
        { success: false, error: 'Student identifier is required' },
        { status: 400 }
      );
    }

    const items: ExamPayloadItem[] = Array.isArray(exams) && exams.length > 0
      ? exams
      : examName && examDate && totalScore && targetScore
      ? [{ examName, examDate, totalScore: Number(totalScore), targetScore: Number(targetScore) }]
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one exam target with date and scores' },
        { status: 400 }
      );
    }

    const query = studentId ? { _id: studentId } : { email: email.trim().toLowerCase() };
    const student = await Student.findOne(query);

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Generate AI study plans for all selected exams in parallel
    const generatedTargets = await Promise.all(
      items.map(async (item) => {
        const parsedTotal = Number(item.totalScore) || 100;
        const parsedTarget = Number(item.targetScore) || 80;
        const cleanName = String(item.examName).trim();

        const studyPlan = await generateStudyPlanAI({
          examName: cleanName,
          examDate: item.examDate,
          totalScore: parsedTotal,
          targetScore: parsedTarget,
          studentName: student.name,
        });

        return {
          examName: cleanName,
          examDate: new Date(item.examDate),
          totalScore: parsedTotal,
          targetScore: parsedTarget,
          isPrimary: false,
          studyPlan,
          createdAt: new Date(),
        };
      })
    );

    const hadNoTargets = !student.examTargets || student.examTargets.length === 0;
    student.examTargets = student.examTargets || [];

    generatedTargets.forEach((t, idx) => {
      if (hadNoTargets && idx === 0) {
        t.isPrimary = true;
      }
      student.examTargets.push(t);
    });

    if (hadNoTargets || !student.targetExam) {
      student.targetExam = generatedTargets[0].examName;
    }

    student.markModified('examTargets');
    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        examTargets: student.examTargets,
        targetExam: student.targetExam,
      },
    });
  } catch (error: any) {
    console.error('Error adding exam target(s):', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save exam target(s)' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const targetId = searchParams.get('targetId');

    if (!studentId || !targetId) {
      return NextResponse.json(
        { success: false, error: 'studentId and targetId are required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    student.examTargets = (student.examTargets || []).filter(
      (t: any) => t._id.toString() !== targetId
    );
    if (student.examTargets.length > 0 && !student.examTargets.some((t: any) => t.isPrimary)) {
      student.examTargets[0].isPrimary = true;
      student.targetExam = student.examTargets[0].examName;
    } else if (student.examTargets.length === 0) {
      student.targetExam = '';
    }

    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        examTargets: student.examTargets,
        targetExam: student.targetExam,
      },
    });
  } catch (error: any) {
    console.error('Error deleting exam target:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete exam target' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, targetId } = body;

    if (!studentId || !targetId) {
      return NextResponse.json(
        { success: false, error: 'studentId and targetId are required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const target = (student.examTargets || []).find(
      (t: any) => t._id.toString() === targetId
    );
    if (!target) {
      return NextResponse.json({ success: false, error: 'Exam target not found' }, { status: 404 });
    }

    const examDateStr = new Date(target.examDate).toISOString().split('T')[0];
    const studyPlan = await generateStudyPlanAI({
      examName: target.examName,
      examDate: examDateStr,
      totalScore: target.totalScore,
      targetScore: target.targetScore,
      studentName: student.name,
    });

    target.studyPlan = studyPlan;
    student.markModified('examTargets');
    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        examTargets: student.examTargets,
      },
    });
  } catch (error: any) {
    console.error('Error regenerating study plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to regenerate study plan' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, targetId, examName, examDate, totalScore, targetScore } = body;

    if (!studentId || !targetId || !examName || !examDate || !totalScore || !targetScore) {
      return NextResponse.json(
        { success: false, error: 'All fields are required to update exam target' },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const target = (student.examTargets || []).find(
      (t: any) => t._id.toString() === targetId
    );
    if (!target) {
      return NextResponse.json({ success: false, error: 'Exam target not found' }, { status: 404 });
    }

    const parsedTotal = Number(totalScore);
    const parsedTarget = Number(targetScore);

    target.examName = examName.trim();
    target.examDate = new Date(examDate);
    target.totalScore = parsedTotal;
    target.targetScore = parsedTarget;
    target.studyPlan = await generateStudyPlanAI({
      examName: target.examName,
      examDate,
      totalScore: parsedTotal,
      targetScore: parsedTarget,
      studentName: student.name,
    });

    if (target.isPrimary) {
      student.targetExam = target.examName;
    }

    student.markModified('examTargets');
    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        examTargets: student.examTargets,
        targetExam: student.targetExam,
      },
    });
  } catch (error: any) {
    console.error('Error updating exam target:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update exam target' },
      { status: 500 }
    );
  }
}
