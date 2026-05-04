import { generateStudyPlan as mockGeneratePlan } from "./studyPlanEngine";
import { getCompanyInsights as mockGetInsights } from "./studyPlanEngine";
import { getAnalytics as mockGetAnalytics } from "./studyPlanEngine";

const API_BASE_URL = "http://localhost:5000";

// ─────────────────────────────────────────────
// CORE API FUNCTIONS
// ─────────────────────────────────────────────

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

export async function rescheduleTasks(company: string, completedTaskIds: string[], isOnline?: boolean) {
  if (!isOnline) {
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

  // Convert company name to slug
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

export async function fetchAnalytics(company: string) {
  // Call the new dedicated analytics route which reads from the live SQLite DB
  const response = await fetch(`http://localhost:5000/analytics/${company}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `No live data found for ${company}. Run the ETL pipeline first.`);
  }

  const data = await response.json();
  
  // The backend returns { difficultyLeaderboard, analyticsDashboard, extractedLists }
  // We only need the analyticsDashboard payload for the charts
  return data.analyticsDashboard;
}
// ─────────────────────────────────────────────
// NEW: AI POWERED GAP PRIORITIZATION
// ─────────────────────────────────────────────

export async function fetchAIPriorities(company: string, insights: any, gaps: any) {
  const response = await fetch(`${API_BASE_URL}/prioritize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, insights, gaps })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate AI priorities");
  }
  
  const data = await response.json();
  return data.data;
}