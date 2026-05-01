// import { motion } from "framer-motion";
// import { 
//   Github, 
//   MessageSquare, 
//   Globe, 
//   ShieldAlert, 
//   ShieldCheck, 
//   Filter, 
//   Target, 
//   Calendar, 
//   Bot,
//   ArrowDown 
// } from "lucide-react";

// const PIPELINE_STEPS = [
//   {
//     id: "extraction",
//     title: "1. Multi-Agent Extraction Phase",
//     description: "Parallel agents scrape the web for specific company interview data with an early-stopping mechanism to save compute.",
//     isParallel: true,
//     agents: [
//       { name: "GitHub Agent", desc: "Fetches accurate LeetCode problem lists.", icon: Github, color: "text-gray-400" },
//       { name: "Reddit Agent", desc: "Mines subreddits for behavioral & round info.", icon: MessageSquare, color: "text-orange-500" },
//       { name: "Web Agent", desc: "Google Search + Selenium for structured forums.", icon: Globe, color: "text-blue-500" },
//       { name: "AmbitionBox Agent", desc: "India-specific fallback if Web/Reddit fail.", icon: ShieldAlert, color: "text-red-500" }
//     ],
//     color: "border-primary/30 bg-primary/5"
//   },
//   {
//     id: "gate",
//     title: "2. Data Sufficiency Gate",
//     description: "A strict quality checkpoint. It rejects the web data if it fails to gather the 800-character minimum, triggering the AmbitionBox fallback to prevent AI hallucinations.",
//     icon: ShieldCheck,
//     color: "border-red-500/30 bg-red-500/5 text-red-500"
//   },
//   {
//     id: "filter",
//     title: "3. The Great Filter (Gemini AI)",
//     description: "Acting as the Editor-in-Chief, Gemini reads the messy raw text and structures it into a clean, validated JSON report. It follows strict anti-hallucination rules.",
//     icon: Filter,
//     color: "border-purple-500/30 bg-purple-500/5 text-purple-500"
//   },
//   {
//     id: "recommendation",
//     title: "4. Recommendation Agent",
//     description: "The Elite Technical Career Coach. Transforms the cleaned JSON into a personalized 3-phase, day-by-day study schedule with highly specific daily tips.",
//     icon: Target,
//     color: "border-green-500/30 bg-green-500/5 text-green-500"
//   },
//   {
//     id: "frontend-features",
//     title: "5. Local & Interactive AI Features",
//     description: "Continuous user interactions that run locally or without expensive API costs.",
//     isParallel: true,
//     agents: [
//       { name: "Zero-Cost Rescheduler", desc: "Shifts uncompleted tasks to future days mathematically without calling Gemini.", icon: Calendar, color: "text-amber-500" },
//       { name: "Conversational RAG (Ollama)", desc: "Local LLaMA3 chatbot that answers specific user questions using the extracted insights.", icon: Bot, color: "text-teal-500" }
//     ],
//     color: "border-accent/30 bg-accent/5"
//   }
// ];

// const containerVariants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: { staggerChildren: 0.3 }
//   }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
// };

// export default function PipelineVisualization() {
//   return (
//     <div className="min-h-screen py-12">
//       <div className="container mx-auto px-4 max-w-4xl">
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }} 
//           animate={{ opacity: 1, y: 0 }} 
//           className="text-center mb-12"
//         >
//           <h1 className="text-4xl font-bold mb-4">Under the Hood: <span className="gradient-text">The Architecture</span></h1>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             A true multi-agent intelligence system—not just an LLM wrapper. Discover how data flows from the internet to your personalized study plan.
//           </p>
//         </motion.div>

//         <motion.div 
//           variants={containerVariants} 
//           initial="hidden" 
//           animate="show" 
//           className="flex flex-col items-center"
//         >
//           {PIPELINE_STEPS.map((step, index) => (
//             <div key={step.id}>
//               <motion.div variants={itemVariants} className={`w-full glass-card rounded-xl p-6 border-2 ${step.color}`}>
//                 <div className="flex items-center gap-4 mb-4">
//                   {step.icon && <step.icon className="h-8 w-8" />}
//                   <div>
//                     <h2 className="text-2xl font-bold">{step.title}</h2>
//                     <p className="text-muted-foreground mt-1">{step.description}</p>
//                   </div>
//                 </div>

//                 {step.isParallel && step.agents && (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//                     {step.agents.map((agent) => (
//                       <div key={agent.name} className="flex items-start gap-3 bg-background/50 p-4 rounded-lg border border-border/50">
//                         <agent.icon className={`h-6 w-6 mt-1 ${agent.color}`} />
//                         <div>
//                           <h4 className="font-semibold">{agent.name}</h4>
//                           <p className="text-sm text-muted-foreground leading-snug mt-1">{agent.desc}</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </motion.div>

//               {/* Connecting Arrow */}
//               {index < PIPELINE_STEPS.length - 1 && (
//                 <motion.div variants={itemVariants} className="py-4">
//                   <ArrowDown className="h-8 w-8 text-muted-foreground/50 animate-bounce" />
//                 </motion.div>
//               )}
//             </div>
//           ))}
//         </motion.div>
//       </div>
//     </div>
//   );
