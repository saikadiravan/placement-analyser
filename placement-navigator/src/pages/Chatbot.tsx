import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COMPANIES } from "@/lib/studyPlanEngine";
import { chatWithAI } from "@/lib/api";
import { toast } from "sonner";

type Message = { role: "user" | "ai"; content: string };

export default function Chatbot() {
  const [company, setCompany] = useState("Google");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your local AI assistant. Select a company above and ask me anything about their interview process, salaries, or specific rounds!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(company, userMsg);
       const data =
  typeof response.data === "string"
    ? JSON.parse(response.data)
    : response.data;

let formatted = data.reply
  .replace(/\*\*/g, "")              // remove **
  .replace(/\n/g, "\n\n");           // better spacing

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
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Insights <span className="gradient-text">Chatbot</span></h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
              <span>Powered by local LLaMA 3. <b>This agent functions entirely offline</b> for maximum privacy and zero API costs.</span>
            </div>
          </div>
          <div className="w-48">
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>
                {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Chat Window */}
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
                  <div className="rounded-lg p-3 text-sm bg-muted/50 text-muted-foreground flex items-center gap-2">
                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce delay-75" />
                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-background/50">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={`Ask a question about ${company} interviews...`} 
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="gradient-bg">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}