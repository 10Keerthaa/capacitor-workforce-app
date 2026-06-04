"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  BrainCircuit, 
  Sparkles,
  Receipt,
  User,
  Activity
} from "lucide-react";

import { Package } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'petty_cash' | 'procurement'>('petty_cash');
  const [claims, setClaims] = useState<any[]>([]);
  const [procurements, setProcurements] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchData = async () => {
    const { data: claimsData } = await supabase
      .from("petty_cash")
      .select("*")
      .order("id", { ascending: false });
    if (claimsData) setClaims(claimsData);

    const { data: procData } = await supabase
      .from("mr_procurement")
      .select("*")
      .order("id", { ascending: false });
    if (procData) setProcurements(procData);
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime changes!
    const channel1 = supabase
      .channel('schema-db-changes1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'petty_cash' }, () => {
        fetchData();
      })
      .subscribe();

    const channel2 = supabase
      .channel('schema-db-changes2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mr_procurement' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    }
  }, []);

  // Handle Human Manager Decision
  const handleManagerDecision = async (id: any, decision: string, table: string) => {
    const { error } = await supabase
      .from(table)
      .update({ manager_status: decision })
      .eq("id", id);
      
    if (error) {
      alert("Error saving decision.");
      console.error(error);
    } else {
      fetchData();
    }
  };

  // Run the agent on ALL pending claims automatically
  const runAgentOnPending = async () => {
    setIsAuditing(true);
    
    if (activeTab === 'petty_cash') {
      const pendingClaims = claims.filter(c => !c.ai_recommendation);
      for (const claim of pendingClaims) {
        try {
          await fetch("/api/agents/petty-cash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: claim.id,
              employee_name: claim.pettyCashHolder || "Unknown",
              amount: claim.amount || 0,
              description: claim.description || "No description",
              site: claim.projectName || "Unknown",
            }),
          });
        } catch (error) {
          console.error("Agent failed for ID", claim.id, error);
        }
      }
    } else {
      const pendingProcurements = procurements.filter(p => !p.ai_recommendation);
      for (const item of pendingProcurements) {
        try {
          await fetch("/api/agents/procurement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              item_name: item.itemName || "Unknown Item",
              quantity: item.quantity || "Unknown",
              site: item.projectName || "Unknown",
              required_date: item.requiredDate || "ASAP",
              notes: item.notes || "No notes",
            }),
          });
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
        }
      }
    }
    
    await fetchData();
    setIsAuditing(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-teal-500/30 overflow-x-auto">
      {/* Responsive Container */}
      <div className="w-full overflow-x-hidden">
        {/* Premium Header */}
        <div className="relative overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-3xl pt-12 pb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[800px] h-[300px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex-1 w-full pt-4 md:pt-0">
              <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-8 h-8 text-teal-400 shrink-0" />
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                  AI Operations Center
                </h1>
              </div>
              <p className="text-slate-400 text-lg max-w-xl">
                Real-time autonomous auditing of field operations and expenses.
              </p>
            </div>

            <button
              onClick={runAgentOnPending}
              disabled={isAuditing}
              className="shrink-0 group relative inline-flex justify-center items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-8 py-4 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)]"
            >
              {isAuditing ? (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Auditing Data...
                </span>
              ) : (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                  Audit All Pending Data
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
          <div className="flex gap-4 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab('petty_cash')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'petty_cash' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Finance (Petty Cash)
            </button>
            <button 
              onClick={() => setActiveTab('procurement')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'procurement' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Operations (Procurement)
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'petty_cash' && claims.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Data Found</h3>
                <p className="text-slate-500">Submit an expense from the Android app to see it here.</p>
              </div>
            )}
            
            {activeTab === 'petty_cash' && claims.map((claim) => (
              <div 
                  key={claim.id} 
                  className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden"
                >
                  {/* Highlight glow for flagged items */}
                  {claim.ai_recommendation === 'Reject' && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                  )}
                  {claim.ai_recommendation === 'Approve' && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
                  )}
                  {!claim.ai_recommendation && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />
                  )}

                  {/* Left: Raw Data */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white text-lg truncate">{claim.pettyCashHolder}</h3>
                          <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                            <Activity className="w-3 h-3 shrink-0" /> <span className="truncate">{claim.projectName || 'Unassigned Site'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-white tracking-tight">${claim.amount}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Requested</p>
                      </div>
                    </div>
                    <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full">
                      <p className="text-slate-300 text-sm leading-relaxed break-words">"{claim.description}"</p>
                    </div>
                  </div>

                  {/* Right: AI Intelligence Block */}
                  <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                    {!claim.ai_recommendation ? (
                      <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                        <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                        <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                      </div>
                    ) : (
                      <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            claim.ai_fraud_risk === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                            claim.ai_fraud_risk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          }`}>
                            {claim.ai_fraud_risk} Risk
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          {claim.ai_recommendation === 'Approve' ? (
                            <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className={`font-bold text-lg leading-none mb-2 ${
                              claim.ai_recommendation === 'Approve' ? 'text-teal-400' : 'text-rose-400'
                            }`}>
                              {claim.ai_recommendation}
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {claim.ai_reason}
                            </p>
                          </div>
                        </div>

                        {/* HUMAN IN THE LOOP BUTTONS */}
                        {claim.manager_status ? (
                           <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase">Manager Decision</span>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                               claim.manager_status === 'Approved' ? 'bg-teal-500/20 text-teal-400' : 'bg-rose-500/20 text-rose-400'
                             }`}>
                               {claim.manager_status}
                             </span>
                           </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-white/10 flex gap-3 relative z-20">
                              <button 
                                onClick={() => handleManagerDecision(claim.id, 'Approved', 'petty_cash')}
                                className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleManagerDecision(claim.id, 'Rejected', 'petty_cash')}
                                className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30"
                              >
                                Reject
                              </button>
                            </div>
                        )}
                      </div>
                    )}
                    
                    {/* Subtle background glow based on decision */}
                    {claim.ai_recommendation === 'Approve' && (
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-500/10 blur-3xl pointer-events-none" />
                    )}
                    {claim.ai_recommendation === 'Reject' && (
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-500/10 blur-3xl pointer-events-none" />
                    )}
                  </div>

                </div>
                </div>
            ))}

            {/* --- PROCUREMENT TAB --- */}
            {activeTab === 'procurement' && procurements.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No MRs Found</h3>
                <p className="text-slate-500">Submit a material request to see it here.</p>
              </div>
            )}

            {activeTab === 'procurement' && procurements.map((item) => (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_recommendation === 'Reject' && <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />}
                {item.ai_recommendation === 'Approve' && <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />}
                {!item.ai_recommendation && <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.itemName || `MR #${item.mrNo}`}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" /> <span className="truncate">{item.employeeId || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">{item.quantity || '0'}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full">
                    <p className="text-slate-300 text-sm leading-relaxed break-words">{item.notes || "No additional notes provided."}</p>
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_recommendation ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_priority === 'Critical' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Critical</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.ai_risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : item.ai_risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_risk_level} Risk</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {item.ai_recommendation === 'Approve' ? <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${item.ai_recommendation === 'Approve' ? 'text-teal-400' : 'text-rose-400'}`}>{item.ai_recommendation}</p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reason}</p>
                        </div>
                      </div>

                      {/* HUMAN IN THE LOOP BUTTONS */}
                      {item.manager_status ? (
                         <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500 uppercase">Manager Decision</span>
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.manager_status === 'Approved' ? 'bg-teal-500/20 text-teal-400' : 'bg-rose-500/20 text-rose-400'}`}>{item.manager_status}</span>
                         </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-3 relative z-20">
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'mr_procurement')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Approve</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Rejected', 'mr_procurement')} className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30">Reject</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
