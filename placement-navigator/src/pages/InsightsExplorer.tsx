import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Search, Code2, Layout, Users, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COMPANIES } from "@/lib/studyPlanEngine";
import { fetchCompanyInsights } from "@/lib/api";

export default function InsightsExplorer() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamically check which companies have data in the database
  useEffect(() => {
    let isMounted = true;

    async function fetchAvailableCompanies() {
      setIsLoading(true);
      const validCompanies: string[] = [];

      // Ping all base companies in parallel to see which ones exist in the DB
      await Promise.all(
        COMPANIES.map(async (company) => {
          try {
            const res = await fetchCompanyInsights(company);
            if (res && !res.error) {
              validCompanies.push(company);
            }
          } catch (err) {
            // No insights found for this company, it will be excluded
          }
        })
      );

      if (isMounted) {
        // Sort alphabetically to maintain a clean list
        validCompanies.sort((a, b) => a.localeCompare(b));
        setAvailableCompanies(validCompanies);
        setIsLoading(false);
      }
    }

    fetchAvailableCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = availableCompanies.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Insights Explorer
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="mt-2 text-muted-foreground">Explore company-specific interview insights from your live database.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mt-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search extracted companies..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
            disabled={isLoading}
          />
        </motion.div>

        <div className="mt-6 space-y-3">
          {!isLoading && filtered.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center glass-card">
              <p className="text-sm font-medium">No extracted insights found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to the Study Plan page and run the ETL Extraction pipeline to add companies here.
              </p>
            </div>
          )}
          
          {filtered.map((company, idx) => (
            <CompanyCard 
              key={company} 
              company={company} 
              expanded={expanded === company} 
              onToggle={() => setExpanded(expanded === company ? null : company)} 
              delay={idx * 0.04} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company, expanded, onToggle, delay }: { company: string; expanded: boolean; onToggle: () => void; delay: number }) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch the deep details when the card is expanded to save resources
    if (expanded && !insight) {
      setLoading(true);
      fetchCompanyInsights(company)
        .then(data => setInsight(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [expanded, company, insight]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card overflow-hidden rounded-xl">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold">{company}</span>
            {insight && !loading && (
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
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border/50 bg-muted/10">
            <div className="p-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading insights...
                </div>
              ) : insight ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <InsightSection icon={Users} title="Interview Process" items={insight.interviewProcess || []} color="text-primary" />
                  <InsightSection icon={Code2} title="Top DSA Topics" items={insight.dsaTopics || []} color="text-blue-500" />
                  <InsightSection icon={Layout} title="System Design" items={insight.systemDesignTopics || []} color="text-purple-500" />
                  <InsightSection icon={Users} title="Behavioral Questions" items={insight.behavioralQuestions || []} color="text-green-500" />
                </div>
              ) : (
                <p className="text-sm text-destructive">No insights available in the database.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InsightSection({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
  // If a company has no system design topics (like Infosys/TCS), don't render an empty section
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}