// src/lib/groqAgent.ts

export async function prioritizeGapsWithGroq(
  company: string,
  insights: any,
  gaps: { dsa: string[]; systemDesign: string[]; behavioral: string[] },
  apiKey: string
) {
  if (!apiKey) throw new Error("Groq API key is missing");

  // Construct a prompt using the live data fetched from your DB
  const systemPrompt = `You are an expert technical recruiter at ${company}.
  The candidate is preparing for an interview and has the following topics left to study:
  - DSA Gaps: ${gaps.dsa.length ? gaps.dsa.join(", ") : "None"}
  - System Design Gaps: ${gaps.systemDesign.length ? gaps.systemDesign.join(", ") : "None"}
  - Behavioral Gaps: ${gaps.behavioral.length ? gaps.behavioral.join(", ") : "None"}

  Here is the live interview data for ${company} straight from our database:
  - Difficulty: ${insights?.difficulty || "Unknown"}
  - Average Rounds: ${insights?.avgRounds || "Unknown"}
  - Interview Process: ${insights?.interviewProcess?.join(" | ") || "Standard"}

  Task:
  Based ONLY on the candidate's gaps and the live company data provided, group the missing topics into "High Priority", "Medium Priority", and "Low Priority". 
  Provide a brief 1-2 sentence explanation for the High Priority items based on the company's interview process. Format the response clearly using markdown.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192", // Extremely fast Groq model
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to fetch from Groq API");
  }

  const data = await response.json();
  return data.choices.message.content;
}