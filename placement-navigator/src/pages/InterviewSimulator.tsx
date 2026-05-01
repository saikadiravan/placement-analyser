// import { useState, useEffect, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Play, Clock, SkipForward, RotateCcw, CheckCircle2, ChevronRight, Code, Server, Users, Zap, Save } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts";
// import {
//   generateInterviewSession,
//   evaluateSimulation,
//   scoreRoundAnswer,
//   COMPANIES,
//   ROLES,
//   type InterviewSession,
//   type RoundResult,
//   type SimulationFeedback,
//   type RoundType,
// } from "@/lib/interviewSimulator";

// // ─── Timer hook ───
// function useTimer(initialSeconds: number, running: boolean) {
//   const [seconds, setSeconds] = useState(initialSeconds);
//   useEffect(() => { setSeconds(initialSeconds); }, [initialSeconds]);
//   useEffect(() => {
//     if (!running) return;
//     const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
//     return () => clearInterval(id);
//   }, [running]);
//   return seconds;
// }

// function formatTime(s: number) {
//   const m = Math.floor(s / 60);
//   const sec = s % 60;
//   return `${m}:${sec.toString().padStart(2, "0")}`;
// }

// const roundTypeConfig: Record<RoundType, { icon: typeof Code; label: string; color: string }> = {
//   coding: { icon: Code, label: "Coding", color: "bg-primary/10 text-primary" },
//   "system-design": { icon: Server, label: "System Design", color: "bg-accent/10 text-accent" },
//   behavioral: { icon: Users, label: "Behavioral", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
// };

// type Phase = "setup" | "simulation" | "feedback";

// export default function InterviewSimulator() {
//   const [phase, setPhase] = useState<Phase>("setup");
//   const [company, setCompany] = useState("");
//   const [role, setRole] = useState("");
//   const [session, setSession] = useState<InterviewSession | null>(null);
//   const [currentRound, setCurrentRound] = useState(0);
//   const [answers, setAnswers] = useState<string[]>([]);
//   const [results, setResults] = useState<RoundResult[]>([]);
//   const [feedback, setFeedback] = useState<SimulationFeedback | null>(null);
//   const [timerRunning, setTimerRunning] = useState(false);
//   const [roundStartTime, setRoundStartTime] = useState(0);

//   const activeRound = session?.rounds[currentRound];
//   const timeLeft = useTimer(activeRound?.timeLimit ?? 0, timerRunning);

//   const startSimulation = useCallback(() => {
//     if (!company || !role) return;
//     const s = generateInterviewSession(company, role);
//     setSession(s);
//     setAnswers(new Array(s.rounds.length).fill(""));
//     setResults([]);
//     setCurrentRound(0);
//     setTimerRunning(true);
//     setRoundStartTime(Date.now());
//     setPhase("simulation");
//   }, [company, role]);

//   const submitRound = useCallback(() => {
//     if (!session || !activeRound) return;
//     const timeSpent = Math.round((Date.now() - roundStartTime) / 1000);
//     const score = scoreRoundAnswer(answers[currentRound], activeRound.type);
//     const result: RoundResult = { roundId: activeRound.id, answer: answers[currentRound], timeSpent, score };
//     const newResults = [...results, result];
//     setResults(newResults);
//     setTimerRunning(false);

//     if (currentRound < session.rounds.length - 1) {
//       setCurrentRound((r) => r + 1);
//       setRoundStartTime(Date.now());
//       setTimerRunning(true);
//     } else {
//       const fb = evaluateSimulation(session, newResults);
//       setFeedback(fb);
//       setPhase("feedback");
//     }
//   }, [session, activeRound, answers, currentRound, results, roundStartTime]);

//   const skipRound = useCallback(() => {
//     if (!session || !activeRound) return;
//     const result: RoundResult = { roundId: activeRound.id, answer: "", timeSpent: 0, score: 0 };
//     const newResults = [...results, result];
//     setResults(newResults);
//     setTimerRunning(false);

//     if (currentRound < session.rounds.length - 1) {
//       setCurrentRound((r) => r + 1);
//       setRoundStartTime(Date.now());
//       setTimerRunning(true);
//     } else {
//       const fb = evaluateSimulation(session, newResults);
//       setFeedback(fb);
//       setPhase("feedback");
//     }
//   }, [session, activeRound, currentRound, results]);

//   const restart = () => {
//     setPhase("setup");
//     setSession(null);
//     setFeedback(null);
//     setResults([]);
//     setTimerRunning(false);
//   };

//   return (
//     <div className="container mx-auto max-w-5xl px-4 py-8">
//       <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//         <h1 className="text-3xl font-bold tracking-tight">
//           Interview <span className="gradient-text">Simulator</span>
//         </h1>
//         <p className="mt-1 text-muted-foreground">Replay real interview flows and practice your responses</p>
//       </motion.div>

//       <AnimatePresence mode="wait">
//         {phase === "setup" && (
//           <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <SetupPhase company={company} role={role} setCompany={setCompany} setRole={setRole} onStart={startSimulation} />
//           </motion.div>
//         )}
//         {phase === "simulation" && session && activeRound && (
//           <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <SimulationPhase
//               session={session}
//               currentRound={currentRound}
//               activeRound={activeRound}
//               timeLeft={timeLeft}
//               answer={answers[currentRound]}
//               onAnswerChange={(v) => { const a = [...answers]; a[currentRound] = v; setAnswers(a); }}
//               onSubmit={submitRound}
//               onSkip={skipRound}
//             />
//           </motion.div>
//         )}
//         {phase === "feedback" && feedback && session && (
//           <motion.div key="fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <FeedbackPhase feedback={feedback} session={session} results={results} onRestart={restart} onReplay={startSimulation} />
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // ─── Setup ───
// function SetupPhase({ company, role, setCompany, setRole, onStart }: { company: string; role: string; setCompany: (v: string) => void; setRole: (v: string) => void; onStart: () => void }) {
//   return (
//     <Card className="glass-card mx-auto max-w-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Start Interview Simulation</CardTitle>
//         <CardDescription>Select a company and role to begin a realistic interview replay</CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div>
//           <label className="mb-1.5 block text-sm font-medium">Target Company</label>
//           <Select value={company} onValueChange={setCompany}>
//             <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
//             <SelectContent>{COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
//           </Select>
//         </div>
//         <div>
//           <label className="mb-1.5 block text-sm font-medium">Target Role</label>
//           <Select value={role} onValueChange={setRole}>
//             <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
//             <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
//           </Select>
//         </div>
//         <Button className="w-full gradient-bg text-primary-foreground" size="lg" disabled={!company || !role} onClick={onStart}>
//           <Play className="mr-2 h-4 w-4" /> Start Interview Simulation
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

// // ─── Simulation ───
// function SimulationPhase({ session, currentRound, activeRound, timeLeft, answer, onAnswerChange, onSubmit, onSkip }: {
//   session: InterviewSession; currentRound: number; activeRound: NonNullable<InterviewSession["rounds"][number]>;
//   timeLeft: number; answer: string; onAnswerChange: (v: string) => void; onSubmit: () => void; onSkip: () => void;
// }) {
//   const cfg = roundTypeConfig[activeRound.type];
//   const Icon = cfg.icon;
//   const progress = ((currentRound + 1) / session.rounds.length) * 100;
//   const timerDanger = timeLeft < 120;

//   return (
//     <div className="space-y-6">
//       {/* Timeline */}
//       <div className="flex items-center gap-2">
//         {session.rounds.map((r, i) => {
//           const rc = roundTypeConfig[r.type];
//           const done = i < currentRound;
//           const active = i === currentRound;
//           return (
//             <div key={r.id} className="flex items-center gap-2">
//               <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
//                 {done ? <CheckCircle2 className="h-4 w-4" /> : <rc.icon className="h-4 w-4" />}
//               </div>
//               {i < session.rounds.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
//             </div>
//           );
//         })}
//         <div className="ml-auto text-sm text-muted-foreground">Round {currentRound + 1}/{session.rounds.length}</div>
//       </div>
//       <Progress value={progress} className="h-2" />

//       {/* Round card */}
//       <motion.div key={activeRound.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
//         <Card className="glass-card">
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <Badge className={cfg.color}><Icon className="mr-1 h-3 w-3" />{cfg.label}</Badge>
//                 <CardTitle className="text-xl">{activeRound.title}</CardTitle>
//               </div>
//               <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${timerDanger ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
//                 <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="rounded-lg bg-muted/50 p-4">
//               <p className="text-sm font-medium text-muted-foreground mb-2">Interviewer:</p>
//               <p className="whitespace-pre-wrap text-sm leading-relaxed">{activeRound.prompt}</p>
//             </div>

//             {activeRound.hints && activeRound.hints.length > 0 && (
//               <details className="text-sm">
//                 <summary className="cursor-pointer text-muted-foreground hover:text-foreground">💡 Show hints</summary>
//                 <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
//                   {activeRound.hints.map((h, i) => <li key={i}>{h}</li>)}
//                 </ul>
//               </details>
//             )}

//             <div>
//               <label className="mb-1.5 block text-sm font-medium">Your Response</label>
//               <Textarea
//                 value={answer}
//                 onChange={(e) => onAnswerChange(e.target.value)}
//                 placeholder={activeRound.type === "coding" ? "Write your solution here..." : activeRound.type === "system-design" ? "Describe your system architecture..." : "Structure your answer using the STAR method..."}
//                 className={`min-h-[200px] ${activeRound.type === "coding" ? "font-mono text-sm" : ""}`}
//               />
//             </div>

//             <div className="flex gap-3">
//               <Button className="flex-1 gradient-bg text-primary-foreground" onClick={onSubmit}>
//                 Submit Answer <ChevronRight className="ml-1 h-4 w-4" />
//               </Button>
//               <Button variant="outline" onClick={onSkip}>
//                 <SkipForward className="mr-1 h-4 w-4" /> Skip
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Feedback ───
// function FeedbackPhase({ feedback, session, results, onRestart, onReplay }: {
//   feedback: SimulationFeedback; session: InterviewSession; results: RoundResult[]; onRestart: () => void; onReplay: () => void;
// }) {
//   const radarData = [
//     { subject: "Coding", score: feedback.codingScore, fullMark: 100 },
//     { subject: "System Design", score: feedback.systemDesignScore, fullMark: 100 },
//     { subject: "Behavioral", score: feedback.behavioralScore, fullMark: 100 },
//   ];

//   const scoreColor = feedback.overallScore >= 70 ? "text-[hsl(var(--success))]" : feedback.overallScore >= 50 ? "text-[hsl(var(--warning))]" : "text-destructive";

//   return (
//     <div className="space-y-6">
//       <Card className="glass-card text-center">
//         <CardContent className="py-8">
//           <p className="text-sm font-medium text-muted-foreground mb-2">Interview Readiness Score</p>
//           <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }} className={`text-6xl font-bold ${scoreColor}`}>
//             {feedback.overallScore}%
//           </motion.p>
//           <p className="mt-2 text-muted-foreground">{session.company} · {session.role}</p>
//         </CardContent>
//       </Card>

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* Radar */}
//         <Card className="glass-card">
//           <CardHeader><CardTitle className="text-lg">Skill Breakdown</CardTitle></CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={260}>
//               <RadarChart data={radarData}>
//                 <PolarGrid stroke="hsl(var(--border))" />
//                 <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
//                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
//                 <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
//               </RadarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         {/* Strengths & Weaknesses */}
//         <Card className="glass-card">
//           <CardHeader><CardTitle className="text-lg">Feedback</CardTitle></CardHeader>
//           <CardContent className="space-y-4">
//             <div>
//               <p className="mb-2 text-sm font-semibold text-[hsl(var(--success))]">✓ Strengths</p>
//               <ul className="space-y-1 text-sm">{feedback.strengths.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul>
//             </div>
//             <div>
//               <p className="mb-2 text-sm font-semibold text-destructive">✗ Weaknesses</p>
//               <ul className="space-y-1 text-sm">{feedback.weaknesses.map((w, i) => <li key={i} className="text-muted-foreground">• {w}</li>)}</ul>
//             </div>
//             <div>
//               <p className="mb-2 text-sm font-semibold text-primary">📚 Suggested Topics</p>
//               <div className="flex flex-wrap gap-2">{feedback.suggestedTopics.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Round-by-round results */}
//       <Card className="glass-card">
//         <CardHeader><CardTitle className="text-lg">Round Results</CardTitle></CardHeader>
//         <CardContent className="space-y-3">
//           {session.rounds.map((round, i) => {
//             const result = results[i];
//             const cfg = roundTypeConfig[round.type];
//             const Icon = cfg.icon;
//             return (
//               <div key={round.id} className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
//                 <Badge className={cfg.color}><Icon className="mr-1 h-3 w-3" />{cfg.label}</Badge>
//                 <span className="flex-1 text-sm font-medium truncate">{round.title}</span>
//                 <span className="text-sm text-muted-foreground">{formatTime(result?.timeSpent ?? 0)}</span>
//                 <span className={`text-sm font-bold ${(result?.score ?? 0) >= 70 ? "text-[hsl(var(--success))]" : (result?.score ?? 0) >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive"}`}>
//                   {result?.score ?? 0}%
//                 </span>
//               </div>
//             );
//           })}
//         </CardContent>
//       </Card>

//       <div className="flex gap-3">
//         <Button className="flex-1 gradient-bg text-primary-foreground" onClick={onReplay}>
//           <RotateCcw className="mr-2 h-4 w-4" /> Replay Interview
//         </Button>
//         <Button variant="outline" className="flex-1" onClick={onRestart}>
//           <Save className="mr-2 h-4 w-4" /> New Simulation
//         </Button>
//       </div>
//     </div>
//   );
// }
