import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { COMPANIES } from "@/lib/studyPlanEngine";
import { ALL_TOPICS, analyzeGaps, calculateReadiness, type GapAnalysis, type ReadinessScore } from "@/lib/analyticsEngine";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle2, Target, Brain } from "lucide-react";

export default function GapAnalyzer() {
  const [company, setCompany] = useState("Google");
  const [completedDsa, setCompletedDsa] = useState<string[]>([]);
  const [completedSD, setCompletedSD] = useState<string[]>([]);
  const [completedBeh, setCompletedBeh] = useState<string[]>([]);
  const [mockScore, setMockScore] = useState(65);

  const gap: GapAnalysis = useMemo(
    () => analyzeGaps(company, completedDsa, completedSD, completedBeh),
    [company, completedDsa, completedSD, completedBeh]
  );

  const readiness: ReadinessScore = useMemo(
    () => calculateReadiness(company, gap, completedDsa.length + completedSD.length + completedBeh.length, 20, mockScore),
    [company, gap, completedDsa, completedSD, completedBeh, mockScore]
  );

  const radarData = [
    { axis: "DSA", value: readiness.dsaReadiness },
    { axis: "System Design", value: readiness.systemDesignReadiness },
    { axis: "Behavioral", value: readiness.behavioralReadiness },
    { axis: "Practice", value: readiness.practiceScore },
    { axis: "Mock Score", value: mockScore },
  ];

  const toggle = (list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter((prev) => prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Topic Gap Analyzer & Readiness</h1>
            <p className="mt-1 text-muted-foreground">Compare your skills against company requirements</p>
          </div>
          <div className="w-48">
            <Select value={company} onValueChange={(c) => { setCompany(c); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Readiness Score Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="mt-8 glass-card rounded-xl p-8 text-center">
          <Brain className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Interview Readiness for {company}</p>
          <p className="mt-1 text-6xl font-extrabold gradient-text inline-block">{readiness.overall}%</p>
          <div className="mt-4 mx-auto max-w-md">
            <Progress value={readiness.overall} className="h-3" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 max-w-lg mx-auto text-sm">
            <div className="glass-card rounded-lg p-3"><span className="text-muted-foreground">DSA</span><p className="text-lg font-bold">{readiness.dsaReadiness}%</p></div>
            <div className="glass-card rounded-lg p-3"><span className="text-muted-foreground">System Design</span><p className="text-lg font-bold">{readiness.systemDesignReadiness}%</p></div>
            <div className="glass-card rounded-lg p-3"><span className="text-muted-foreground">Behavioral</span><p className="text-lg font-bold">{readiness.behavioralReadiness}%</p></div>
            <div className="glass-card rounded-lg p-3"><span className="text-muted-foreground">Difficulty</span><p className="text-lg font-bold">{readiness.companyDifficulty}/10</p></div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Radar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Readiness Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220,15%,90%)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar dataKey="value" stroke="hsl(238,73%,58%)" fill="hsl(238,73%,58%)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gap Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Gap Summary</h3>
            {[
              { label: "DSA Topics", gaps: gap.gaps.dsa, completion: gap.dsaCompletion },
              { label: "System Design", gaps: gap.gaps.systemDesign, completion: gap.systemDesignCompletion },
              { label: "Behavioral", gaps: gap.gaps.behavioral, completion: gap.behavioralCompletion },
            ].map((section) => (
              <div key={section.label} className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{section.label}</span>
                  <span className="text-sm text-muted-foreground">{section.completion}%</span>
                </div>
                <Progress value={section.completion} className="h-2 mb-2" />
                {section.gaps.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {section.gaps.map((g) => (
                      <span key={g} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" /> {g}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> All topics covered!</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Topic Selection */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <TopicChecklist title="DSA Topics" topics={ALL_TOPICS.dsa} selected={completedDsa} onToggle={(t) => toggle(completedDsa, setCompletedDsa, t)} required={gap.required.dsa} />
          <TopicChecklist title="System Design" topics={ALL_TOPICS.systemDesign} selected={completedSD} onToggle={(t) => toggle(completedSD, setCompletedSD, t)} required={gap.required.systemDesign} />
          <TopicChecklist title="Behavioral" topics={ALL_TOPICS.behavioral} selected={completedBeh} onToggle={(t) => toggle(completedBeh, setCompletedBeh, t)} required={gap.required.behavioral} />
        </div>
      </div>
    </div>
  );
}

function TopicChecklist({ title, topics, selected, onToggle, required }: {
  title: string; topics: string[]; selected: string[]; onToggle: (t: string) => void; required: string[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
      <h4 className="mb-3 font-semibold">{title}</h4>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {topics.map((t) => {
          const isRequired = required.includes(t);
          return (
            <label key={t} className={`flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/50 transition-colors ${isRequired ? "font-medium" : "text-muted-foreground"}`}>
              <Checkbox checked={selected.includes(t)} onCheckedChange={() => onToggle(t)} />
              <span className="truncate">{t}</span>
              {isRequired && <span className="ml-auto shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">REQ</span>}
            </label>
          );
        })}
      </div>
    </motion.div>
  );
}
