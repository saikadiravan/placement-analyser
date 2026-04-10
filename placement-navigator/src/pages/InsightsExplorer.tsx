import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Search, ExternalLink, Code2, Layout, Users, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COMPANIES, getCompanyInsights, type CompanyInsight } from "@/lib/studyPlanEngine";

const categoryIcons = {
  dsa: Code2,
  sd: Layout,
  behavioral: Users,
};

export default function InsightsExplorer() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = COMPANIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Insights Explorer</h1>
          <p className="mt-2 text-muted-foreground">Explore company-specific interview insights from real experiences.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mt-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </motion.div>

        <div className="mt-6 space-y-3">
          {filtered.map((company, idx) => (
            <CompanyCard key={company} company={company} expanded={expanded === company}
              onToggle={() => setExpanded(expanded === company ? null : company)} delay={idx * 0.04} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company, expanded, onToggle, delay }: { company: string; expanded: boolean; onToggle: () => void; delay: number }) {
  const insight = expanded ? getCompanyInsights(company) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card overflow-hidden rounded-xl">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold">{company}</span>
            {insight && (
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">Difficulty: {insight.difficulty}</Badge>
                <Badge variant="outline" className="text-[10px]">{insight.avgRounds} rounds avg</Badge>
              </div>
            )}
          </div>
        </div>
        {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && insight && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}>
            <div className="border-t border-border/50 p-5">
              <div className="grid gap-6 md:grid-cols-3">
                <InsightSection icon={Code2} title="DSA Topics Asked" items={insight.dsaTopics} color="text-primary" />
                <InsightSection icon={Layout} title="System Design Topics" items={insight.systemDesignTopics} color="text-accent" />
                <InsightSection icon={Users} title="Behavioral Questions" items={insight.behavioralQuestions} color="text-success" />
              </div>

              <div className="mt-5 border-t border-border/50 pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {insight.sources.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
                      <ExternalLink className="h-3 w-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InsightSection({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
