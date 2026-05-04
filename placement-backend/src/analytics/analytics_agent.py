import json
from collections import Counter
from src.utils.db import fetch_insights

def generate_analytics(company: str) -> dict:
    print(f"\n[Analytics Agent] Crunching live chart data for {company}...")
    company_formatted = company.lower().replace(" ", "_").replace(".", "")
    
    insights = fetch_insights(company_formatted)
    
    if not insights:
        return {"error": f"Insights not found in DB for {company}. Run ETL first."}

    dsa = insights.get("dsaTopics", [])
    sd = insights.get("systemDesignTopics", [])
    beh = insights.get("behavioralQuestions", [])
    
    raw_difficulty = insights.get("difficulty", "Medium").lower()
    avg_rounds = insights.get("avgRounds", 4)
    
    base_diff_score = 9.0 if raw_difficulty == "hard" else 7.0 if raw_difficulty == "medium" else 4.0
    sd_weight = 0.8 if len(sd) > 0 else 0.2
    beh_weight = 0.8 if len(beh) > 0 else 0.4
    
    overall_score = (0.5 * base_diff_score) + (0.3 * (avg_rounds / 5.0) * 10) + (0.2 * sd_weight * 10)
    
    difficulty_breakdown = {
        "company": company,
        "overallScore": round(overall_score, 1),
        "avgProblemDifficulty": base_diff_score,
        "numRounds": avg_rounds,
        "systemDesignWeight": sd_weight,
        "behavioralWeight": beh_weight,
        "dsaDifficulty": base_diff_score + 0.5 if base_diff_score < 9 else base_diff_score
    }
    
    # ── Problem Patterns from DSA text ──────────────────────────────────────
    dsa_text = " ".join(dsa).lower()
    patterns = {
        "Two Pointer":          dsa_text.count("two") + dsa_text.count("pointer"),
        "Sliding Window":       dsa_text.count("window") + dsa_text.count("subarray"),
        "BFS/DFS":              dsa_text.count("bfs") + dsa_text.count("dfs") + dsa_text.count("graph"),
        "Dynamic Programming":  dsa_text.count("dp") + dsa_text.count("dynamic") + dsa_text.count("subsequence"),
        "Binary Search":        dsa_text.count("binary search") + dsa_text.count("sorted array"),
        "Greedy":               dsa_text.count("greedy") + dsa_text.count("maximum") + dsa_text.count("minimum")
    }
    problem_patterns = [{"pattern": k, "count": max(v, 2)} for k, v in patterns.items()]

    # ── DSA Topic Frequency ──────────────────────────────────────────────────
    # Weight by position: topics listed earlier are more frequently asked
    dsa_topic_frequency = [
        {"topic": t, "frequency": max(5, 40 - (i * 3))}
        for i, t in enumerate(dsa[:8])
    ]

    # ── Round Types — derived from actual extracted topic counts ─────────────
    n_dsa  = len(dsa)
    n_sd   = len(sd)
    n_beh  = len(beh)
    total  = max(n_dsa + n_sd + n_beh, 1)

    # Proportional raw weights
    raw_coding  = (n_dsa / total) * 100
    raw_sd      = (n_sd  / total) * 100 if n_sd  > 0 else 0
    raw_beh     = (n_beh / total) * 100 if n_beh > 0 else 0

    # OA is inferred — companies with more rounds tend to have an OA gate
    # Scale OA inversely: more rounds = smaller OA slice (OA already done early)
    oa_base     = max(10, 40 - (avg_rounds * 4))
    
    # Normalise all four so they sum to 100
    raw_total   = raw_coding + raw_sd + raw_beh + oa_base
    def norm(v): return round((v / raw_total) * 100)

    round_types_raw = [
        {"name": "Online Assessment",  "value": norm(oa_base)},
        {"name": "Technical Coding",   "value": norm(raw_coding)},
        {"name": "System Design",      "value": norm(raw_sd)},
        {"name": "Behavioral",         "value": norm(raw_beh)},
    ]

    # Fix rounding drift so values always sum exactly to 100
    computed_sum = sum(r["value"] for r in round_types_raw)
    if computed_sum != 100:
        # Add/subtract the drift from the largest slice
        largest = max(round_types_raw, key=lambda r: r["value"])
        largest["value"] += (100 - computed_sum)

    # Drop zero-value slices (e.g. no SD topics extracted)
    round_types = [r for r in round_types_raw if r["value"] > 0]

    # ── System Design Frequency ──────────────────────────────────────────────
    sd_frequency = [
        {"topic": t, "frequency": max(5, 30 - (i * 5))}
        for i, t in enumerate(sd[:6])
    ]

    analytics_data = {
        "dsaTopicFrequency":    dsa_topic_frequency,
        "roundTypes":           round_types,
        "problemPatterns":      problem_patterns,
        "systemDesignFrequency": sd_frequency,
    }

    return {
        "difficultyLeaderboard": difficulty_breakdown,
        "analyticsDashboard":    analytics_data,
        "extractedLists": {
            "dsa":          dsa,
            "systemDesign": sd,
            "behavioral":   beh,
        }
    }