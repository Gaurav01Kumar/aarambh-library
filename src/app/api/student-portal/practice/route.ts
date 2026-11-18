import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeAttempt from '@/lib/models/PracticeAttempt';
import { generatePracticeQuizAI } from '@/lib/openrouter';

const DAILY_PRACTICE_LIMIT = 2;

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const dateKey = getTodayKey();
    const attempts = await PracticeAttempt.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(30);

    const todayCount = attempts.filter((a: any) => a.dateKey === dateKey).length;
    const completed = attempts.filter((a: any) => a.status === 'completed');

    const avgAccuracy =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum: number, a: any) => sum + (a.accuracyPercent || 0), 0) /
              completed.length
          )
        : 0;

    const bestScore =
      completed.length > 0
        ? Math.max(...completed.map((a: any) => a.score || 0))
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        attempts,
        dailyLimit: DAILY_PRACTICE_LIMIT,
        todayCount,
        remainingToday: Math.max(0, DAILY_PRACTICE_LIMIT - todayCount),
        stats: {
          totalAttempts: attempts.length,
          completedAttempts: completed.length,
          avgAccuracy,
          bestScore,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching practice history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load practice history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, studentEmail, examType } = body;

    if (!studentId || !studentEmail) {
      return NextResponse.json(
        { success: false, error: 'studentId and studentEmail are required' },
        { status: 400 }
      );
    }

    const dateKey = getTodayKey();
    const todayCount = await PracticeAttempt.countDocuments({ studentId, dateKey });

    if (todayCount >= DAILY_PRACTICE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily limit reached (${DAILY_PRACTICE_LIMIT}/${DAILY_PRACTICE_LIMIT}). You can generate up to ${DAILY_PRACTICE_LIMIT} practice quizzes per day. Review your past attempts below!`,
        },
        { status: 429 }
      );
    }

    const cleanExam = (examType || 'UPSC CSE').trim();
    const generated = await generatePracticeQuizAI({
      examType: cleanExam,
      dateKey,
      attemptNumber: todayCount + 1,
    });

    const attempt = await PracticeAttempt.create({
      studentId,
      studentEmail: studentEmail.trim().toLowerCase(),
      dateKey,
      examType: cleanExam,
      questions: generated.questions,
      totalQuestions: generated.questions.length,
      status: 'in_progress',
      generatedByAI: generated.generatedByAI,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          attempt,
          remainingToday: Math.max(0, DAILY_PRACTICE_LIMIT - (todayCount + 1)),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error generating practice quiz:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate practice quiz' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { attemptId, userAnswers } = body;

    if (!attemptId || !userAnswers) {
      return NextResponse.json(
        { success: false, error: 'attemptId and userAnswers are required' },
        { status: 400 }
      );
    }

    const attempt = await PracticeAttempt.findById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Practice attempt not found' },
        { status: 404 }
      );
    }

    const questions = attempt.questions || [];
    let score = 0;
    questions.forEach((q: any) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });

    const total = Math.max(1, questions.length);
    const accuracyPercent = Math.round((score / total) * 100);

    attempt.userAnswers = userAnswers;
    attempt.score = score;
    attempt.totalQuestions = total;
    attempt.accuracyPercent = accuracyPercent;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.markModified('userAnswers');
    await attempt.save();

    return NextResponse.json({
      success: true,
      data: attempt,
    });
  } catch (error: any) {
    console.error('Error submitting practice attempt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit practice attempt' },
      { status: 500 }
    );
  }
}

