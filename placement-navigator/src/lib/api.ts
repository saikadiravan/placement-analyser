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

export async function fetchCompanyInsights(company: string) {
  const response = await fetch(`${API_BASE_URL}/insights/${company}`);
  
  if (!response.ok) {
    throw new Error("No live data found for this company yet. Run the ETL pipeline first.");
  }

  return await response.json();
}

export async function rescheduleTasks(company: string, completedTaskIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company,
      completed_task_ids: completedTaskIds.filter(Boolean),
    })
  });

  if (!response.ok) {
    throw new Error("Failed to reschedule tasks in the database");
  }

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
  duration: number
) {
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

  return data.status === "success" ? data.data : data;
}

export async function fetchAnalytics(company: string) {
  // Normalize the company name to a slug to match backend expectations
  const companySlug = company
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/\./g, "");

  // Add a timestamp query parameter to bust any browser/network caching
  const timestamp = Date.now();
  const response = await fetch(`${API_BASE_URL}/analytics/${companySlug}?t=${timestamp}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `No live data found for ${company}. Run the ETL pipeline first.`
    );
  }

  const data = await response.json();
  return data.analyticsDashboard;
}

// ─────────────────────────────────────────────
// AI POWERED GAP PRIORITIZATION
// ─────────────────────────────────────────────

export async function fetchAIPriorities(
  company: string,
  insights: any,
  gaps: any
) {
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