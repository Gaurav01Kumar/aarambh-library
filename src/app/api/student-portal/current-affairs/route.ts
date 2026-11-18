import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyCurrentAffairs from '@/lib/models/DailyCurrentAffairs';
import { generateDailyCurrentAffairsQuizAI } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const examType = (searchParams.get('examType') || 'UPSC Civil Services').trim();

    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    let record = await DailyCurrentAffairs.findOne({ dateKey, examType });

    // Strictly 1 Current Affairs generation per day per examType (cached in MongoDB)
    if (!record) {
      const generated = await generateDailyCurrentAffairsQuizAI({
        examType,
        dateKey,
      });

      record = await DailyCurrentAffairs.findOneAndUpdate(
        { dateKey, examType },
        {
          $set: {
            dateKey,
            examType,
            editorialHighlight: generated.editorialHighlight,
            newsBites: generated.newsBites,
            questions: generated.questions,
            generatedByAI: generated.generatedByAI,
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateKey,
        examType: record.examType,
        editorialHighlight: record.editorialHighlight,
        newsBites: record.newsBites || [],
        questions: record.questions || [],
        generatedByAI: record.generatedByAI,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/student-portal/current-affairs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load daily current affairs' },
      { status: 500 }
    );
  }
}

