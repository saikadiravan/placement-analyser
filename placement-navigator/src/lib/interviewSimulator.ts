// Interview Memory Replay Engine — data and logic

import { COMPANIES, ROLES } from "./studyPlanEngine";

export type RoundType = "coding" | "system-design" | "behavioral";

export type InterviewRound = {
  id: number;
  type: RoundType;
  title: string;
  prompt: string;
  timeLimit: number; // seconds
  hints?: string[];
};

export type InterviewSession = {
  company: string;
  role: string;
  rounds: InterviewRound[];
};

export type RoundResult = {
  roundId: number;
  answer: string;
  timeSpent: number; // seconds
  score: number; // 0-100
};

export type SimulationFeedback = {
  overallScore: number;
  codingScore: number;
  systemDesignScore: number;
  behavioralScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestedTopics: string[];
};

// ─── Company interview templates ───

const CODING_QUESTIONS: Record<string, { title: string; prompt: string; hints: string[] }[]> = {
  Amazon: [
    { title: "Two Sum", prompt: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\nExplain your approach and write the solution.", hints: ["Think about using a hash map", "One-pass solution exists"] },
    { title: "Graph Traversal – Rotten Oranges", prompt: "You are given an m x n grid where each cell can have one of three values: 0 (empty), 1 (fresh orange), 2 (rotten orange). Every minute, any fresh orange adjacent to a rotten orange becomes rotten. Return the minimum number of minutes until no fresh orange remains. If impossible, return -1.\n\nExplain your BFS approach and code it.", hints: ["Use multi-source BFS", "Track time with levels"] },
  ],
  Google: [
    { title: "Median of Two Sorted Arrays", prompt: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log(min(m,n))).\n\nExplain your binary search approach.", hints: ["Binary search on the smaller array", "Partition both arrays"] },
    { title: "Word Ladder", prompt: "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord. Each transformed word must exist in the word list.\n\nExplain BFS approach.", hints: ["BFS level by level", "Use a set for O(1) lookup"] },
  ],
  Microsoft: [
    { title: "LRU Cache", prompt: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get and put methods in O(1) time.\n\nDescribe your approach using a doubly-linked list and hash map.", hints: ["Doubly linked list + HashMap", "Move accessed nodes to head"] },
    { title: "Reverse Linked List", prompt: "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nProvide both iterative and recursive solutions.", hints: ["Use three pointers for iterative", "Recursive: reverse rest then adjust"] },
  ],
  Meta: [
    { title: "Valid Palindrome II", prompt: "Given a string s, return true if the s can be palindrome after deleting at most one character from it.\n\nExplain your two-pointer approach.", hints: ["Two pointers from both ends", "On mismatch, try skipping either character"] },
    { title: "Binary Tree Right Side View", prompt: "Given the root of a binary tree, imagine yourself standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom.\n\nExplain BFS level-order approach.", hints: ["BFS with level tracking", "Take last node of each level"] },
  ],
  default: [
    { title: "Array Sorting", prompt: "Implement merge sort for an array of integers. Explain the divide-and-conquer approach and analyze time/space complexity.", hints: ["Divide array in half", "Merge sorted halves"] },
    { title: "Binary Search", prompt: "Implement binary search on a sorted array. Handle edge cases and explain the time complexity.", hints: ["Use left and right pointers", "Watch for integer overflow in mid calculation"] },
  ],
};

const SYSTEM_DESIGN_QUESTIONS: Record<string, { title: string; prompt: string }[]> = {
  Amazon: [
    { title: "Design URL Shortener", prompt: "Design a URL shortening service like bit.ly.\n\nConsider:\n• How would you generate unique short URLs?\n• How would you handle redirects at scale?\n• What database would you use?\n• How would you handle analytics (click counts)?\n• How would you scale to millions of URLs?\n\nProvide a high-level architecture with components." },
    { title: "Design E-commerce Order System", prompt: "Design the order management system for an e-commerce platform like Amazon.\n\nConsider:\n• Order placement and payment flow\n• Inventory management\n• Order tracking and status updates\n• Handling high traffic during sales events\n\nDescribe the system components and data flow." },
  ],
  Google: [
    { title: "Design Google Search Autocomplete", prompt: "Design a search autocomplete system that suggests queries as the user types.\n\nConsider:\n• How to store and retrieve suggestions efficiently?\n• How to rank suggestions?\n• How to handle personalization?\n• How to update suggestions based on trending queries?\n\nDescribe trie-based approach and system architecture." },
    { title: "Design YouTube", prompt: "Design a video streaming platform like YouTube.\n\nConsider:\n• Video upload and processing pipeline\n• Content delivery and streaming\n• Recommendation system\n• Handling millions of concurrent viewers\n\nProvide high-level architecture." },
  ],
  default: [
    { title: "Design a Chat Application", prompt: "Design a real-time chat application supporting 1-on-1 and group messaging.\n\nConsider:\n• Real-time message delivery\n• Message storage and retrieval\n• Online/offline status\n• Push notifications\n\nDescribe WebSocket-based architecture." },
  ],
};

const BEHAVIORAL_QUESTIONS: Record<string, { title: string; prompt: string }[]> = {
  Amazon: [
    { title: "Conflict Resolution", prompt: "Tell me about a time you handled conflict within your team.\n\nUse the STAR method (Situation, Task, Action, Result) to structure your answer.\n\nAmazon Leadership Principle: Have Backbone; Disagree and Commit" },
    { title: "Customer Obsession", prompt: "Describe a time when you went above and beyond for a customer or end user.\n\nAmazon Leadership Principle: Customer Obsession\n\nUse STAR format." },
  ],
  Google: [
    { title: "Ambiguity", prompt: "Tell me about a time you had to make a decision with incomplete information.\n\nHow did you handle the ambiguity? What was the outcome?\n\nUse STAR format." },
    { title: "Challenging Project", prompt: "Describe the most technically challenging project you've worked on.\n\nWhat made it challenging? How did you overcome obstacles?\n\nUse STAR format." },
  ],
  default: [
    { title: "Teamwork", prompt: "Describe a time you worked effectively as part of a team to achieve a goal.\n\nUse the STAR method to structure your response." },
    { title: "Failure & Learning", prompt: "Tell me about a time you failed. What did you learn from it?\n\nUse the STAR method." },
  ],
};

// ─── Session generation ───

export function generateInterviewSession(company: string, role: string): InterviewSession {
  const coding = CODING_QUESTIONS[company] || CODING_QUESTIONS.default;
  const sd = SYSTEM_DESIGN_QUESTIONS[company] || SYSTEM_DESIGN_QUESTIONS.default;
  const beh = BEHAVIORAL_QUESTIONS[company] || BEHAVIORAL_QUESTIONS.default;

  const rounds: InterviewRound[] = [
    { id: 1, type: "coding", title: `Round 1 – Coding: ${coding[0].title}`, prompt: coding[0].prompt, timeLimit: 1800, hints: coding[0].hints },
    { id: 2, type: "coding", title: `Round 2 – Coding: ${coding[1 % coding.length].title}`, prompt: coding[1 % coding.length].prompt, timeLimit: 1800, hints: coding[1 % coding.length].hints },
    { id: 3, type: "system-design", title: `Round 3 – System Design: ${sd[0].title}`, prompt: sd[0].prompt, timeLimit: 2700 },
    { id: 4, type: "behavioral", title: `Round 4 – Behavioral: ${beh[0].title}`, prompt: beh[0].prompt, timeLimit: 900 },
  ];

  return { company, role, rounds };
}

// ─── Scoring ───

function scoreAnswer(answer: string, roundType: RoundType): number {
  if (!answer.trim()) return 0;
  const len = answer.trim().length;
  // Heuristic scoring based on answer length and keywords
  let base = Math.min(60, len / 5);

  const keywords: Record<RoundType, string[]> = {
    coding: ["time complexity", "space complexity", "O(n)", "O(log", "hash", "pointer", "iterate", "recursive", "base case", "return", "function", "algorithm", "array", "loop", "edge case"],
    "system-design": ["scalability", "load balancer", "database", "cache", "CDN", "API", "microservice", "queue", "partition", "replication", "consistency", "availability", "latency", "throughput"],
    behavioral: ["situation", "task", "action", "result", "team", "learned", "improved", "challenge", "outcome", "feedback", "leadership", "communication"],
  };

  const matched = keywords[roundType].filter((kw) => answer.toLowerCase().includes(kw.toLowerCase()));
  const keywordBonus = Math.min(40, matched.length * 8);

  return Math.min(100, Math.round(base + keywordBonus));
}

export function evaluateSimulation(session: InterviewSession, results: RoundResult[]): SimulationFeedback {
  const codingResults = results.filter((r) => session.rounds.find((rd) => rd.id === r.roundId)?.type === "coding");
  const sdResults = results.filter((r) => session.rounds.find((rd) => rd.id === r.roundId)?.type === "system-design");
  const behResults = results.filter((r) => session.rounds.find((rd) => rd.id === r.roundId)?.type === "behavioral");

  const avg = (arr: RoundResult[]) => arr.length ? Math.round(arr.reduce((s, r) => s + r.score, 0) / arr.length) : 0;

  const codingScore = avg(codingResults);
  const systemDesignScore = avg(sdResults);
  const behavioralScore = avg(behResults);
  const overallScore = Math.round(codingScore * 0.5 + systemDesignScore * 0.25 + behavioralScore * 0.25);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestedTopics: string[] = [];

  if (codingScore >= 70) strengths.push("Strong coding fundamentals");
  else { weaknesses.push("Coding skills need improvement"); suggestedTopics.push("Arrays & Hashing", "Graphs & BFS/DFS"); }

  if (systemDesignScore >= 70) strengths.push("Good system design knowledge");
  else { weaknesses.push("System design concepts need work"); suggestedTopics.push("Distributed Systems", "Database Design"); }

  if (behavioralScore >= 70) strengths.push("Effective behavioral responses");
  else { weaknesses.push("Behavioral answers could be more structured"); suggestedTopics.push("STAR Method Practice", "Leadership Principles"); }

  if (strengths.length === 0) strengths.push("Completed all rounds");
  if (weaknesses.length === 0) weaknesses.push("Minor areas for improvement");

  return { overallScore, codingScore, systemDesignScore, behavioralScore, strengths, weaknesses, suggestedTopics };
}

export function scoreRoundAnswer(answer: string, roundType: RoundType): number {
  return scoreAnswer(answer, roundType);
}

export { COMPANIES, ROLES };
