import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Circle, Calendar, Clock, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COMPANIES, ROLES, generateStudyPlan, type StudyPlan, type Task } from "@/lib/studyPlanEngine";

const categoryColors: Record<string, string> = {
  dsa: "bg-primary/10 text-primary border-primary/20",
  "system-design": "bg-accent/10 text-accent border-accent/20",
  behavioral: "bg-success/10 text-success border-success/20",
};

const categoryLabels: Record<string, string> = {
  dsa: "DSA",
  "system-design": "System Design",
  behavioral: "Behavioral",
};

export default function StudyPlanGenerator() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  // Load saved plan
  useEffect(() => {
    const saved = localStorage.getItem("studyPlan");
    if (saved) setPlan(JSON.parse(saved));
  }, []);

  // Save plan on change
  useEffect(() => {
    if (plan) localStorage.setItem("studyPlan", JSON.stringify(plan));
  }, [plan]);

  const handleGenerate = () => {
    if (!company || !role || !duration) return;
    setGenerating(true);
    setTimeout(() => {
      const newPlan = generateStudyPlan(company, role, parseInt(duration));
      setPlan(newPlan);
      setGenerating(false);
    }, 1500);
  };

  const toggleTask = (dayIndex: number, taskId: string) => {
    if (!plan) return;
    const updated = { ...plan, days: plan.days.map((d, i) =>
      i === dayIndex
        ? { ...d, tasks: d.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t) }
        : d
    )};
    setPlan(updated);
  };

  const totalTasks = plan?.days.reduce((a, d) => a + d.tasks.length, 0) ?? 0;
  const completedTasks = plan?.days.reduce((a, d) => a + d.tasks.filter((t) => t.completed).length, 0) ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleDownload = () => {
    if (!plan) return;
    let text = `Study Plan: ${plan.company} - ${plan.role} (${plan.duration} days)\n${"=".repeat(60)}\n\n`;
    plan.days.forEach((d) => {
      text += `Day ${d.day} (${d.date})\n${"-".repeat(30)}\n`;
      d.tasks.forEach((t) => { text += `  [${t.completed ? "x" : " "}] ${t.title} (${categoryLabels[t.category]})\n`; });
      text += "\n";
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-plan-${plan.company.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Study Plan Generator</h1>
          <p className="mt-2 text-muted-foreground">Generate an AI-powered preparation roadmap tailored to your target company.</p>
        </motion.div>

        {/* Input Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-8 glass-card rounded-xl p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Target Company</label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="21">21 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={!company || !role || !duration || generating}
                className="w-full gradient-bg text-primary-foreground gap-2 hover:opacity-90 transition-opacity">
                {generating ? <><Sparkles className="h-4 w-4 animate-spin" /> Generating...</> : <><Zap className="h-4 w-4" /> Generate Plan</>}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Plan Display */}
        <AnimatePresence>
          {plan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
              {/* Progress Header */}
              <div className="glass-card mb-6 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{plan.company} — {plan.role}</h2>
                    <p className="text-sm text-muted-foreground">{plan.duration}-day plan • {completedTasks}/{totalTasks} tasks completed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <div className="text-right">
                      <span className="text-2xl font-bold gradient-text">{progress}%</span>
                    </div>
                  </div>
                </div>
                <Progress value={progress} className="mt-4 h-2" />

                <div className="mt-4 flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />DSA (60%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" />System Design (20%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />Behavioral (20%)</span>
                </div>
              </div>

              {/* Day Cards */}
              <div className="grid gap-4 lg:grid-cols-2">
                {plan.days.map((day, dayIdx) => {
                  const dayCompleted = day.tasks.every((t) => t.completed);
                  const dayProgress = day.tasks.length > 0 ? Math.round((day.tasks.filter((t) => t.completed).length / day.tasks.length) * 100) : 0;
                  return (
                    <motion.div key={day.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIdx * 0.03 }}
                      className={`glass-card rounded-xl p-5 transition-all ${dayCompleted ? "border-success/30 bg-success/5" : ""}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${dayCompleted ? "bg-success text-success-foreground" : "gradient-bg text-primary-foreground"}`}>
                            {day.day}
                          </div>
                          <div>
                            <span className="font-semibold">Day {day.day}</span>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{day.date}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{dayProgress}%</span>
                      </div>

                      <div className="space-y-2">
                        {day.tasks.map((task) => (
                          <button key={task.id} onClick={() => toggleTask(dayIdx, task.id)}
                            className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50">
                            {task.completed
                              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                              : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                            <div className="flex-1">
                              <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                              <Badge variant="outline" className={`ml-2 text-[10px] ${categoryColors[task.category]}`}>
                                {categoryLabels[task.category]}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
