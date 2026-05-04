import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COMPANIES } from "@/lib/studyPlanEngine";
import { chatWithAI, fetchCompanyInsights } from "@/lib/api";
import { toast } from "sonner";

type Message = { role: "user" | "ai"; content: string };

export default function Chatbot() {
  const [company, setCompany] = useState("Google");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your local AI assistant. Select a company above and ask me anything about their interview process, salaries, or specific rounds!" }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [isCheckingCompanies, setIsCheckingCompanies] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Dynamically check which companies have data in the database
  useEffect(() => {
    let isMounted = true;

    async function fetchAvailableCompanies() {
      setIsCheckingCompanies(true);
      const validCompanies: string[] = [];

      // Ping all base companies in parallel to see which ones exist in the DB
      await Promise.all(
        COMPANIES.map(async (comp) => {
          try {
            const res = await fetchCompanyInsights(comp);
            if (res && !res.error) {
              validCompanies.push(comp);
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
        setIsCheckingCompanies(false);

        // Auto-select the first available company if the current one isn't extracted
        
      }
    }

    fetchAvailableCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(company, userMsg);
      const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
      
      let formatted = data.reply
        .replace(/\*\*/g, "")              // remove ** 
        .replace(/\n/g, "\n\n");
      
      setMessages(prev => [
        ...prev, 
        { role: "ai", content: formatted }
      ]);
      
      console.log("API RESPONSE:", response.data);
    } catch (error) {
      toast.error("Failed to connect to the Chatbot. Is Ollama running?");
      setMessages(prev => [...prev, { role: "ai", content: "Error: Could not reach the local AI. Please ensure Ollama is running in the background." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl flex flex-col h-[85vh]">
        
        {/* HEADER & CONTROLS */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Insights <span className="gradient-text">Chatbot</span></h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
              <span>Powered by local LLaMA 3. <b>This agent functions entirely offline</b> for maximum privacy and zero API costs.</span>
            </div>
          </div>
          <div className="w-56">
            <Select 
                value={company} 
                onValueChange={setCompany} 
                disabled={isCheckingCompanies || availableCompanies.length === 0}
            >
              <SelectTrigger>
                {isCheckingCompanies ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select Company" />
                )}
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.length > 0 ? (
                    availableCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                ) : (
                    <SelectItem value="none" disabled>No DB Data Found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* CHAT INTERFACE */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card flex-1 rounded-xl flex flex-col overflow-hidden border-2 border-border/50">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent"}`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground"}`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted/50 text-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-card border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-3"
            >
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={availableCompanies.length === 0 ? "Run ETL pipeline to enable chat..." : `Ask about ${company}'s interviews...`}
                className="flex-1"
                disabled={isLoading || availableCompanies.length === 0}
              />
              <Button type="submit" disabled={isLoading || !input.trim() || availableCompanies.length === 0}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}