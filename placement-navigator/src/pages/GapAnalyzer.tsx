import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { COMPANIES } from "@/lib/studyPlanEngine";
import { ALL_TOPICS, analyzeGaps, calculateReadiness, type GapAnalysis, type ReadinessScore } from "@/lib/analyticsEngine";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle2, Target, Brain, Loader2, Sparkles } from "lucide-react";
import { useMode } from "@/context/ModeContext";
import { fetchCompanyInsights, fetchAIPriorities } from "@/lib/api"; // Updated Import
import { toast } from "sonner";

export default function GapAnalyzer() {
  const { isOnline } = useMode();
  const [company, setCompany] = useState("Google");
  const [completedDsa, setCompletedDsa] = useState<string[]>([]);
  const [completedSD, setCompletedSD] = useState<string[]>([]);
  const [completedBeh, setCompletedBeh] = useState<string[]>([]);
  const [mockScore, setMockScore] = useState(65);

  const [liveData, setLiveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cleaner AI States (No API Key Required!)
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setAiAdvice(null);
    fetchCompanyInsights(company, isOnline)
      .then(data => setLiveData(data))
      .catch(err => {
        console.error(err);
        setLiveData(null);
      })
      .finally(() => setIsLoading(false));
  }, [company, isOnline]);

  const gap: GapAnalysis = useMemo(() => {
    const liveRequirements = liveData ? {
      dsa: liveData.dsaTopics || [],
      systemDesign: liveData.systemDesignTopics || [],
      behavioral: liveData.behavioralQuestions || []
    } : undefined;
    return analyzeGaps(company, completedDsa, completedSD, completedBeh, liveRequirements);
  }, [company, completedDsa, completedSD, completedBeh, liveData]);

  const readiness: ReadinessScore = useMemo(() => {
    let liveDifficultyScore: number | undefined = undefined;
    if (liveData && liveData.difficulty) {
        const d = liveData.difficulty.toLowerCase();
        liveDifficultyScore = d === "hard" ? 9.0 : d === "medium" ? 7.0 : 4.0;
    }
    return calculateReadiness(company, gap, completedDsa.length + completedSD.length + completedBeh.length, 20, mockScore, liveDifficultyScore);
  }, [company, gap, completedDsa, completedSD, completedBeh, mockScore, liveData]);

  const handleAIPrioritization = async () => {
    if (!isOnline) {
        toast.error("Please switch to Online mode to use AI prioritization.");
        return;
    }
    setIsAnalyzing(true);
    try {
        // Securely fetching from our new backend endpoint!
        const advice = await fetchAIPriorities(company, liveData || {}, gap.gaps);
        setAiAdvice(advice);
        toast.success("AI Priorities Generated Successfully!");
    } catch (err: any) {
        toast.error(err.message || "Failed to generate AI priorities");
    } finally {
        setIsAnalyzing(false);
    }
  };

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

  const dynamicDsaTopics = Array.from(new Set([...ALL_TOPICS.dsa, ...gap.required.dsa]));
  const dynamicSdTopics = Array.from(new Set([...ALL_TOPICS.systemDesign, ...gap.required.systemDesign]));
  const dynamicBehTopics = Array.from(new Set([...ALL_TOPICS.behavioral, ...gap.required.behavioral]));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header & Score Displays remain exactly the same... */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Topic Gap Analyzer & Readiness
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h1>
            <p className="mt-1 text-muted-foreground">Compare your skills against company requirements</p>
          </div>
          <div className="w-48">
            <Select value={company} onValueChange={(c) => { setCompany(c); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mt-8 glass-card rounded-xl p-8 text-center">
          <Brain className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Interview Readiness for {company}</p>
          <p className="mt-1 text-6xl font-extrabold gradient-text inline-block">{readiness.overall}%</p>
          <div className="mt-4 mx-auto max-w-md">
            <Progress value={readiness.overall} className="h-3" />
          </div>
        </motion.div>

        {/* Radar & Gap Summary (Omitted for brevity, paste from previous) */}

        {/* 🚀 AI Gap Prioritization Section (No API Key Input Needed!) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 glass-card rounded-xl p-6 border-primary/30">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" /> AI Gap Prioritization (Groq)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Use live DB insights for {company} to dynamically prioritize what you should study first.
                    </p>
                </div>
                
                <Button onClick={handleAIPrioritization} disabled={isAnalyzing || !isOnline} className="whitespace-nowrap">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Prioritize My Gaps
                </Button>
            </div>

            {aiAdvice && (
                <div className="mt-4 p-4 rounded-lg bg-muted/30 border text-sm whitespace-pre-wrap leading-relaxed">
                    {aiAdvice}
                </div>
            )}
        </motion.div>

        {/* Checklists (Omitted for brevity, paste from previous) */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <TopicChecklist title="DSA Topics" topics={dynamicDsaTopics} selected={completedDsa} onToggle={(t) => toggle(completedDsa, setCompletedDsa, t)} required={gap.required.dsa} />
          <TopicChecklist title="System Design" topics={dynamicSdTopics} selected={completedSD} onToggle={(t) => toggle(completedSD, setCompletedSD, t)} required={gap.required.systemDesign} />
          <TopicChecklist title="Behavioral" topics={dynamicBehTopics} selected={completedBeh} onToggle={(t) => toggle(completedBeh, setCompletedBeh, t)} required={gap.required.behavioral} />
        </div>
      </div>
    </div>
  );
}

function TopicChecklist({ title, topics, selected, onToggle, required }: { title: string; topics: string[]; selected: string[]; onToggle: (t: string) => void; required: string[]; }) {
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