import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type AnalyticsData } from "@/lib/studyPlanEngine";
import { fetchAnalytics } from "@/lib/api";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["hsl(238,73%,58%)", "hsl(200,85%,55%)", "hsl(152,60%,45%)", "hsl(38,92%,55%)", "hsl(0,72%,55%)", "hsl(280,60%,55%)"];
const BASE_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"];

export default function AnalyticsDashboard() {
  const [company, setCompany] = useState("Google");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>(["Google"]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Scan available companies
  useEffect(() => {
    let isMounted = true;

    async function checkAvailableCompanies() {
      const validCompanies: string[] = [];

      for (const comp of BASE_COMPANIES) {
        try {
          const res = await fetchAnalytics(comp);
          if (res && res.dsaTopicFrequency && res.dsaTopicFrequency.length > 0) {
            validCompanies.push(comp);
          }
        } catch (err) {
          // Silent catch
        }
      }

      if (isMounted) {
        const finalValidList = validCompanies.length > 0 ? validCompanies : [company];
        setAvailableCompanies(finalValidList);

        if (validCompanies.length > 0 && !validCompanies.includes(company)) {
          setCompany(validCompanies[0]);
        }
      }
    }

    checkAvailableCompanies();
    return () => { isMounted = false; };
  }, []);

  // Fetch data when company changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchAnalytics(company)
      .then((liveData) => {
        if (isMounted) setData(liveData);
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          toast.error(err.message || "Failed to load live analytics.");
          setData(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [company]);

  const toggleTooltip = (key: string) => {
    setActiveTooltip(activeTooltip === key ? null : key);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Interview Pattern Mining
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </h1>
            <p className="mt-2 text-muted-foreground">Live data-driven interview pattern analysis</p>
          </div>
          <div className="w-48">
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableCompanies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {!isLoading && !data ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center glass-card">
            <p className="text-lg font-medium">No live data found for {company}.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go to the Study Plan page and run the ETL Extraction pipeline for this company.
            </p>
          </div>
        ) : data && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Most Asked DSA Topics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Most Asked DSA Topics</h3>
                  <button onClick={() => toggleTooltip("dsa")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Frequency breakdown of core Data Structures and Algorithms tested in technical interviews.
                </p>

                {activeTooltip === "dsa" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 p-3 text-xs bg-muted/60 text-muted-foreground rounded-lg border">
                    <strong>What is Frequency?</strong> It maps how often a topic appears in extraction logs.<br />
                    <strong>Calculation:</strong> Raw occurrences divided by total extracted questions.
                  </motion.div>
                )}
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dsaTopicFrequency} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="hsl(238,73%,58%)" radius={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* === Interview Round Types Pie Chart === */}
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 flex flex-col justify-between">
  <div>
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Interview Round Types</h3>
      <button onClick={() => toggleTooltip("rounds")} className="text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-4 w-4" />
      </button>
    </div>
    <p className="text-xs text-muted-foreground mt-0.5">
      Percentage distribution of round formats.
    </p>

    {activeTooltip === "rounds" && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 p-3 text-xs bg-muted/60 text-muted-foreground rounded-lg border">
        <strong>What is this distribution?</strong> Proportion of different round types.<br />
        <strong>Calculation:</strong> Count of rounds per type / total rounds.
      </motion.div>
    )}
  </div>

  <div className="mt-4">
    {(() => {
      // Filter out zero-value entries — Recharts skips them silently
      const validRoundTypes = (data?.roundTypes ?? []).filter(
        (r) => r && r.name && typeof r.value === "number" && r.value > 0
      );

      if (validRoundTypes.length === 0) {
        return (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No round type data extracted for {company}.
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      key={`pie-${company}-${validRoundTypes.map(r => r.name + r.value).join("-")}`}
      data={validRoundTypes}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={110}
      paddingAngle={3}
      dataKey="value"
      nameKey="name"
      isAnimationActive={false}
      label={({ name, percent }) =>
        name && percent > 0.03
          ? `${name} ${(percent * 100).toFixed(0)}%`
          : ""
      }
      labelLine={false}
    >
      {validRoundTypes.map((entry, i) => (
        <Cell
          key={`cell-${company}-${entry.name}-${i}`}
          fill={COLORS[i % COLORS.length]}
        />
      ))}
    </Pie>
    <Tooltip
      formatter={(value: number, name: string) => [
        `${value} occurrence${value !== 1 ? "s" : ""}`,
        name,
      ]}
    />
  </PieChart>
</ResponsiveContainer>
      );
    })()}
  </div>
</motion.div>

            {/* Problem Pattern Frequency */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Problem Pattern Frequency</h3>
                  <button onClick={() => toggleTooltip("patterns")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct counts of underlying problem-solving patterns.
                </p>

                {activeTooltip === "patterns" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 p-3 text-xs bg-muted/60 text-muted-foreground rounded-lg border">
                    <strong>What is Pattern Frequency?</strong> How often each pattern appears.
                  </motion.div>
                )}
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.problemPatterns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                    <XAxis dataKey="pattern" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(200,85%,55%)" radius={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Complexity vs. Importance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Topic Complexity vs. Weight</h3>
                  <button onClick={() => toggleTooltip("complexity")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compares topic frequency against average difficulty.
                </p>

                {activeTooltip === "complexity" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 p-3 text-xs bg-muted/60 text-muted-foreground rounded-lg border">
                    Bars = Frequency | Line = Weighted Importance
                  </motion.div>
                )}
              </div>
              <div className="mt-4">
                {data.dsaTopicFrequency && data.dsaTopicFrequency.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={data.dsaTopicFrequency} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                      <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Weight', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="frequency" fill="hsl(238,73%,58%)" radius={[1, 1, 0, 0]} barSize={36} />
                      <Line yAxisId="right" type="monotone" dataKey="frequency" stroke="hsl(38,92%,55%)" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm pb-12">
                    No topic distribution data extracted for {company}.
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}