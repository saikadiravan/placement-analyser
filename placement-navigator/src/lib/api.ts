import { generateStudyPlan as mockGeneratePlan } from "./studyPlanEngine";
import { getCompanyInsights as mockGetInsights } from "./studyPlanEngine";
import { getAnalytics as mockGetAnalytics } from "./studyPlanEngine";

const API_BASE_URL = "http://localhost:5000";

export async function runETLPipeline(company: string, role: string) {
  const response = await fetch(`${API_BASE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, role })
  });
  
  if (!response.ok) throw new Error("ETL pipeline failed to extract data");
  return await response.json();
}

export async function fetchCompanyInsights(company: string, isOnline: boolean) { 
  if (!isOnline) {
    return mockGetInsights(company); // Offline Mode
  }

  const response = await fetch(`${API_BASE_URL}/insights/${company}`);
  if (!response.ok) throw new Error("No live data found for this company yet. Run the ETL pipeline first.");
  return await response.json();
}

// Add this to the bottom of src/lib/api.ts
export async function rescheduleTasks(company: string, completedTaskIds: string[], isOnline?: boolean) {
  if (!isOnline) {
    // If offline, you can fall back to the mock engine or throw an error
    throw new Error("Rescheduling requires online mode to update the database.");
  }

  const response = await fetch(`${API_BASE_URL}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  company,
  completed_task_ids: completedTaskIds.filter(Boolean),
})
  });

  if (!response.ok) throw new Error("Failed to reschedule tasks in the database");
  return await response.json();
}

export async function chatWithAI(company: string, user_query: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, user_query })
  });
  
  if (!response.ok) throw new Error("Failed to get response from AI");
  return await response.json();
}

export async function fetchStudyPlan(
  company: string,
  role: string,
  duration: number,
  isOnline: boolean
) {
  if (!isOnline) {
    // OFFLINE MODE
    return mockGeneratePlan(company, role, duration);
  }

  // Convert company name to slug (e.g., "JP Morgan" → "jp_morgan")
  const companySlug = company
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/\./g, "");

  // Try fetching existing schedule first
  let response = await fetch(`${API_BASE_URL}/schedule/${companySlug}`);
  
  // If not found, generate new plan
  if (!response.ok) {
    response = await fetch(`${API_BASE_URL}/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, duration_days: duration })
    });
  }
  
  if (!response.ok) throw new Error("Failed to fetch or generate live plan");
  const data = await response.json();
  
  // Transform backend → frontend format
  return data.status === "success" ? data.data : data;
}

// ✅ ADDED FUNCTION
export async function fetchAnalytics(company: string, isOnline: boolean) {
  if (!isOnline) {
    // OFFLINE MODE: Use existing mock logic
    return mockGetAnalytics(company);
  }

  // ONLINE MODE: Fetch from insights endpoint
  const response = await fetch(`${API_BASE_URL}/insights/${company}`);
  
  if (!response.ok) {
    throw new Error("No insights found. Run the ETL pipeline first.");
  }
  
  const insight = await response.json();
  
  // Transform data for charts
  return {
    // Bar Chart: DSA Topics
    dsaTopicFrequency: (insight.dsaTopics || []).slice(0, 10).map((t: string, i: number) => ({
      topic: t.length > 20 ? t.substring(0, 20) + "..." : t,
      frequency: Math.max(10, 50 - i * 4) 
    })),
    
    // Pie Chart: Interview Rounds
    roundTypes: [
      { name: "Technical/Coding", value: 50 },
      { name: "System Design", value: 20 },
      { name: "Behavioral", value: 20 },
      { name: "Online Assessment", value: 10 }
    ],
    
    // Radar Chart: Patterns
    problemPatterns: [
      { pattern: "Arrays & Strings", count: 25 },
      { pattern: "Graphs/Trees", count: 20 },
      { pattern: "Dynamic Programming", count: 15 },
      { pattern: "System Design", count: 10 },
      { pattern: "Behavioral", count: 10 }
    ],
    
    // Bar Chart: System Design
    systemDesignFrequency: (insight.systemDesignTopics || []).slice(0, 6).map((t: string, i: number) => ({
      topic: t.length > 20 ? t.substring(0, 20) + "..." : t,
      frequency: Math.max(5, 30 - i * 3)
    }))
  };
}