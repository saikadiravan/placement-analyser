import { motion } from "framer-motion";
import { Search, Database, Filter, Lightbulb, Target, Calendar, ArrowDown } from "lucide-react";
import { PIPELINE_STAGES } from "@/lib/analyticsEngine";

const ICONS: Record<string, React.ElementType> = { Search, Database, Filter, Lightbulb, Target, Calendar };

export default function PipelineVisualization() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-bold">Multi-Agent AI Pipeline</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            A data-driven intelligence system — not just an LLM wrapper. Each agent processes interview data through a structured ETL pipeline.
          </p>
        </motion.div>

        <div className="mt-12 mx-auto max-w-2xl">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = ICONS[stage.icon] || Search;
            return (
              <div key={stage.id}>
                <motion.div
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="glass-card rounded-xl p-6 flex items-start gap-4"
                >
                  <motion.div
                    className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl gradient-bg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">AGENT {i + 1}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{stage.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{stage.description}</p>
                  </div>
                </motion.div>

                {i < PIPELINE_STAGES.length - 1 && (
                  <motion.div
                    className="flex justify-center py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.1 }}
                  >
                    <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                      <ArrowDown className="h-6 w-6 text-primary/50" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data flow summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="mt-12 mx-auto max-w-3xl glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-3">Architecture Highlights</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> ETL pipeline extracts real interview data from multiple sources</div>
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> NLP-based topic classification and difficulty scoring</div>
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Company-specific pattern mining with frequency analysis</div>
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Adaptive scheduling with automatic rescheduling</div>
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Gap analysis compares student progress vs requirements</div>
            <div className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Readiness scoring weighted by company difficulty</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
