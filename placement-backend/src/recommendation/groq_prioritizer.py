from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import json
from groq import Groq

router = APIRouter()

CATEGORY_WEIGHTS = {"dsa": 1, "systemDesign": 2, "behavioral": 3}

FALLBACK_BY_CATEGORY = {
    "dsa": {
        "source": "LeetCode",
        "baseLink": "https://leetcode.com/problemset/",
        "reason": "High-frequency coding pattern consistently tested in {company} coding rounds.",
    },
    "systemDesign": {
        "source": "System Design Primer",
        "baseLink": "https://github.com/donnemartin/system-design-primer",
        "reason": "Core system design concept that {company} tests in design interviews.",
    },
    "behavioral": {
        "source": "Amazon Leadership Principles",
        "baseLink": "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
        "reason": "Behavioral alignment is critical at {company} — expect STAR-format questions on this.",
    },
}

KNOWN_LEETCODE_LINKS = {
    "Number of Islands": "https://leetcode.com/problems/number-of-islands/",
    "LRU Cache": "https://leetcode.com/problems/lru-cache/",
    "Two Sum": "https://leetcode.com/problems/two-sum/",
    "Maximum Subarray": "https://leetcode.com/problems/maximum-subarray/",
    "Longest Increasing Subsequence": "https://leetcode.com/problems/longest-increasing-subsequence/",
    "Word Ladder": "https://leetcode.com/problems/word-ladder/",
    "Merge Intervals": "https://leetcode.com/problems/merge-intervals/",
    "Binary Tree Level Order Traversal": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    "Course Schedule": "https://leetcode.com/problems/course-schedule/",
    "Top K Frequent Elements": "https://leetcode.com/problems/top-k-frequent-elements/",
}


class SmartPrioritizeRequest(BaseModel):
    company: str
    gaps: List[Dict[str, Any]]


@router.post("/smart-prioritize")
async def smart_prioritize(req: SmartPrioritizeRequest):
    # Sort gaps by category priority (DSA first, then System Design, then Behavioral)
    sorted_gaps = sorted(
        req.gaps,
        key=lambda g: CATEGORY_WEIGHTS.get(g.get("category", ""), 99)
    )

    # Build a structured, readable gap list for the LLM
    gaps_text = "\n".join(
        f"- [{g.get('category', 'unknown').upper()}] {g.get('topic', '')}"
        for g in sorted_gaps[:20]  # cap to avoid token overflow
    )

    prompt = f"""You are a technical interview coach specializing in FAANG company preparation.

The candidate is preparing for {req.company} interviews and has identified these knowledge gaps:

{gaps_text}

Your task:
1. Select the TOP 10 most important topics from the list above (do not invent new ones).
2. For each selected topic, explain specifically WHY it is important for {req.company} interviews — reference known interview patterns, frequency, or company culture.
3. Provide a real, verifiable source link (LeetCode problem URL, GitHub repo, or official doc). Do NOT fabricate links.
4. Write a short overall recommendation in "topFocus".

Return ONLY valid JSON in this exact format, no extra text:

{{
  "prioritizedGaps": [
    {{
      "topic": "exact topic name from the list above",
      "category": "dsa | systemDesign | behavioral",
      "reason": "2-3 sentence explanation specific to {req.company}",
      "source": "source name e.g. LeetCode, System Design Primer",
      "sourceLink": "https://actual-verifiable-url.com"
    }}
  ],
  "topFocus": "One concrete recommendation for the candidate"
}}"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a technical interview expert with deep knowledge of FAANG hiring patterns. "
                        "You only return valid JSON. You never fabricate URLs or source links. "
                        "You only select topics from the candidate's provided list — never invent new ones."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)

        # Sanitize: ensure only topics from the original list are returned
        valid_topics = {g.get("topic", "").strip().lower() for g in req.gaps}
        result["prioritizedGaps"] = [
            item for item in result.get("prioritizedGaps", [])
            if item.get("topic", "").strip().lower() in valid_topics
        ]

        return result

    except Exception as e:
        print("Groq Error:", str(e))

        # Category-aware fallback
        fallback_gaps = []
        for gap in sorted_gaps[:10]:
            topic = gap.get("topic", "")
            category = gap.get("category", "dsa")
            meta = FALLBACK_BY_CATEGORY.get(category, FALLBACK_BY_CATEGORY["dsa"])

            source_link = (
                KNOWN_LEETCODE_LINKS.get(topic)
                if category == "dsa"
                else meta["baseLink"]
            ) or meta["baseLink"]

            fallback_gaps.append({
                "topic": topic,
                "category": category,
                "reason": meta["reason"].format(company=req.company),
                "source": meta["source"],
                "sourceLink": source_link,
            })

        return {
            "prioritizedGaps": fallback_gaps,
            "topFocus": (
                f"Focus on high-frequency {req.company} patterns: "
                "start with DSA, then system design fundamentals, then STAR behavioral prep."
            ),
        }