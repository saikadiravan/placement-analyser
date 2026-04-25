import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Calendar, Download, Trash2, BookOpen, ArrowLeft, Database, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { COMPANIES, ROLES } from "@/lib/studyPlanEngine";
import { fetchStudyPlan, runETLPipeline } from "@/lib/api"; 

const categoryColors: Record<string, string> = {
  dsa: "bg-primary/10 text-primary border-primary/20",
  "system-design": "bg-accent/10 text-accent border-accent/20",
  behavioral: "bg-success/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",
  review: "bg-warning/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20"
};

export default function StudyPlanGenerator() {
  // --- STATE ---
  const [savedPlans, setSavedPlans] = useState<Record<string, any>>({});
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  
  // Form State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState("");
  
  // Loading States
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const localData = localStorage.getItem("studyPlansMap");
    if (localData) {
      setSavedPlans(JSON.parse(localData));
    }
  }, []);

  const saveToStorage = (newPlans: Record<string, any>) => {
    setSavedPlans(newPlans);
    localStorage.setItem("studyPlansMap", JSON.stringify(newPlans));
  };

  // --- ACTIONS ---
   // --- STEP 1: EXTRACTION LOGIC (Online Only) ---
  const handleExtract = async () => {
    if (!company) return;
    setIsExtracting(true);
    try {
      // FIX: Check if the INSIGHTS file exists to skip the ETL scraper!
      const checkRes = await fetch(`http://localhost:5000/insights/${company}`);
      
      if (checkRes.ok) {
         toast.success(`Verified insights already exist for ${company}!`);
      } else {
         toast.info(`Running Multi-Agent ETL Pipeline for ${company}...`);
         await runETLPipeline(company, role || "SDE");
         toast.success(`Successfully scraped and extracted insights for ${company}!`);
      }
      setIsExtracted(true); // Unlock Step 2
    } catch (error) {
      toast.error("ETL Pipeline failed to extract data.");
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };
  const handleGenerate = async () => {
    if (!company || !role || !duration) return;
    
    const planId = `${company}-${role}`;
    
    // 1. Read existing files to save Gemini API Key usage!
    if (savedPlans[planId]) {
      toast.info(`Loaded existing plan for ${company} to save API quota.`);
      setActivePlanId(planId);
      return;
    }

    // 2. Call the backend if no local plan exists
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:5000/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, duration: parseInt(duration) })
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        const updatedPlans = { ...savedPlans, [planId]: data.data };
        saveToStorage(updatedPlans);
        setActivePlanId(planId);
        toast.success("AI Study Plan generated successfully!");
      } else {
        toast.error("Failed to generate plan. Check backend logs.");
      }
    } catch (error) {
      toast.error("Backend offline. Ensure app.py is running on port 5000.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (planId: string) => {
    const updatedPlans = { ...savedPlans };
    delete updatedPlans[planId];
    saveToStorage(updatedPlans);
    if (activePlanId === planId) {
      setActivePlanId(null);
    }
    toast.success("Study plan deleted.");
  };

  const toggleTask = (dayNum: number, taskTitle: string) => {
    if (!activePlanId) return;
    const plan = savedPlans[activePlanId];
    
    const updatedPlan = {
      ...plan,
      schedule: plan.schedule.map((d: any) =>
        d.day === dayNum
          ? { ...d, tasks: d.tasks.map((t: any) => t.title === taskTitle ? { ...t, completed: !t.completed } : t) }
          : d
      )
    };
    
    saveToStorage({ ...savedPlans, [activePlanId]: updatedPlan });
  };

  const handleDownload = () => {
    if (!activePlanId) return;
    const plan = savedPlans[activePlanId];
    let text = `Study Plan: ${plan.company} - ${plan.role} (${plan.total_days} days)\n${"=".repeat(60)}\n\n`;
    plan.schedule.forEach((d: any) => {
      text += `Day ${d.day} - ${d.focus}\nTip: ${d.tips}\n${"-".repeat(40)}\n`;
      d.tasks.forEach((t: any) => {
        text += `  [${t.completed ? "x" : " "}] ${t.title} (${t.category})\n`;
      });
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

  const activePlan = activePlanId ? savedPlans[activePlanId] : null;
  if (activePlanId && !activePlan) {
  return <div>Loading plan...</div>;
}
  const totalTasks = activePlan?.schedule?.reduce((a: number, d: any) => a + d.tasks.length, 0) ?? 0;
  const completedTasks = activePlan?.schedule?.reduce((a: number, d: any) => a + d.tasks.filter((t: any) => t.completed).length, 0) ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Study Plan Generator</h1>
          <p className="mt-2 text-muted-foreground">Extract live data, generate AI roadmaps, and manage multiple plans.</p>
        </motion.div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {!activePlanId ? (
              /* --- VIEW 1: DASHBOARD & GENERATOR --- */
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-8 lg:grid-cols-[400px_1fr]">
                
                {/* Creator Panel */}
                <div className="glass-card rounded-xl p-6 h-fit space-y-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Create New Plan
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Target Company</label>
                      <Select value={company} onValueChange={setCompany}>
                        <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                        <SelectContent>{COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Target Role</label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Duration</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">14 Days (Crash Course)</SelectItem>
                          <SelectItem value="21">21 Days (Standard)</SelectItem>
                          <SelectItem value="30">30 Days (Comprehensive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button variant="outline" className="w-full" disabled={!company || !role || isExtracting} onClick={handleExtract}>
                        {isExtracting ? "Extracting Data..." : <><Database className="mr-2 h-4 w-4" /> Step 1: Extract Live Data</>}
                      </Button>
                      <Button className="w-full gradient-bg text-primary-foreground" disabled={!company || !role || !duration || isGenerating} onClick={handleGenerate}>
                        {isGenerating ? "AI is planning..." : <><Play className="mr-2 h-4 w-4" /> Step 2: Generate / Load Plan</>}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Saved Plans Grid */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Your Saved Plans
                  </h3>
                  
                  {Object.keys(savedPlans).length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                      <p className="text-sm text-muted-foreground">No plans saved yet. Generate one to get started.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(savedPlans).map(([id, plan]) => (
                        <div key={id} className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg">{plan.company}</h4>
                              <p className="text-sm text-muted-foreground">{plan.role} • {plan.total_days} Days</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button className="w-full" onClick={() => setActivePlanId(id)}>
                            Resume Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

            ) : (

              /* --- VIEW 2: ACTIVE PLAN RENDERER --- */
              <motion.div key="active-plan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <Button variant="ghost" onClick={() => setActivePlanId(null)} className="mb-2 -ml-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Exit to Dashboard
                </Button>

                <div className="glass-card rounded-xl p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {activePlan?.company || "Loading..."} Study Plan
                      </h2>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">{activePlan?.role || "-"}</Badge>
                        <Badge variant="outline">{activePlan?.total_days || 0} Days</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(activePlanId)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</p>
                  </div>

                  <div className="space-y-6">
                    {activePlan?.schedule?.map((dayBlock: any, index: number) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                            D{dayBlock.day}
                          </div>
                          <div>
                            <h3 className="font-semibold">{dayBlock.focus}</h3>
                            <p className="text-sm italic text-muted-foreground">💡 {dayBlock.tips}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4 pl-12">
                          {dayBlock.tasks.map((task: any, tIndex: number) => (
                            <label key={tIndex} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${task.completed ? 'bg-muted/30 opacity-70' : ''}`}>
                              <Checkbox className="mt-1" checked={task.completed || false} onCheckedChange={() => toggleTask(dayBlock.day, task.title)} />
                              <div className="flex-1">
                                <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                              </div>
                              <Badge className={`${categoryColors[task.category] || "bg-muted text-foreground"} shrink-0`} variant="outline">
                                {task.category}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}