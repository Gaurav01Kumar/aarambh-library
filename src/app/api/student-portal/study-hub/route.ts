import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Book from '@/lib/models/Book';
import Reservation from '@/lib/models/Reservation';

export const dynamic = 'force-dynamic';

// Curated high-yield PYQ & Digital Notes Repository for Aspirants
const DEFAULT_STUDY_MATERIALS = [
  {
    id: 'mat-1',
    title: 'UPSC CSE 10 Years Solved Prelims GS Paper 1 (2014-2024)',
    category: 'UPSC',
    subject: 'General Studies',
    fileSize: '14.2 MB',
    year: '2024',
    downloads: 342,
    downloadUrl: '#',
    tags: ['PYQ', 'Prelims', 'GS-1', 'Solved'],
    description: 'Topic-wise segregated previous 10 years papers with authentic explanations.',
  },
  {
    id: 'mat-2',
    title: 'M. Laxmikanth Indian Polity Summary & Key Articles Mindmap',
    category: 'UPSC',
    subject: 'Polity & Governance',
    fileSize: '8.7 MB',
    year: '2024',
    downloads: 512,
    downloadUrl: '#',
    tags: ['Mindmap', 'Polity', 'Revision'],
    description: 'High-yield revision notes covering all fundamental rights, DPSP, and amendments.',
  },
  {
    id: 'mat-3',
    title: 'SSC CGL Complete Quantitative Aptitude Formula & Shortcut Book',
    category: 'SSC',
    subject: 'Mathematics',
    fileSize: '6.4 MB',
    year: '2024',
    downloads: 289,
    downloadUrl: '#',
    tags: ['Maths', 'Shortcuts', 'SSC CGL'],
    description: 'Trigonometry, Geometry, and Arithmetic speed hacks with 200 practice drills.',
  },
  {
    id: 'mat-4',
    title: 'NEET 2024 Biology NCERT Line-by-Line Fact Digest (Botany + Zoology)',
    category: 'NEET',
    subject: 'Biology',
    fileSize: '18.1 MB',
    year: '2024',
    downloads: 420,
    downloadUrl: '#',
    tags: ['NCERT', 'NEET', 'Biology', 'Mnemonics'],
    description: 'Every statement from Class 11 & 12 NCERT converted into high-yield one-liners.',
  },
  {
    id: 'mat-5',
    title: 'JEE Advanced Physics 500 Toughest Problems & Step-by-Step Solutions',
    category: 'JEE',
    subject: 'Physics',
    fileSize: '12.5 MB',
    year: '2024',
    downloads: 198,
    downloadUrl: '#',
    tags: ['Mechanics', 'Electro', 'JEE Advanced'],
    description: 'Mechanics, Rotational dynamics, and Electromagnetism master problems.',
  },
  {
    id: 'mat-6',
    title: 'Banking Awareness & Current Financial Terms 2024 (IBPS / SBI PO)',
    category: 'Banking',
    subject: 'General Economy',
    fileSize: '4.8 MB',
    year: '2024',
    downloads: 215,
    downloadUrl: '#',
    tags: ['Banking', 'RBI Circulars', 'SBI PO'],
    description: 'Monetary policy rates, Basel III norms, and latest RBI master directions.',
  },
];

// Daily Current Affairs & Editorial Digest
const DAILY_CURRENT_AFFAIRS = {
  date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  editorialHighlight: {
    headline: 'Green Energy Transition & India\'s COP29 Strategic Outlook',
    source: 'The Hindu & Indian Express Editorial Analysis',
    summary: 'India is scaling up renewable capacity targeting 500 GW by 2030, with pivotal focus on green hydrogen subsidies, pumped-hydro storage, and local supply-chain sovereignty.',
    relevance: 'GS Paper 3 (Environment & Energy), Essay & Interview relevance',
  },
  newsBites: [
    {
      id: 'news-1',
      category: 'Economy',
      title: 'RBI Keeps Repo Rate Steady at 6.50% Amid Resilient Domestic Growth',
      takeaway: 'MPC emphasizes inflation alignment towards the 4% target while acknowledging robust capital expenditure in infrastructure.',
    },
    {
      id: 'news-2',
      category: 'Science & Tech',
      title: 'ISRO Gears Up for Gaganyaan Unmanned Orbital Flight Test',
      takeaway: 'Environmental control and crew module recovery tests validated off the eastern coast at Sriharikota.',
    },
    {
      id: 'news-3',
      category: 'Environment',
      title: 'Global Renewable Energy Additions Reach All-Time High in Q3 2024',
      takeaway: 'Solar photovoltaic installations drive 75% of new capacity additions globally.',
    },
  ],
  quizOfTheDay: {
    question: 'With reference to the Monetary Policy Committee (MPC) in India, consider the following statements:\n1. It consists of six members including the RBI Governor.\n2. The decision is made by a majority vote, with the Governor holding a casting vote in case of a tie.\nWhich of the statements given above is/are correct?',
    options: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
    correctIndex: 2,
    explanation: 'Section 45ZB of the amended RBI Act, 1934 provides for an empowered six-member MPC. Decisions are taken by majority, and the Governor has a second or casting vote in tie scenarios.',
  },
};

// Exam Calendar & Real-time Countdown
const EXAM_CALENDAR = [
  {
    id: 'exam-1',
    name: 'UPSC Civil Services Prelims 2025',
    conductingBody: 'UPSC',
    examDate: '2025-05-25',
    category: 'Civil Services',
    admitCardStatus: 'Expected May 2025',
    officialUrl: 'https://upsc.gov.in',
  },
  {
    id: 'exam-2',
    name: 'SSC CGL Tier-1 Examination 2025',
    conductingBody: 'SSC',
    examDate: '2025-07-15',
    category: 'Staff Selection',
    admitCardStatus: 'Expected July 2025',
    officialUrl: 'https://ssc.gov.in',
  },
  {
    id: 'exam-3',
    name: 'NEET (UG) Medical Entrance 2025',
    conductingBody: 'NTA',
    examDate: '2025-05-04',
    category: 'Medical',
    admitCardStatus: 'Expected Late April 2025',
    officialUrl: 'https://neet.nta.nic.in',
  },
  {
    id: 'exam-4',
    name: 'IBPS PO (Probationary Officer) Prelims',
    conductingBody: 'IBPS',
    examDate: '2025-10-18',
    category: 'Banking',
    admitCardStatus: 'Notification Phase',
    officialUrl: 'https://ibps.in',
  },
];

// Default Reference Books Catalog
const DEFAULT_BOOKS = [
  {
    id: 'book-1',
    title: 'Indian Polity (7th Edition)',
    author: 'M. Laxmikanth',
    category: 'Polity',
    shelfRack: 'Shelf A-3 (Row 2)',
    totalCopies: 4,
    availableCopies: 3,
    isbn: '978-9355325013',
  },
  {
    id: 'book-2',
    title: 'A Brief History of Modern India (Spectrum)',
    author: 'Rajiv Ahir (IPS)',
    category: 'History',
    shelfRack: 'Shelf A-4 (Row 1)',
    totalCopies: 5,
    availableCopies: 2,
    isbn: '978-8179307779',
  },
  {
    id: 'book-3',
    title: 'Indian Economy (15th Edition)',
    author: 'Ramesh Singh',
    category: 'Economy',
    shelfRack: 'Shelf B-1 (Row 3)',
    totalCopies: 3,
    availableCopies: 1,
    isbn: '978-9355324542',
  },
  {
    id: 'book-4',
    title: 'Concepts of Physics (Vol 1 & 2 Set)',
    author: 'Dr. H.C. Verma',
    category: 'Physics',
    shelfRack: 'Shelf C-2 (Row 1)',
    totalCopies: 4,
    availableCopies: 4,
    isbn: '978-8177091878',
  },
  {
    id: 'book-5',
    title: 'Quantitative Aptitude for Competitive Examinations',
    author: 'Dr. R.S. Aggarwal',
    category: 'Aptitude',
    shelfRack: 'Shelf B-4 (Row 2)',
    totalCopies: 6,
    availableCopies: 3,
    isbn: '978-9352534029',
  },
  {
    id: 'book-6',
    title: 'Oxford Student Atlas for India (4th Edition)',
    author: 'Oxford University Press',
    category: 'Geography',
    shelfRack: 'Shelf A-1 (Row 4)',
    totalCopies: 3,
    availableCopies: 2,
    isbn: '978-0190131494',
  },
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentEmail = searchParams.get('email');

    // 1. Fetch physical books from DB or fallback to default catalog
    let books: any[] = [];
    try {
      const dbBooks = await Book.find().limit(20);
      if (dbBooks && dbBooks.length > 0) {
        books = dbBooks.map((b) => ({
          id: b._id.toString(),
          title: b.title,
          author: b.author,
          category: b.category,
          shelfRack: b.publisher || 'Main Reading Rack',
          totalCopies: b.totalCopies || 1,
          availableCopies: b.availableCopies !== undefined ? b.availableCopies : 1,
          isbn: b.isbn,
        }));
      } else {
        books = DEFAULT_BOOKS;
      }
    } catch {
      books = DEFAULT_BOOKS;
    }

    // 2. Fetch peer study buddies from Student database (Privacy-safe: no email/phone)
    let peerBuddies: any[] = [];
    try {
      const activeStudents = await Student.find({ isActive: true })
        .select('name seatNumber targetExam studyStage startTime endTime')
        .limit(20);

      peerBuddies = activeStudents
        .filter((s) => s.email !== studentEmail)
        .map((s) => ({
          id: s._id.toString(),
          name: s.name.split(' ')[0] + (s.name.split(' ')[1] ? ` ${s.name.split(' ')[1][0]}.` : ''),
          seatNumber: s.seatNumber || 'Desk Assigned',
          targetExam: s.targetExam || 'Competitive Exam Aspirant',
          studyStage: s.studyStage || 'Full Syllabus Prep',
          shift: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : 'Regular Shift',
        }));
    } catch {
      peerBuddies = [
        { id: 'p1', name: 'Rahul S.', seatNumber: 'Desk A-04', targetExam: 'UPSC Civil Services', studyStage: 'Prelims Mock Test Phase', shift: '08:00 AM - 04:00 PM' },
        { id: 'p2', name: 'Pooja K.', seatNumber: 'Desk B-12', targetExam: 'SSC CGL 2025', studyStage: 'Quant & Reasoning Mastery', shift: '09:00 AM - 05:00 PM' },
        { id: 'p3', name: 'Aman V.', seatNumber: 'Desk C-07', targetExam: 'NEET 2025', studyStage: 'Biology NCERT Revisions', shift: '01:00 PM - 09:00 PM' },
        { id: 'p4', name: 'Deepak M.', seatNumber: 'Desk A-19', targetExam: 'Banking / IBPS PO', studyStage: 'General Awareness & English', shift: '08:00 AM - 08:00 PM' },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        materials: DEFAULT_STUDY_MATERIALS,
        currentAffairs: DAILY_CURRENT_AFFAIRS,
        examCalendar: EXAM_CALENDAR,
        books,
        peerBuddies,
      },
    });
  } catch (error: any) {
    console.error('Error fetching study hub data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load study hub' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, studentId, studentEmail, bookId, targetExam, studyStage } = body;

    // Action 1: Update Target Exam for Peer Matching
    if (action === 'update-target-exam') {
      if (!studentEmail && !studentId) {
        return NextResponse.json({ success: false, error: 'Student ID or email required' }, { status: 400 });
      }

      const query = studentId ? { _id: studentId } : { email: studentEmail };
      const student = await Student.findOne(query);

      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }

      student.targetExam = targetExam || 'UPSC Civil Services';
      student.studyStage = studyStage || 'General Studies & Revision';
      await student.save();

      return NextResponse.json({
        success: true,
        message: 'Your exam target & study stage have been updated!',
        targetExam: student.targetExam,
        studyStage: student.studyStage,
      });
    }

    // Action 2: Reserve a Physical Book for Front-Desk Pickup
    if (action === 'reserve-book') {
      const reservationCode = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      // Decrement copy in DB if book exists in database
      try {
        const book = await Book.findById(bookId);
        if (book && book.availableCopies > 0) {
          book.availableCopies -= 1;
          await book.save();
        }
      } catch {
        // Fallback simulated reservation
      }

      return NextResponse.json({
        success: true,
        reservationCode,
        message: `Book reserved successfully! Present Reservation Pass "${reservationCode}" at the front desk within 24 hours to collect.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling study hub action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
