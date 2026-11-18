import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentNote from '@/lib/models/StudentNote';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!studentId && !email) {
      return NextResponse.json(
        { success: false, error: 'studentId or email is required' },
        { status: 400 }
      );
    }

    const query = studentId ? { studentId } : { studentEmail: email };
    const notes = await StudentNote.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching student notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, studentEmail, title, subject, examTag, content } = body;

    if (!studentId || !studentEmail || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and note content are required' },
        { status: 400 }
      );
    }

    const note = await StudentNote.create({
      studentId,
      studentEmail: studentEmail.trim().toLowerCase(),
      title: title.trim(),
      subject: (subject || 'General').trim(),
      examTag: (examTag || '').trim(),
      content: content.trim(),
    });

    return NextResponse.json(
      { success: true, data: note },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating student note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    await StudentNote.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting student note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, title, subject, examTag, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Note ID, title, and content are required' },
        { status: 400 }
      );
    }

    const updated = await StudentNote.findByIdAndUpdate(
      id,
      {
        $set: {
          title: title.trim(),
          subject: (subject || 'General').trim(),
          examTag: (examTag || '').trim(),
          content: content.trim(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating student note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update note' },
      { status: 500 }
    );
  }
}

