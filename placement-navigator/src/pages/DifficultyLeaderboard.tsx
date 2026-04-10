import { useMemo } from "react";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { getDifficultyLeaderboard, type DifficultyBreakdown } from "@/lib/analyticsEngine";
import { Trophy, TrendingUp, Award } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 8) return "hsl(0,72%,55%)";
  if (score >= 6) return "hsl(38,92%,55%)";
  return "hsl(152,60%,45%)";
}

export default function DifficultyLeaderboard() {
  const leaderboard = useMemo(() => getDifficultyLeaderboard(), []);
  const selected = leaderboard[0]; // top company for radar

  const radarData = useMemo(() => {
    if (!selected) return [];
    return [
      { axis: "Problem Difficulty", value: selected.avgProblemDifficulty },
      { axis: "Number of Rounds", value: (selected.numRounds / 5) * 10 },
      { axis: "System Design", value: selected.systemDesignWeight * 10 },
      { axis: "DSA Difficulty", value: selected.dsaDifficulty },
      { axis: "Behavioral", value: selected.behavioralWeight * 10 },
    ];
  }, [selected]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Company Difficulty Leaderboard</h1>
              <p className="mt-1 text-muted-foreground">Interview difficulty scores computed from rounds, DSA complexity, and system design weight</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Top 3 Podium */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Award className="h-5 w-5 text-primary" /> Difficulty Rankings
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={leaderboard} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="company" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }}
                    formatter={(val: number) => [val.toFixed(1), "Score"]}
                  />
                  <Bar dataKey="overallScore" radius={[0, 4, 4, 0]}>
                    {leaderboard.map((entry, i) => (
                      <Cell key={i} fill={scoreColor(entry.overallScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Radar for top company */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-2 text-lg font-semibold">Hardest: {selected.company}</h3>
              <p className="mb-4 text-sm text-muted-foreground">Score: {selected.overallScore}/10</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220,15%,90%)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="value" stroke="hsl(238,73%,58%)" fill="hsl(238,73%,58%)" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Formula explanation */}
            <div className="mt-4 glass-card rounded-xl p-5">
              <h4 className="flex items-center gap-2 font-semibold text-sm">
                <TrendingUp className="h-4 w-4 text-accent" /> Scoring Formula
              </h4>
              <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">
                score = 0.5 × avg_difficulty<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.3 × (rounds / 5) × 10<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.2 × sys_design_weight × 10
              </p>
            </div>
          </motion.div>
        </div>

        {/* Full Leaderboard Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Rank</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-center font-medium">Score</th>
                  <th className="px-4 py-3 text-center font-medium">Rounds</th>
                  <th className="px-4 py-3 text-center font-medium">DSA Diff.</th>
                  <th className="px-4 py-3 text-center font-medium">Sys Design</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, i) => (
                  <tr key={c.company} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold" style={{ color: scoreColor(c.overallScore) }}>#{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{c.company}</td>
                    <td className="px-4 py-3 text-center font-bold">{c.overallScore}</td>
                    <td className="px-4 py-3 text-center">{c.numRounds}</td>
                    <td className="px-4 py-3 text-center">{c.dsaDifficulty}</td>
                    <td className="px-4 py-3 text-center">{(c.systemDesignWeight * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
