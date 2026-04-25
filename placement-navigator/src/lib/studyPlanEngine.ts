// Mock data and study plan generation engine

export const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix",
  "Goldman Sachs", "Morgan Stanley", "Uber", "Flipkart",
  "Walmart", "Adobe", "Salesforce", "Oracle", "Samsung",
  "Infosys", "TCS", "Wipro", "Deloitte", "Accenture"
];

export const ROLES = [
  "Software Engineer",
  "Backend Engineer", 
  "Frontend Engineer",
  "Data Engineer",
  "Full Stack Developer",
  "DevOps Engineer",
  "ML Engineer",
];

export type Task = {
  id: string;
  title: string;
  category: "dsa" | "system-design" | "behavioral";
  completed: boolean;
};

export type DayPlan = {
  day: number;
  date: string;
  tasks: Task[];
};

export type StudyPlan = {
  company: string;
  role: string;
  duration: number;
  schedule: DayPlan[];   // 🔥 renamed
  createdAt: string;
};

const DSA_TOPICS: Record<string, string[]> = {
  Google: ["Arrays & Hashing", "Binary Search", "Graphs & BFS/DFS", "Dynamic Programming", "Tries", "Sliding Window", "Heap / Priority Queue", "Backtracking", "Greedy Algorithms", "Union Find"],
  Amazon: ["Arrays & Two Pointers", "Linked Lists", "Trees & BST", "Graphs", "Dynamic Programming", "Stack & Queue", "Sorting Algorithms", "Bit Manipulation", "String Manipulation", "Recursion"],
  Microsoft: ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Stack", "Binary Search", "Sorting", "String Algorithms", "Math Problems"],
  Meta: ["Arrays & Hashing", "Binary Trees", "Graphs", "Dynamic Programming", "Sliding Window", "Two Pointers", "BFS/DFS", "Intervals", "Heap", "Recursion"],
  default: ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Searching", "Stack & Queue", "Greedy"],
};

const SYSTEM_DESIGN_TOPICS: Record<string, string[]> = {
  Google: ["URL Shortener", "Web Crawler", "Distributed File System", "Search Autocomplete", "YouTube Video Streaming", "Google Maps", "Gmail", "Google Drive"],
  Amazon: ["E-commerce System", "Recommendation Engine", "Warehouse Management", "Order Tracking System", "Payment Gateway", "Notification Service", "Rate Limiter", "Load Balancer"],
  Microsoft: ["Chat Application", "File Sync Service", "Email Service", "Video Conferencing", "Cloud Storage", "Search Engine", "Content Delivery Network", "API Gateway"],
  Meta: ["News Feed", "Messenger", "Instagram Stories", "Live Streaming", "Social Graph", "Ad Serving System", "Content Moderation", "Photo Storage"],
  default: ["URL Shortener", "Chat System", "Social Media Feed", "E-commerce Platform", "File Storage", "Notification Service", "Rate Limiter", "Cache System"],
};

const BEHAVIORAL_TOPICS = [
  "Tell me about a challenging project",
  "Describe a time you disagreed with a teammate",
  "How do you handle tight deadlines?",
  "Describe a failure and what you learned",
  "Leadership experience example",
  "How do you prioritize tasks?",
  "Describe a time you mentored someone",
  "How do you handle ambiguity?",
  "Tell me about a time you improved a process",
  "Describe conflict resolution experience",
  "Why this company?",
  "Where do you see yourself in 5 years?",
  "Describe your biggest achievement",
  "How do you stay updated with technology?",
];

let taskIdCounter = 0;
function makeTask(title: string, category: Task["category"]): Task {
  return { id: `task-${++taskIdCounter}`, title, category, completed: false };
}

export function generateStudyPlan(company: string, role: string, duration: number): StudyPlan {
  taskIdCounter = 0;
  const dsaTopics = DSA_TOPICS[company] || DSA_TOPICS.default;
  const sdTopics = SYSTEM_DESIGN_TOPICS[company] || SYSTEM_DESIGN_TOPICS.default;
  const schedule: DayPlan[] = [];
  const today = new Date();

  for (let d = 0; d < duration; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const tasks: Task[] = [];

    // DSA: 60% — 2-3 tasks per day
    const dsaIdx1 = d % dsaTopics.length;
    const dsaIdx2 = (d + 3) % dsaTopics.length;
    tasks.push(makeTask(`Solve 2 ${dsaTopics[dsaIdx1]} problems`, "dsa"));
    tasks.push(makeTask(`Review ${dsaTopics[dsaIdx2]} concepts`, "dsa"));
    if (d % 3 === 0) {
      tasks.push(makeTask(`Practice ${dsaTopics[(d + 5) % dsaTopics.length]} mock`, "dsa"));
    }

    // System Design: 20% — every other day
    if (d % 2 === 0) {
      const sdIdx = Math.floor(d / 2) % sdTopics.length;
      tasks.push(makeTask(`Study: ${sdTopics[sdIdx]}`, "system-design"));
    }

    // Behavioral: 20% — every other day offset
    if (d % 2 === 1) {
      const bIdx = Math.floor(d / 2) % BEHAVIORAL_TOPICS.length;
      tasks.push(makeTask(`Prepare: ${BEHAVIORAL_TOPICS[bIdx]}`, "behavioral"));
    }

   schedule.push({
      day: d + 1,
      date: date.toISOString().split("T")[0],
      tasks,
    });
  }

  return { company, role, duration, schedule, createdAt: new Date().toISOString() };
}

export function reschedule(plan: StudyPlan): { plan: StudyPlan; missedDays: number } {
  const today = new Date().toISOString().split("T")[0];
  let missedDays = 0;
  const pendingTasks: Task[] = [];

  for (const day of plan.schedule) {
    if (day.date < today) {
      const incomplete = day.tasks.filter((t) => !t.completed);
      if (incomplete.length > 0) {
        missedDays++;
        pendingTasks.push(...incomplete.map((t) => ({ ...t, id: `rescheduled-${t.id}` })));
      }
    }
  }

  if (pendingTasks.length === 0) return { plan, missedDays: 0 };

  // Distribute pending tasks across future days
  const futureDays = plan.schedule.filter((d) => d.date >= today);
  let taskIdx = 0;
  for (const day of futureDays) {
    if (taskIdx >= pendingTasks.length) break;
    day.tasks.push(pendingTasks[taskIdx++]);
  }

  return { plan: { ...plan, schedule: [...plan.schedule] }, missedDays };
}

// Analytics mock data
export type AnalyticsData = {
  dsaTopicFrequency: { topic: string; frequency: number }[];
  roundTypes: { name: string; value: number }[];
  problemPatterns: { pattern: string; count: number }[];
  systemDesignFrequency: { topic: string; frequency: number }[];
};

export function getAnalytics(company: string): AnalyticsData {
  const topics = DSA_TOPICS[company] || DSA_TOPICS.default;
  return {
    dsaTopicFrequency: topics.map((t) => ({
      topic: t,
      frequency: Math.floor(Math.random() * 40) + 10,
    })).sort((a, b) => b.frequency - a.frequency),
    roundTypes: [
      { name: "Online Assessment", value: 30 },
      { name: "Technical Phone Screen", value: 25 },
      { name: "System Design", value: 20 },
      { name: "Behavioral", value: 15 },
      { name: "Hiring Manager", value: 10 },
    ],
    problemPatterns: [
      { pattern: "Two Pointer", count: 35 },
      { pattern: "Sliding Window", count: 28 },
      { pattern: "BFS/DFS", count: 24 },
      { pattern: "Dynamic Programming", count: 22 },
      { pattern: "Binary Search", count: 18 },
      { pattern: "Greedy", count: 15 },
    ],
    systemDesignFrequency: (SYSTEM_DESIGN_TOPICS[company] || SYSTEM_DESIGN_TOPICS.default)
      .slice(0, 6)
      .map((t) => ({ topic: t, frequency: Math.floor(Math.random() * 30) + 5 })),
  };
}

export type CompanyInsight = {
  company: string;
  dsaTopics: string[];
  systemDesignTopics: string[];
  behavioralQuestions: string[];
  sources: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  avgRounds: number;
};

export function getCompanyInsights(company: string): CompanyInsight {
  const dsa = DSA_TOPICS[company] || DSA_TOPICS.default;
  const sd = SYSTEM_DESIGN_TOPICS[company] || SYSTEM_DESIGN_TOPICS.default;
  return {
    company,
    dsaTopics: dsa.slice(0, 6),
    systemDesignTopics: sd.slice(0, 5),
    behavioralQuestions: BEHAVIORAL_TOPICS.slice(0, 5),
    sources: ["GeeksforGeeks", "InterviewBit", "PrepInsta", "LeetCode Discuss", "Glassdoor"],
    difficulty: ["Google", "Meta", "Apple"].includes(company) ? "Hard" : ["Amazon", "Microsoft", "Netflix"].includes(company) ? "Medium" : "Medium",
    avgRounds: ["Google", "Meta"].includes(company) ? 5 : 4,
  };
}
