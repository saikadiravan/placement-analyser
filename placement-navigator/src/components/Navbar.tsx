import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  BookOpen,
  Target,
  Compass,
  Trophy,
  GitCompareArrows,
  Workflow,
  Gamepad2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMode } from "@/context/ModeContext";

const navItems = [
  { path: "/", label: "Home", icon: Brain },
  { path: "/generate", label: "Study Plan", icon: Target },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/difficulty", label: "Difficulty", icon: Trophy },
  { path: "/gap-analyzer", label: "Gap & Readiness", icon: GitCompareArrows },
  { path: "/progress", label: "Progress", icon: BookOpen },
  { path: "/pipeline", label: "Pipeline", icon: Workflow },
  { path: "/insights", label: "Insights", icon: Compass },
  { path: "/simulator", label: "Simulator", icon: Gamepad2 },
];

export default function Navbar() {
  const { isOnline, setIsOnline } = useMode();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Placement<span className="gradient-text">Prep AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Side (Toggle + Mobile Nav) */}
        <div className="flex items-center gap-3">
          
          {/* Online/Offline Toggle */}
          <div className="hidden md:flex items-center space-x-3 ml-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isOnline ? "Online (Live AI)" : "Offline (Mock Data)"}
            </span>
            <Switch 
              checked={isOnline} 
              onCheckedChange={setIsOnline} 
            />
          </div>

          {/* Mobile Nav */}
          <div className="flex gap-1 md:hidden">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-lg p-2 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}