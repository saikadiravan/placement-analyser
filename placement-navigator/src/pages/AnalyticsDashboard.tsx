import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPANIES, getAnalytics, type AnalyticsData } from "@/lib/studyPlanEngine";
import { getTopicTrends } from "@/lib/analyticsEngine";

const COLORS = ["hsl(238,73%,58%)", "hsl(200,85%,55%)", "hsl(152,60%,45%)", "hsl(38,92%,55%)", "hsl(0,72%,55%)", "hsl(280,60%,55%)"];
const LINE_COLORS = ["hsl(238,73%,58%)", "hsl(0,72%,55%)", "hsl(200,85%,55%)", "hsl(38,92%,55%)", "hsl(152,60%,45%)"];
const TREND_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple"];

export default function AnalyticsDashboard() {
  const [company, setCompany] = useState("Google");
  const [data, setData] = useState<AnalyticsData>(() => getAnalytics("Google"));
  const trends = useMemo(() => getTopicTrends(), []);

  const handleCompanyChange = (c: string) => {
    setCompany(c);
    setData(getAnalytics(c));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Interview Pattern Mining</h1>
            <p className="mt-2 text-muted-foreground">Data-driven interview pattern analysis across companies</p>
          </div>
          <div className="w-48">
            <Select value={company} onValueChange={handleCompanyChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* DSA Topic Frequency */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Most Asked DSA Topics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dsaTopicFrequency.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Bar dataKey="frequency" fill="hsl(238,73%,58%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Interview Round Types */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Interview Round Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.roundTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.roundTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Topic Trends Line Chart - NEW */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6 lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Topic Trends Across Companies</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Legend />
                {TREND_COMPANIES.map((c, i) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={LINE_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Problem Patterns */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">Problem Pattern Frequency</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.problemPatterns}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="pattern" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Bar dataKey="count" fill="hsl(200,85%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* System Design Frequency */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold">System Design Topics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data.systemDesignFrequency}>
                <PolarGrid stroke="hsl(220,15%,90%)" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="frequency" stroke="hsl(238,73%,58%)" fill="hsl(238,73%,58%)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
