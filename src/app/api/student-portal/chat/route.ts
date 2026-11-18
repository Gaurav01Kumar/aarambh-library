import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudyChatMessage from '@/lib/models/StudyChatMessage';
import { chatWithStudyMateAI } from '@/lib/openrouter';

const DAILY_CHAT_LIMIT = 5;

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
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

    const { start, end } = getTodayRange();
    const [messages, todayQuestionCount] = await Promise.all([
      StudyChatMessage.find({ studentId }).sort({ createdAt: 1 }).limit(100),
      StudyChatMessage.countDocuments({
        studentId,
        role: 'user',
        createdAt: { $gte: start, $lte: end },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: messages,
      quota: {
        dailyLimit: DAILY_CHAT_LIMIT,
        todayCount: todayQuestionCount,
        remainingToday: Math.max(0, DAILY_CHAT_LIMIT - todayQuestionCount),
      },
    });
  } catch (error: any) {
    console.error('Error fetching study chat history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load chat history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, studentEmail, studentName, targetExam, message, language } = body;

    if (!studentId || !studentEmail || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'studentId, studentEmail, and message are required' },
        { status: 400 }
      );
    }

    const { start, end } = getTodayRange();
    const todayQuestionCount = await StudyChatMessage.countDocuments({
      studentId,
      role: 'user',
      createdAt: { $gte: start, $lte: end },
    });

    if (todayQuestionCount >= DAILY_CHAT_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily limit reached (${DAILY_CHAT_LIMIT}/${DAILY_CHAT_LIMIT} questions). You can ask up to ${DAILY_CHAT_LIMIT} questions per day in Study Mate AI.`,
        },
        { status: 429 }
      );
    }

    const recentMessages = await StudyChatMessage.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    const history = recentMessages
      .reverse()
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const userMsgDoc = await StudyChatMessage.create({
      studentId,
      studentEmail: studentEmail.trim().toLowerCase(),
      role: 'user',
      content: message.trim(),
      language: language || 'English',
    });

    const aiReply = await chatWithStudyMateAI({
      history,
      userMessage: message.trim(),
      studentName,
      targetExam,
      language: language || 'English',
    });

    const assistantMsgDoc = await StudyChatMessage.create({
      studentId,
      studentEmail: studentEmail.trim().toLowerCase(),
      role: 'assistant',
      content: aiReply,
      language: language || 'English',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          userMessage: userMsgDoc,
          assistantMessage: assistantMsgDoc,
          remainingToday: Math.max(0, DAILY_CHAT_LIMIT - (todayQuestionCount + 1)),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in Study Mate chat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }

    await StudyChatMessage.deleteMany({ studentId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
