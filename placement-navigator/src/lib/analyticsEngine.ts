// Advanced analytics, difficulty scoring, gap analysis, and readiness scoring

import { COMPANIES } from "./studyPlanEngine";

// ─── Company Difficulty Scoring ───

export type DifficultyBreakdown = {
  company: string;
  overallScore: number;
  avgProblemDifficulty: number; // 1-10
  numRounds: number;
  systemDesignWeight: number; // 0-1
  behavioralWeight: number; // 0-1
  dsaDifficulty: number; // 1-10
};

const COMPANY_RAW_DATA: Record<string, Omit<DifficultyBreakdown, "company" | "overallScore">> = {
  Google: { avgProblemDifficulty: 8.8, numRounds: 5, systemDesignWeight: 0.85, behavioralWeight: 0.6, dsaDifficulty: 9.2 },
  Amazon: { avgProblemDifficulty: 7.5, numRounds: 5, systemDesignWeight: 0.75, behavioralWeight: 0.9, dsaDifficulty: 7.8 },
  Microsoft: { avgProblemDifficulty: 7.0, numRounds: 4, systemDesignWeight: 0.7, behavioralWeight: 0.5, dsaDifficulty: 7.2 },
  Meta: { avgProblemDifficulty: 8.5, numRounds: 5, systemDesignWeight: 0.8, behavioralWeight: 0.5, dsaDifficulty: 9.0 },
  Apple: { avgProblemDifficulty: 8.0, numRounds: 5, systemDesignWeight: 0.75, behavioralWeight: 0.6, dsaDifficulty: 8.5 },
  Netflix: { avgProblemDifficulty: 8.2, numRounds: 4, systemDesignWeight: 0.9, behavioralWeight: 0.5, dsaDifficulty: 8.0 },
  "Goldman Sachs": { avgProblemDifficulty: 7.8, numRounds: 4, systemDesignWeight: 0.6, behavioralWeight: 0.7, dsaDifficulty: 8.0 },
  "Morgan Stanley": { avgProblemDifficulty: 7.2, numRounds: 4, systemDesignWeight: 0.55, behavioralWeight: 0.65, dsaDifficulty: 7.5 },
  Uber: { avgProblemDifficulty: 8.0, numRounds: 5, systemDesignWeight: 0.85, behavioralWeight: 0.5, dsaDifficulty: 8.5 },
  Flipkart: { avgProblemDifficulty: 7.5, numRounds: 4, systemDesignWeight: 0.7, behavioralWeight: 0.5, dsaDifficulty: 7.8 },
  Walmart: { avgProblemDifficulty: 6.8, numRounds: 4, systemDesignWeight: 0.65, behavioralWeight: 0.6, dsaDifficulty: 7.0 },
  Adobe: { avgProblemDifficulty: 7.2, numRounds: 4, systemDesignWeight: 0.65, behavioralWeight: 0.55, dsaDifficulty: 7.5 },
  Salesforce: { avgProblemDifficulty: 6.5, numRounds: 4, systemDesignWeight: 0.6, behavioralWeight: 0.6, dsaDifficulty: 6.8 },
  Oracle: { avgProblemDifficulty: 6.5, numRounds: 3, systemDesignWeight: 0.5, behavioralWeight: 0.5, dsaDifficulty: 6.8 },
  Samsung: { avgProblemDifficulty: 6.8, numRounds: 3, systemDesignWeight: 0.5, behavioralWeight: 0.4, dsaDifficulty: 7.0 },
  Infosys: { avgProblemDifficulty: 4.0, numRounds: 3, systemDesignWeight: 0.2, behavioralWeight: 0.6, dsaDifficulty: 4.0 },
  TCS: { avgProblemDifficulty: 3.8, numRounds: 3, systemDesignWeight: 0.15, behavioralWeight: 0.7, dsaDifficulty: 3.5 },
  Wipro: { avgProblemDifficulty: 4.0, numRounds: 3, systemDesignWeight: 0.2, behavioralWeight: 0.6, dsaDifficulty: 4.0 },
  Deloitte: { avgProblemDifficulty: 5.0, numRounds: 3, systemDesignWeight: 0.3, behavioralWeight: 0.8, dsaDifficulty: 4.5 },
  Accenture: { avgProblemDifficulty: 4.5, numRounds: 3, systemDesignWeight: 0.25, behavioralWeight: 0.7, dsaDifficulty: 4.2 },
};

export function calculateDifficultyScore(company: string): DifficultyBreakdown {
  const raw = COMPANY_RAW_DATA[company] || { avgProblemDifficulty: 5, numRounds: 3, systemDesignWeight: 0.5, behavioralWeight: 0.5, dsaDifficulty: 5 };
  const score = 0.5 * raw.avgProblemDifficulty + 0.3 * (raw.numRounds / 5) * 10 + 0.2 * raw.systemDesignWeight * 10;
  return { company, overallScore: Math.round(score * 10) / 10, ...raw };
}

export function getDifficultyLeaderboard(): DifficultyBreakdown[] {
  return COMPANIES.map(calculateDifficultyScore).sort((a, b) => b.overallScore - a.overallScore);
}

// ─── Topic Gap Analyzer ───

export const ALL_TOPICS = {
  dsa: [
    "Arrays & Hashing", "Two Pointers", "Sliding Window", "Binary Search",
    "Linked Lists", "Trees & BST", "Graphs & BFS/DFS", "Dynamic Programming",
    "Backtracking", "Greedy Algorithms", "Heap / Priority Queue", "Stack & Queue",
    "Tries", "Union Find", "Bit Manipulation", "Sorting Algorithms",
    "String Manipulation", "Recursion", "Math Problems", "Intervals",
  ],
  systemDesign: [
    "URL Shortener", "Chat System", "News Feed", "E-commerce System",
    "Recommendation Engine", "Search Autocomplete", "File Storage",
    "Notification Service", "Rate Limiter", "Load Balancer",
    "Video Streaming", "Content Delivery Network", "API Gateway",
    "Distributed File System", "Payment Gateway",
  ],
  behavioral: [
    "Tell me about a challenging project",
    "Describe a time you disagreed with a teammate",
    "How do you handle tight deadlines?",
    "Describe a failure and what you learned",
    "Leadership experience example",
    "How do you prioritize tasks?",
  ],
};

const COMPANY_REQUIRED_TOPICS: Record<string, { dsa: string[]; systemDesign: string[]; behavioral: string[] }> = {
  Google: { dsa: ["Arrays & Hashing", "Graphs & BFS/DFS", "Dynamic Programming", "Tries", "Binary Search", "Sliding Window", "Heap / Priority Queue", "Backtracking"], systemDesign: ["URL Shortener", "Search Autocomplete", "Distributed File System", "Video Streaming"], behavioral: ["Tell me about a challenging project", "How do you prioritize tasks?"] },
  Amazon: { dsa: ["Arrays & Hashing", "Two Pointers", "Linked Lists", "Trees & BST", "Graphs & BFS/DFS", "Dynamic Programming", "Stack & Queue", "Sorting Algorithms"], systemDesign: ["E-commerce System", "Recommendation Engine", "Notification Service", "Rate Limiter"], behavioral: ["Leadership experience example", "Describe a time you disagreed with a teammate", "How do you handle tight deadlines?"] },
  Microsoft: { dsa: ["Arrays & Hashing", "Linked Lists", "Trees & BST", "Graphs & BFS/DFS", "Dynamic Programming", "Binary Search", "String Manipulation"], systemDesign: ["Chat System", "File Storage", "API Gateway"], behavioral: ["Tell me about a challenging project", "Describe a failure and what you learned"] },
  Meta: { dsa: ["Arrays & Hashing", "Graphs & BFS/DFS", "Dynamic Programming", "Sliding Window", "Two Pointers", "Trees & BST", "Heap / Priority Queue"], systemDesign: ["News Feed", "Chat System", "Video Streaming", "Content Delivery Network"], behavioral: ["Tell me about a challenging project", "How do you prioritize tasks?"] },
  default: { dsa: ["Arrays & Hashing", "Linked Lists", "Trees & BST", "Graphs & BFS/DFS", "Dynamic Programming", "Sorting Algorithms"], systemDesign: ["URL Shortener", "Chat System", "File Storage"], behavioral: ["Tell me about a challenging project", "How do you handle tight deadlines?"] },
};

export type GapAnalysis = {
  company: string;
  required: { dsa: string[]; systemDesign: string[]; behavioral: string[] };
  completed: { dsa: string[]; systemDesign: string[]; behavioral: string[] };
  gaps: { dsa: string[]; systemDesign: string[]; behavioral: string[] };
  dsaCompletion: number;
  systemDesignCompletion: number;
  behavioralCompletion: number;
  overallCompletion: number;
};

export function analyzeGaps(
  company: string,
  completedDsa: string[],
  completedSD: string[],
  completedBehavioral: string[]
): GapAnalysis {
  const req = COMPANY_REQUIRED_TOPICS[company] || COMPANY_REQUIRED_TOPICS.default;
  const gaps = {
    dsa: req.dsa.filter((t) => !completedDsa.includes(t)),
    systemDesign: req.systemDesign.filter((t) => !completedSD.includes(t)),
    behavioral: req.behavioral.filter((t) => !completedBehavioral.includes(t)),
  };
  const dsaComp = req.dsa.length ? Math.round(((req.dsa.length - gaps.dsa.length) / req.dsa.length) * 100) : 100;
  const sdComp = req.systemDesign.length ? Math.round(((req.systemDesign.length - gaps.systemDesign.length) / req.systemDesign.length) * 100) : 100;
  const behComp = req.behavioral.length ? Math.round(((req.behavioral.length - gaps.behavioral.length) / req.behavioral.length) * 100) : 100;
  const overall = Math.round((dsaComp * 0.6 + sdComp * 0.2 + behComp * 0.2));

  return {
    company,
    required: req,
    completed: { dsa: completedDsa, systemDesign: completedSD, behavioral: completedBehavioral },
    gaps,
    dsaCompletion: dsaComp,
    systemDesignCompletion: sdComp,
    behavioralCompletion: behComp,
    overallCompletion: overall,
  };
}

// ─── Interview Readiness Score ───

export type ReadinessScore = {
  overall: number;
  dsaReadiness: number;
  systemDesignReadiness: number;
  behavioralReadiness: number;
  practiceScore: number;
  companyDifficulty: number;
};

export function calculateReadiness(
  company: string,
  gapAnalysis: GapAnalysis,
  questionsCompleted: number,
  totalQuestions: number,
  mockScore: number // 0-100
): ReadinessScore {
  const diff = calculateDifficultyScore(company);
  const practiceRatio = totalQuestions > 0 ? questionsCompleted / totalQuestions : 0;
  const practiceScore = Math.round(practiceRatio * 100);

  // Weight readiness inversely by difficulty
  const difficultyPenalty = 1 - (diff.overallScore / 10) * 0.2;

  const dsaReadiness = Math.round(gapAnalysis.dsaCompletion * difficultyPenalty);
  const systemDesignReadiness = Math.round(gapAnalysis.systemDesignCompletion * difficultyPenalty);
  const behavioralReadiness = Math.round(gapAnalysis.behavioralCompletion * difficultyPenalty);
  const overall = Math.round(
    dsaReadiness * 0.4 + systemDesignReadiness * 0.2 + behavioralReadiness * 0.15 + practiceScore * 0.15 + mockScore * 0.1
  );

  return {
    overall: Math.min(100, overall),
    dsaReadiness,
    systemDesignReadiness,
    behavioralReadiness,
    practiceScore,
    companyDifficulty: diff.overallScore,
  };
}

// ─── Topic Trend Data (cross-company) ───

export type TopicTrend = {
  topic: string;
  [company: string]: number | string;
};

export function getTopicTrends(): TopicTrend[] {
  const topics = ["Arrays", "Graphs", "DP", "Trees", "System Design", "Binary Search", "Sliding Window", "Greedy"];
  const companies = ["Google", "Amazon", "Microsoft", "Meta", "Apple"];

  return topics.map((topic) => {
    const row: TopicTrend = { topic };
    companies.forEach((c) => {
      // Deterministic pseudo-random based on topic+company
      const seed = (topic.charCodeAt(0) * 31 + c.charCodeAt(0) * 17) % 40;
      row[c] = seed + 10;
    });
    return row;
  });
}

// ─── Pipeline Stages ───

export const PIPELINE_STAGES = [
  {
    id: "query",
    title: "Query Agent",
    description: "Constructs targeted search queries based on company name, role, and interview type to find relevant interview experiences.",
    icon: "Search",
  },
  {
    id: "extract",
    title: "Data Extraction Agent",
    description: "Scrapes and extracts raw interview data from sources like GeeksforGeeks, LeetCode Discuss, Glassdoor, and InterviewBit.",
    icon: "Database",
  },
  {
    id: "clean",
    title: "Data Cleaning Agent",
    description: "Filters noise, removes duplicates, normalizes topic names, and structures the raw data into a clean format.",
    icon: "Filter",
  },
  {
    id: "insight",
    title: "Insight Extraction Agent",
    description: "Analyzes cleaned data to identify patterns — topic frequency, difficulty distribution, round types, and common question patterns.",
    icon: "Lightbulb",
  },
  {
    id: "recommend",
    title: "Recommendation Agent",
    description: "Uses gap analysis and difficulty scoring to generate personalized topic recommendations weighted by company requirements.",
    icon: "Target",
  },
  {
    id: "schedule",
    title: "Study Plan Generator",
    description: "Produces a day-by-day study schedule with adaptive rescheduling, balancing DSA (60%), System Design (20%), and Behavioral (20%).",
    icon: "Calendar",
  },
];
