export interface StudyPlanData {
  summary: string;
  dailyHours: number;
  daysRemaining: number;
  roadmapMarkdown: string;
  weeklyMilestones: Array<{
    phase: string;
    focus: string;
    target: string;
  }>;
  subjectStrategy: Array<{
    subject: string;
    weightage: string;
    strategy: string;
  }>;
  dailyRoutine: Array<{
    slot: string;
    activity: string;
  }>;
  tips: string[];
  generatedByAI: boolean;
}

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GeneratedCurrentAffairs {
  editorialHighlight: {
    source: string;
    headline: string;
    summary: string;
    relevance: string;
  };
  newsBites: Array<{
    id: string;
    category: string;
    title: string;
    takeaway: string;
  }>;
  questions: GeneratedQuizQuestion[];
  generatedByAI: boolean;
}

function extractJSON(raw: string): any {
  const trimmed = raw.trim();
  // Strip ```json ... ``` fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

export async function callOpenRouter(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 4000,
  modelOverride?: string
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model =
    modelOverride?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    'openai/gpt-4o-mini';

  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://aarambhlibrary.com',
      'X-Title': 'Aarambh Library Student Portal',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}

function buildFallbackRoadmapMarkdown(p: {
  examName: string;
  examDate: string;
  daysRemaining: number;
  totalScore: number;
  targetScore: number;
  targetPercentage: number;
  dailyHours: number;
}): string {
  const phase1Days = Math.max(7, Math.round(p.daysRemaining * 0.45));
  const phase2Days = Math.max(5, Math.round(p.daysRemaining * 0.35));
  const phase3Days = Math.max(3, p.daysRemaining - phase1Days - phase2Days);

  return `# ${p.examName} — Study Roadmap

> **Target Score:** ${p.targetScore} / ${p.totalScore} (${p.targetPercentage}%) • **Exam Date:** ${p.examDate} • **Time Left:** ${p.daysRemaining} Days • **Daily Commitment:** ${p.dailyHours} hrs/day

---

## 1. Phase-by-Phase Roadmap
### Phase 1: Foundation & High-Weightage Syllabus (${phase1Days} Days)
- [ ] Map the complete **${p.examName}** syllabus and mark top 20% high-yield chapters.
- [ ] Complete core NCERT / standard textbook readings and prepare short 1-page revision notes.
- [ ] Solve topic-wise PYQs immediately after finishing each chapter.

### Phase 2: PYQ Mastery & Speed Building (${phase2Days} Days)
- [ ] Solve at least **5–10 years of Previous Year Questions** under timed conditions.
- [ ] Maintain an **Error Notebook** for repeated mistakes and weak concepts.
- [ ] Attempt 2–3 sectional mock tests per week targeting **${Math.round(p.targetScore * 0.8)}/${p.totalScore}+**.

### Phase 3: Full-Length Mocks & Final Revision (${phase3Days} Days)
- [ ] Take full-length simulated tests matching actual **${p.examName}** exam timing.
- [ ] Revise short notes, formulas, and current affairs **3 times** before exam day.
- [ ] Lock your accuracy and aim consistently above **${p.targetScore}/${p.totalScore}**.

---

## 2. Daily Library Timetable (${p.dailyHours} Hours)
- **Morning Slot (3 hrs):** High-concentration core syllabus & conceptual learning
- **Afternoon Slot (2.5 hrs):** Previous Year Questions (PYQs) & problem solving
- **Evening Slot (2 hrs):** Daily 20 Current Affairs MCQs + static GK revision
- **Night Wrap-up (30 mins):** Review today's mistakes & plan tomorrow's checklist

---

## 3. Golden Rules for ${p.examName}
- **Active Recall:** Test yourself daily instead of passive re-reading.
- **Zero Backlog:** Keep Sundays exclusively for weekly revision and mock analysis.
- **AI Customization:** Ensure \`OPENROUTER_API_KEY\` is set in \`.env\` to regenerate a hyper-specific AI roadmap.`;
}

export async function generateStudyPlanAI(params: {
  examName: string;
  examDate: string;
  totalScore: number;
  targetScore: number;
  studentName?: string;
}): Promise<StudyPlanData> {
  const { examName, examDate, totalScore, targetScore, studentName } = params;
  const now = new Date();
  const target = new Date(examDate);
  const daysRemaining = Math.max(
    1,
    Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const targetPercentage =
    totalScore > 0 ? Math.round((targetScore / totalScore) * 100) : 80;

  try {
    const content = await callOpenRouter(
      [
        {
          role: 'system',
          content:
            'You are an expert Indian competitive exam mentor. Return ONLY valid JSON (no markdown fences, no extra text).',
        },
        {
          role: 'user',
          content: `Create a practical, actionable study plan for ${studentName || 'a student'} preparing for "${examName}".
Exam Date: ${examDate} (${daysRemaining} days left)
Total Score: ${totalScore}, Target Score: ${targetScore} (${targetPercentage}%).

Return JSON with this exact schema:
{
  "summary": "2-sentence motivating strategy tailored to ${examName} and ${daysRemaining} days left",
  "dailyHours": 8,
  "daysRemaining": ${daysRemaining},
  "roadmapMarkdown": "# ${examName} Study Roadmap (${daysRemaining} Days)\\n\\n## 1. Goal & Target Breakdown\\n- Target: **${targetScore} / ${totalScore}** (${targetPercentage}%)\\n\\n## 2. Phase-by-Phase Roadmap\\n### Phase 1: Foundation\\n- [ ] High-weightage syllabus topics\\n\\n## 3. Daily Library Schedule\\n- **Morning (3h):** Core concepts\\n- **Afternoon (3h):** PYQ practice\\n- **Evening (2h):** Daily 20 Current Affairs MCQs & revision\\n\\n## 4. Revision & Mock Test Rules\\n- Analyze every wrong answer in an error notebook.",
  "weeklyMilestones": [
    { "phase": "Phase 1 (Weeks 1-2)", "focus": "Core syllabus", "target": "Complete 40% high-weightage topics" },
    { "phase": "Phase 2 (Weeks 3-4)", "focus": "Practice & PYQs", "target": "Solve 500+ PYQs" },
    { "phase": "Phase 3 (Final Stretch)", "focus": "Full Mock Tests", "target": "Reach ${targetScore}/${totalScore} in mocks" }
  ],
  "subjectStrategy": [
    { "subject": "Subject 1", "weightage": "High", "strategy": "Specific action plan" },
    { "subject": "Subject 2", "weightage": "High", "strategy": "Specific action plan" },
    { "subject": "Subject 3", "weightage": "Medium", "strategy": "Specific action plan" }
  ],
  "dailyRoutine": [
    { "slot": "Morning (3 hrs)", "activity": "Core concept study & notes" },
    { "slot": "Afternoon (3 hrs)", "activity": "PYQs & sectional practice" },
    { "slot": "Evening (2 hrs)", "activity": "Current affairs quiz & revision" }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`,
        },
      ],
      2800
    );

    if (content) {
      const parsed = extractJSON(content);
      const fallbackMd = buildFallbackRoadmapMarkdown({
        examName,
        examDate,
        daysRemaining,
        totalScore,
        targetScore,
        targetPercentage,
        dailyHours: Number(parsed.dailyHours) || 8,
      });
      return {
        summary: parsed.summary || `Focused ${daysRemaining}-day roadmap for ${examName}.`,
        dailyHours: Number(parsed.dailyHours) || 7,
        daysRemaining,
        roadmapMarkdown: parsed.roadmapMarkdown || fallbackMd,
        weeklyMilestones: Array.isArray(parsed.weeklyMilestones) ? parsed.weeklyMilestones : [],
        subjectStrategy: Array.isArray(parsed.subjectStrategy) ? parsed.subjectStrategy : [],
        dailyRoutine: Array.isArray(parsed.dailyRoutine) ? parsed.dailyRoutine : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        generatedByAI: true,
      };
    }
  } catch (err) {
    console.error('OpenRouter study plan error, using structured fallback:', err);
  }

  const dailyHours = daysRemaining < 45 ? 9 : 7;
  // Structured fallback when OPENROUTER_API_KEY is not yet set
  return {
    summary: `Focused ${daysRemaining}-day roadmap for ${examName} aiming for ${targetScore}/${totalScore} (${targetPercentage}%). Balance core syllabus coverage with daily PYQs and mock analysis.`,
    dailyHours,
    daysRemaining,
    roadmapMarkdown: buildFallbackRoadmapMarkdown({
      examName,
      examDate,
      daysRemaining,
      totalScore,
      targetScore,
      targetPercentage,
      dailyHours,
    }),
    weeklyMilestones: [
      {
        phase: 'Phase 1 • Foundation & High-Yield Topics',
        focus: `${examName} Core Syllabus`,
        target: 'Finish high-weightage chapters & concise revision notes',
      },
      {
        phase: 'Phase 2 • PYQ & Speed Drill',
        focus: 'Previous Year Questions + Sectional Tests',
        target: `Cross ${Math.round(targetScore * 0.75)}/${totalScore} consistently`,
      },
      {
        phase: 'Phase 3 • Full Mocks & Error Log',
        focus: 'Full-length timed mocks + weak-area revision',
        target: `Hit ${targetScore}/${totalScore} target score before ${examDate}`,
      },
    ],
    subjectStrategy: [
      {
        subject: 'Core Concept Subjects',
        weightage: 'High',
        strategy: 'Revise standard books and solve topic-wise MCQs daily.',
      },
      {
        subject: 'Current Affairs & Static GK',
        weightage: 'High',
        strategy: 'Attempt 20 daily MCQs and revise weekly editorial bites.',
      },
      {
        subject: 'Mock Tests & Aptitude',
        weightage: 'Medium-High',
        strategy: 'Analyze every wrong answer in an error notebook.',
      },
    ],
    dailyRoutine: [
      { slot: 'Morning Session (3 hrs)', activity: 'New concepts & high-weightage chapters' },
      { slot: 'Afternoon Session (2.5 hrs)', activity: 'PYQ practice & numericals / writing' },
      { slot: 'Evening Session (2 hrs)', activity: 'Daily 20 Current Affairs MCQs + revision' },
    ],
    tips: [
      `Track your mock score weekly against your ${targetScore}/${totalScore} target.`,
      'Revise yesterday’s notes for 20 minutes before starting new topics.',
      'Add your OpenRouter API key in .env to unlock live AI-customized plans.',
    ],
    generatedByAI: false,
  };
}

export async function generateDailyCurrentAffairsQuizAI(params: {
  examType: string;
  dateKey: string;
}): Promise<GeneratedCurrentAffairs> {
  const { examType, dateKey } = params;

  try {
    const content = await callOpenRouter(
      [
        {
          role: 'system',
          content:
            'You are a senior Indian competitive exam current affairs faculty. Return ONLY valid JSON with no markdown fences or extra commentary.',
        },
        {
          role: 'user',
          content: `Generate today's (${dateKey}) Current Affairs & Quiz pack tailored for "${examType}".
CRITICAL REQUIREMENT: You MUST include AT LEAST 20 distinct multiple-choice questions (questions array length >= 20) covering Polity, Economy, Science & Tech, Environment, International Relations, Defence, Awards, and Government Schemes relevant to ${examType}.

Return JSON with this exact schema:
{
  "editorialHighlight": {
    "source": "The Hindu / Indian Express / PIB",
    "headline": "Key editorial headline for ${dateKey}",
    "summary": "Concise 3-4 sentence exam-oriented summary",
    "relevance": "Relevance to ${examType} syllabus"
  },
  "newsBites": [
    { "id": "nb-1", "category": "Economy", "title": "Title", "takeaway": "1-2 line takeaway" }
  ],
  "questions": [
    {
      "id": "q-1",
      "question": "Clear exam-style MCQ question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Concise explanation of why the answer is correct.",
      "topic": "Polity",
      "difficulty": "Medium"
    }
  ]
}
Ensure "newsBites" has 6 items and "questions" has 20 items.`,
        },
      ],
      6500
    );

    if (content) {
      const parsed = extractJSON(content);
      const questions: GeneratedQuizQuestion[] = Array.isArray(parsed.questions)
        ? parsed.questions.map((q: any, idx: number) => ({
            id: q.id || `q-${idx + 1}`,
            question: String(q.question || ''),
            options: Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map(String)
              : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex:
              typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
                ? q.correctIndex
                : 0,
            explanation: String(q.explanation || 'Refer to standard current affairs notes.'),
            topic: String(q.topic || 'Current Affairs'),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty)
              ? q.difficulty
              : 'Medium',
          }))
        : [];

      if (questions.length >= 10) {
        return {
          editorialHighlight: parsed.editorialHighlight || {
            source: 'PIB & National Dailies',
            headline: `Daily Current Affairs Brief for ${examType}`,
            summary: `Curated daily policy, economy, and science developments for ${dateKey}.`,
            relevance: `Relevant for ${examType} General Awareness`,
          },
          newsBites: Array.isArray(parsed.newsBites) ? parsed.newsBites : [],
          questions,
          generatedByAI: true,
        };
      }
    }
  } catch (err) {
    console.error('OpenRouter current affairs error:', err);
  }

  // Fallback 20-question bank when OPENROUTER_API_KEY is not configured yet
  const fallbackQuestions: GeneratedQuizQuestion[] = [
    {
      id: 'q-1',
      question: `Which body in India is responsible for publishing the Monetary Policy Report bi-annually?`,
      options: ['NITI Aayog', 'Reserve Bank of India (RBI)', 'SEBI', 'Ministry of Finance'],
      correctIndex: 1,
      explanation: 'The Reserve Bank of India (RBI) publishes the Monetary Policy Report every six months.',
      topic: 'Economy',
      difficulty: 'Easy',
    },
    {
      id: 'q-2',
      question: 'Which constitutional amendment introduced the Goods and Services Tax (GST) in India?',
      options: ['99th Amendment', '100th Amendment', '101st Amendment', '102nd Amendment'],
      correctIndex: 2,
      explanation: 'The 101st Constitutional Amendment Act, 2016 paved the way for GST implementation.',
      topic: 'Polity',
      difficulty: 'Easy',
    },
    {
      id: 'q-3',
      question: 'Which Indian space mission is designed to study the Sun from the Lagrange Point L1?',
      options: ['Chandrayaan-3', 'Aditya-L1', 'Gaganyaan', 'XPoSat'],
      correctIndex: 1,
      explanation: 'Aditya-L1 is ISRO’s solar observatory stationed in a halo orbit around the Sun-Earth L1 point.',
      topic: 'Science & Tech',
      difficulty: 'Easy',
    },
    {
      id: 'q-4',
      question: 'The "PM Vishwakarma" scheme primarily supports which group of citizens?',
      options: ['IT Startups', 'Traditional Artisans and Craftspeople', 'Large Exporters', 'Commercial Airlines'],
      correctIndex: 1,
      explanation: 'PM Vishwakarma provides collateral-free credit, toolkit support, and skill training to traditional artisans.',
      topic: 'Government Schemes',
      difficulty: 'Easy',
    },
    {
      id: 'q-5',
      question: 'Which Article of the Indian Constitution deals with the Finance Commission?',
      options: ['Article 260', 'Article 280', 'Article 300A', 'Article 324'],
      correctIndex: 1,
      explanation: 'Article 280 provides for a Finance Commission constituted by the President every five years.',
      topic: 'Polity',
      difficulty: 'Medium',
    },
    {
      id: 'q-6',
      question: 'Which international organization publishes the "World Economic Outlook" report?',
      options: ['World Bank', 'International Monetary Fund (IMF)', 'WTO', 'UNDP'],
      correctIndex: 1,
      explanation: 'The IMF publishes the World Economic Outlook twice a year (April and October).',
      topic: 'Economy',
      difficulty: 'Medium',
    },
    {
      id: 'q-7',
      question: 'What is the primary objective of the National Green Hydrogen Mission?',
      options: [
        'Increasing coal imports',
        'Making India a global hub for green hydrogen production and export',
        'Expanding diesel subsidies',
        'Replacing solar panels with thermal plants',
      ],
      correctIndex: 1,
      explanation: 'The National Green Hydrogen Mission targets 5 MMT annual green hydrogen production capacity by 2030.',
      topic: 'Environment',
      difficulty: 'Medium',
    },
    {
      id: 'q-8',
      question: 'Which Indian city hosts the headquarters of the International Solar Alliance (ISA)?',
      options: ['Bengaluru', 'Gurugram', 'Hyderabad', 'Gandhinagar'],
      correctIndex: 1,
      explanation: 'The International Solar Alliance (ISA) is headquartered in Gurugram, Haryana.',
      topic: 'International',
      difficulty: 'Easy',
    },
    {
      id: 'q-9',
      question: 'Under the Digital Personal Data Protection (DPDP) Act, what is a "Data Fiduciary"?',
      options: [
        'Any person whose data is collected',
        'An entity determining the purpose and means of processing personal data',
        'A government auditor only',
        'A telecom tower operator',
      ],
      correctIndex: 1,
      explanation: 'A Data Fiduciary determines the purpose and means of processing personal data under the DPDP Act.',
      topic: 'Polity & Governance',
      difficulty: 'Medium',
    },
    {
      id: 'q-10',
      question: 'Which wetland conservation framework was adopted in 1971 in Iran?',
      options: ['Basel Convention', 'Ramsar Convention', 'Bonn Convention', 'Stockholm Convention'],
      correctIndex: 1,
      explanation: 'The Ramsar Convention on Wetlands was signed in Ramsar, Iran in 1971.',
      topic: 'Environment',
      difficulty: 'Easy',
    },
    {
      id: 'q-11',
      question: 'Unified Payments Interface (UPI) is developed and operated by which entity?',
      options: ['RBI directly', 'NPCI', 'SIDBI', 'NABARD'],
      correctIndex: 1,
      explanation: 'National Payments Corporation of India (NPCI) developed and operates UPI.',
      topic: 'Economy',
      difficulty: 'Easy',
    },
    {
      id: 'q-12',
      question: 'Which Indian naval exercise is conducted bilaterally with France?',
      options: ['Malabar', 'Varuna', 'Simbex', 'Konkan'],
      correctIndex: 1,
      explanation: 'Exercise Varuna is the bilateral naval exercise between the Indian Navy and the French Navy.',
      topic: 'Defence',
      difficulty: 'Medium',
    },
    {
      id: 'q-13',
      question: 'What does "CBDC" stand for in Indian banking terminology?',
      options: [
        'Central Bank Digital Currency',
        'Commercial Banking Deposit Credit',
        'Credit Bureau Data Center',
        'Cross Border Direct Clearing',
      ],
      correctIndex: 0,
      explanation: 'CBDC stands for Central Bank Digital Currency (e₹ / Digital Rupee issued by RBI).',
      topic: 'Economy',
      difficulty: 'Easy',
    },
    {
      id: 'q-14',
      question: 'Which Schedule of the Indian Constitution lists the official languages?',
      options: ['Sixth Schedule', 'Seventh Schedule', 'Eighth Schedule', 'Tenth Schedule'],
      correctIndex: 2,
      explanation: 'The Eighth Schedule currently recognizes 22 official languages of India.',
      topic: 'Polity',
      difficulty: 'Easy',
    },
    {
      id: 'q-15',
      question: 'Which organization releases the "Global Hunger Index" annually?',
      options: ['FAO & WHO', 'Concern Worldwide & Welthungerhilfe', 'World Bank', 'UNICEF'],
      correctIndex: 1,
      explanation: 'Concern Worldwide and Welthungerhilfe jointly publish the annual Global Hunger Index.',
      topic: 'Reports & Indices',
      difficulty: 'Medium',
    },
    {
      id: 'q-16',
      question: 'What is the primary purpose of the "PLI Scheme" launched by the Government of India?',
      options: [
        'Promote domestic manufacturing and attract investment',
        'Privatize all railways',
        'Regulate cryptocurrency mining',
        'Replace income tax with wealth tax',
      ],
      correctIndex: 0,
      explanation: 'Production Linked Incentive (PLI) schemes incentivize domestic manufacturing across key sectors.',
      topic: 'Economy',
      difficulty: 'Easy',
    },
    {
      id: 'q-17',
      question: 'Which river basin is associated with the Ken-Betwa Link Project?',
      options: ['Godavari', 'Yamuna', 'Kaveri', 'Narmada'],
      correctIndex: 1,
      explanation: 'Both Ken and Betwa are tributaries of the Yamuna river.',
      topic: 'Geography',
      difficulty: 'Medium',
    },
    {
      id: 'q-18',
      question: 'Which Indian agency operates the "Bharat NCAP" safety rating program?',
      options: ['Ministry of Road Transport & Highways', 'ISRO', 'TRAI', 'DGCA'],
      correctIndex: 0,
      explanation: 'MoRTH launched Bharat New Car Assessment Programme (Bharat NCAP) for vehicle safety star ratings.',
      topic: 'Governance',
      difficulty: 'Medium',
    },
    {
      id: 'q-19',
      question: 'In genetics, what does CRISPR-Cas9 primarily enable scientists to do?',
      options: [
        'Measure atmospheric ozone',
        'Edit specific DNA sequences with high precision',
        'Generate solar electricity',
        'Purify ocean water',
      ],
      correctIndex: 1,
      explanation: 'CRISPR-Cas9 is a molecular tool used for precise gene editing.',
      topic: 'Science & Tech',
      difficulty: 'Medium',
    },
    {
      id: 'q-20',
      question: 'Which Indian state has the largest mangrove forest cover (Sundarbans)?',
      options: ['Odisha', 'West Bengal', 'Gujarat', 'Andhra Pradesh'],
      correctIndex: 1,
      explanation: 'West Bengal accounts for the largest share of India’s mangrove cover via the Sundarbans.',
      topic: 'Environment',
      difficulty: 'Easy',
    },
  ];

  return {
    editorialHighlight: {
      source: 'Aarambh Daily Brief (Configure OPENROUTER_API_KEY in .env for live AI updates)',
      headline: `Daily Current Affairs & 20-MCQ Drill for ${examType}`,
      summary: `Practice today’s 20 high-yield current affairs and static-linked questions tailored for ${examType}. Once you add OPENROUTER_API_KEY in .env, each day’s editorial and 20+ MCQs will be dynamically generated by AI and cached in MongoDB.`,
      relevance: `Tailored for ${examType} • ${dateKey}`,
    },
    newsBites: [
      { id: 'nb-1', category: 'Economy', title: 'RBI Monetary Policy & Digital Rupee', takeaway: 'Track repo rate stance and retail CBDC pilot expansion.' },
      { id: 'nb-2', category: 'Science & Tech', title: 'ISRO Solar & Deep Space Missions', takeaway: 'Aditya-L1 halo orbit observations and upcoming Gaganyaan milestones.' },
      { id: 'nb-3', category: 'Environment', title: 'Green Hydrogen & Ramsar Wetlands', takeaway: 'India expands clean energy capacity and wetland conservation sites.' },
      { id: 'nb-4', category: 'Governance', title: 'Digital Public Infrastructure (UPI & DPDP)', takeaway: 'Cross-border UPI linkages and data fiduciary compliance norms.' },
    ],
    questions: fallbackQuestions,
    generatedByAI: false,
  };
}

export async function generatePracticeQuizAI(params: {
  examType: string;
  dateKey: string;
  attemptNumber: number;
}): Promise<{ questions: GeneratedQuizQuestion[]; generatedByAI: boolean }> {
  const { examType, dateKey, attemptNumber } = params;

  try {
    const content = await callOpenRouter(
      [
        {
          role: 'system',
          content:
            'You are an expert Indian competitive exam question setter. Return ONLY valid JSON with no markdown fences.',
        },
        {
          role: 'user',
          content: `Generate Practice Set #${attemptNumber} (${dateKey}) with 20 high-yield multiple-choice questions for "${examType}".
Cover mixed syllabus subjects relevant to ${examType} (Core Subjects, Aptitude/Reasoning, Current Affairs, and Static GK).

Return JSON:
{
  "questions": [
    {
      "id": "pq-1",
      "question": "Clear exam-level MCQ question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Concise 1-2 line explanation.",
      "topic": "Subject / Topic",
      "difficulty": "Medium"
    }
  ]
}
Ensure "questions" has 20 distinct questions.`,
        },
      ],
      6000,
      process.env.OPENROUTER_MODEL_PRACTICE
    );

    if (content) {
      const parsed = extractJSON(content);
      const questions: GeneratedQuizQuestion[] = Array.isArray(parsed.questions)
        ? parsed.questions.map((q: any, idx: number) => ({
            id: q.id || `pq-${attemptNumber}-${idx + 1}`,
            question: String(q.question || ''),
            options:
              Array.isArray(q.options) && q.options.length >= 4
                ? q.options.slice(0, 4).map(String)
                : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex:
              typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
                ? q.correctIndex
                : 0,
            explanation: String(q.explanation || 'Review core syllabus notes.'),
            topic: String(q.topic || examType),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty)
              ? q.difficulty
              : 'Medium',
          }))
        : [];

      if (questions.length >= 10) {
        return { questions, generatedByAI: true };
      }
    }
  } catch (err) {
    console.error('OpenRouter practice quiz error:', err);
  }

  const fallback = await generateDailyCurrentAffairsQuizAI({ examType, dateKey });
  return {
    questions: fallback.questions.map((q, idx) => ({
      ...q,
      id: `pq-${attemptNumber}-${idx + 1}`,
    })),
    generatedByAI: false,
  };
}

export async function chatWithStudyMateAI(params: {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
  studentName?: string;
  targetExam?: string;
  language?: string;
}): Promise<string> {
  const { history, userMessage, studentName, targetExam, language = 'English' } = params;

  try {
    const content = await callOpenRouter(
      [
        {
          role: 'system',
          content: `You are "Study Mate", a warm, encouraging, and sharp AI study companion inside Aarambh Library Student Portal.
Student Name: ${studentName || 'Friend'}
Target Exam: ${targetExam || 'Competitive Exams'}
Preferred Reply Language: ${language}

Rules:
- ALWAYS reply in **${language}** (e.g., if Hindi, write in clean Devanagari Hindi; if Hinglish, write natural Hindi-English mix; if Tamil/Marathi/Bengali/Telugu/Gujarati, write in that script).
- ALWAYS format your reply in clean **Markdown** (short headings, bullet points, bold key terms, or numbered steps).
- Keep explanations clear, exam-oriented, practical, and friendly — like a helpful senior study mate.`,
        },
        ...history.slice(-10),
        {
          role: 'user',
          content: userMessage,
        },
      ],
      1500,
      process.env.OPENROUTER_MODEL_CHAT
    );

    if (content) {
      return content.trim();
    }
  } catch (err) {
    console.error('OpenRouter Study Mate chat error:', err);
  }

  return `Hey ${studentName || 'there'}! I'm your **Study Mate**. I received your question: *"${userMessage}"*, but I couldn't reach the AI model right now. Please check your \`OPENROUTER_API_KEY\` or \`OPENROUTER_MODEL_CHAT\` in \`.env\` and try again!`;
}

