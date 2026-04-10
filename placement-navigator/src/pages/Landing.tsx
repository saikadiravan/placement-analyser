import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, BarChart3, Calendar, Sparkles, Zap, Target, BookOpen, TrendingUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANIES } from "@/lib/studyPlanEngine";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Plans",
    description: "Get personalized study roadmaps based on real company interview patterns.",
  },
  {
    icon: BarChart3,
    title: "Interview Analytics",
    description: "Visualize most-asked topics, round breakdowns, and difficulty trends.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "14, 21, or 30-day plans with auto-rescheduling when you miss days.",
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Track daily tasks, build streaks, and celebrate milestones.",
  },
];

const howItWorks = [
  { step: "01", title: "Select Company & Role", description: "Choose your target company and the role you're preparing for.", icon: Building2 },
  { step: "02", title: "AI Analyzes Patterns", description: "Our engine processes interview data to identify key topics.", icon: Sparkles },
  { step: "03", title: "Get Your Roadmap", description: "Receive a structured day-by-day preparation plan.", icon: BookOpen },
  { step: "04", title: "Track & Adapt", description: "Complete tasks daily. Missed days? We auto-reschedule.", icon: TrendingUp },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Placement Preparation
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Crack Your Dream Company with{" "}
              <span className="gradient-text">AI-Generated Study Plans</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Analyze real interview experiences and generate a personalized preparation roadmap.
              Track progress, stay on schedule, and ace your placement interviews.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/generate">
                <Button size="lg" className="gradient-bg text-primary-foreground gap-2 px-8 text-base shadow-lg hover:opacity-90 transition-opacity">
                  <Zap className="h-5 w-5" />
                  Generate Study Plan
                </Button>
              </Link>
              <Link to="/analytics">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  <BarChart3 className="h-5 w-5" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Four simple steps to your personalized study plan</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s) => (
              <motion.div key={s.step} variants={item} className="glass-card rounded-xl p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-bg">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-primary">STEP {s.step}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Powerful Features</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to prepare smarter</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <motion.div key={f.title} variants={item} className="glass-card rounded-xl p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Supported Companies */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Supported Companies</h2>
            <p className="mt-3 text-muted-foreground">Interview insights from top recruiters</p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-10 flex flex-wrap justify-center gap-3">
            {COMPANIES.map((c) => (
              <motion.div key={c} variants={item} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                {c}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto max-w-3xl rounded-2xl gradient-bg p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold">Ready to Start Preparing?</h2>
            <p className="mt-3 opacity-90">Generate your personalized study plan in seconds.</p>
            <Link to="/generate">
              <Button size="lg" className="mt-8 bg-card text-foreground hover:bg-card/90 gap-2 px-8 text-base">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
