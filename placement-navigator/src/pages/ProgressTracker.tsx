import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { type StudyPlan, reschedule } from "@/lib/studyPlanEngine";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const COLORS = ["hsl(238,73%,58%)", "hsl(200,85%,55%)", "hsl(152,60%,45%)"];

export default function ProgressTracker() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("studyPlan");
    if (saved) setPlan(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (plan) localStorage.setItem("studyPlan", JSON.stringify(plan));
  }, [plan]);

  const handleReschedule = () => {
    if (!plan) return;
    const { plan: updated, missedDays } = reschedule(plan);
    if (missedDays > 0) {
      setPlan(updated);
      toast.warning(`You missed ${missedDays} day(s). Your schedule has been adjusted.`);
    } else {
      toast.success("You're on track! No rescheduling needed.");
    }
  };

  const stats = useMemo(() => {
    if (!plan) return null;
    const totalTasks = plan.days.reduce((a, d) => a + d.tasks.length, 0);
    const completed = plan.days.reduce((a, d) => a + d.tasks.filter((t) => t.completed).length, 0);

    // Streak
    let streak = 0;
    for (let i = plan.days.length - 1; i >= 0; i--) {
      if (plan.days[i].tasks.every((t) => t.completed) && plan.days[i].tasks.length > 0) streak++;
      else break;
    }

    // Weekly progress
    const weeklyProgress = plan.days.map((d) => ({
      day: `D${d.day}`,
      completed: d.tasks.filter((t) => t.completed).length,
      total: d.tasks.length,
    }));

    // Topic distribution
    const cats: Record<string, number> = {};
    plan.days.forEach((d) => d.tasks.forEach((t) => {
      if (t.completed) cats[t.category] = (cats[t.category] || 0) + 1;
    }));
    const topicDist = Object.entries(cats).map(([name, value]) => ({
      name: name === "dsa" ? "DSA" : name === "system-design" ? "System Design" : "Behavioral",
      value,
    }));

    return { totalTasks, completed, streak, weeklyProgress, topicDist, progress: Math.round((completed / totalTasks) * 100) };
  }, [plan]);

  if (!plan || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">No Study Plan Yet</h2>
          <p className="mt-2 text-muted-foreground">Generate a study plan first to track your progress.</p>
          <Link to="/generate"><Button className="mt-4 gradient-bg text-primary-foreground">Generate Plan</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Progress Tracker</h1>
            <p className="mt-2 text-muted-foreground">{plan.company} • {plan.role} • {plan.duration}-day plan</p>
          </div>
          <Button variant="outline" onClick={handleReschedule} className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Auto-Reschedule
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Overall Progress", value: `${stats.progress}%`, icon: CheckCircle2, color: "text-primary" },
            { label: "Tasks Completed", value: `${stats.completed}/${stats.totalTasks}`, icon: Trophy, color: "text-accent" },
            { label: "Current Streak", value: `${stats.streak} days`, icon: Flame, color: "text-streak" },
            { label: "Days Remaining", value: `${plan.duration - plan.days.filter((d) => d.tasks.every((t) => t.completed)).length}`, icon: Calendar, color: "text-muted-foreground" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4">
          <Progress value={stats.progress} className="h-3" />
        </div>

        {/* Streak Badges */}
        {stats.streak >= 3 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mt-6 flex items-center gap-3 rounded-xl border border-streak/30 bg-streak/5 p-4">
            <Flame className="h-8 w-8 text-streak" />
            <div>
              <p className="font-semibold">🔥 {stats.streak}-Day Streak!</p>
              <p className="text-sm text-muted-foreground">Keep it up! Consistency is key to cracking placements.</p>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Daily Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Line type="monotone" dataKey="completed" stroke="hsl(238,73%,58%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="total" stroke="hsl(220,15%,85%)" strokeWidth={1} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Topics Covered</h3>
            {stats.topicDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.topicDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {stats.topicDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Complete some tasks to see topic distribution
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
