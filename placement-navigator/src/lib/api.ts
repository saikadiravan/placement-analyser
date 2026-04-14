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
  return {
    company: data.company || company,
    role: data.role || role,
    duration: data.total_days || duration,
    createdAt: new Date().toISOString(),
    days: data.schedule.map((dayObj: any) => ({
      day: dayObj.day,
      date: dayObj.date || new Date().toISOString(),
      tasks: dayObj.tasks.map((task: any) => ({
        id: task.id || Math.random().toString(36).substr(2, 9),
        title: task.title,
        category: task.category || "dsa",
        completed: task.completed || false
      }))
    }))
  };
}