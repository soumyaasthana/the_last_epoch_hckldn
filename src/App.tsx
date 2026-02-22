import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, Send, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { generateResponse, getPrecedents } from './services/gemini';

export default function App() {
  const [proposal, setProposal] = useState('');
  const [council, setCouncil] = useState('');
  const [councilList, setCouncilList] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Fetch from DuckDB
  useEffect(() => {
    fetch('/api/councils')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCouncilList(data);
          if (data.length > 0) setCouncil(data[0]);
        }
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const runSimulation = async () => {
    if (!proposal.trim() || !council) return;
    setIsSimulating(true);
    setMessages([]);

    try {
      // Step 1: Resident Objection
      const objection = await generateResponse(`Object to this proposal in ${council}: ${proposal}`, "Local Resident");
      setMessages(prev => [...prev, { id: '1', type: 'RESIDENT', content: objection }]);

      // Step 2: Developer Defense
      const defense = await generateResponse(`Defend the proposal against this objection: ${objection}`, "Property Developer");
      setMessages(prev => [...prev, { id: '2', type: 'DEVELOPER', content: defense }]);
      
      // Step 3: Officer Verdict
      const verdict = await generateResponse(`Give a final verdict based on the Resident and Developer arguments.`, "Planning Officer");
      setMessages(prev => [...prev, { id: '3', type: 'OFFICER', content: verdict }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <Building2 className="text-emerald-600" size={28} />
          <h1 className="font-bold text-xl tracking-tight">Planning AI</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Jurisdiction (DuckDB)
            </label>
            <select 
              value={council}
              onChange={(e) => setCouncil(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {isLoading ? <option>Scanning Parquet...</option> : 
                councilList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white">
        <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6">
          {messages.length === 0 && !isSimulating && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <FileText size={64} strokeWidth={1} />
              <p className="mt-4 font-medium">Enter a proposal to start the debate</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-6 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">{msg.type}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{msg.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-8 border-t bg-gray-50/50">
          <div className="max-w-4xl mx-auto">
            <textarea 
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-2xl h-28 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none shadow-sm"
              placeholder="e.g. A three-story medical center with 20 parking spaces..."
            />
            <button 
              onClick={runSimulation}
              disabled={isSimulating || isLoading}
              className="w-full mt-4 bg-[#111] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:bg-gray-300"
            >
              {isSimulating ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Run Simulation</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}