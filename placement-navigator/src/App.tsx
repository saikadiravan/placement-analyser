import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "@/pages/Chatbot";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import StudyPlanGenerator from "@/pages/StudyPlanGenerator";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import ProgressTracker from "@/pages/ProgressTracker";
import InsightsExplorer from "@/pages/InsightsExplorer";
// import DifficultyLeaderboard from "@/pages/DifficultyLeaderboard";
import GapAnalyzer from "@/pages/GapAnalyzer";
// import PipelineVisualization from "@/pages/PipelineVisualization";
// import InterviewSimulator from "@/pages/InterviewSimulator";
import NotFound from "./pages/NotFound";
import { ModeProvider } from "@/context/ModeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/generate" element={<StudyPlanGenerator />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            {/* <Route path="/difficulty" element={<DifficultyLeaderboard />} /> */}
            <Route path="/gap-analyzer" element={<GapAnalyzer />} />
            <Route path="/progress" element={<ProgressTracker />} />
            <Route path="/chat" element={<Chatbot />} />       {/* <-- New Route added here */}
            {/* <Route path="/pipeline" element={<PipelineVisualization />} /> */}
            <Route path="/insights" element={<InsightsExplorer />} />
            {/* <Route path="/simulator" element={<InterviewSimulator />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ModeProvider>
  </QueryClientProvider>
);

export default App;