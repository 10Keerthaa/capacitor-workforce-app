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
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { Package } from "lucide-react";
import { HardHat } from "lucide-react";
import { Wrench } from "lucide-react";
import { Users } from "lucide-react";
import { Building2 } from "lucide-react";
import { UserCheck } from "lucide-react";
import { Network } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'supervisor' | 'petty_cash' | 'procurement' | 'work_output' | 'tools' | 'manpower' | 'camp_boss' | 'onboarding'>('supervisor');
  const [claims, setClaims] = useState<any[]>([]);
  const [procurements, setProcurements] = useState<any[]>([]);
  const [workOutputs, setWorkOutputs] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [manpowerLogs, setManpowerLogs] = useState<any[]>([]);
  const [campBossLogs, setCampBossLogs] = useState<any[]>([]);
  const [onboardingLogs, setOnboardingLogs] = useState<any[]>([]);
  const [supervisorReports, setSupervisorReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<any>(null);
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

    const { data: workData } = await supabase
      .from("work_output")
      .select("*")
      .order("id", { ascending: false });
    if (workData) setWorkOutputs(workData);

    const { data: toolsData } = await supabase
      .from("tools_mgmt")
      .select("*")
      .order("id", { ascending: false });
    if (toolsData) setTools(toolsData);

    const { data: manpowerData } = await supabase
      .from("daily_manpower")
      .select("*")
      .order("id", { ascending: false });
    if (manpowerData) setManpowerLogs(manpowerData);

    const { data: campBossData } = await supabase
      .from("camp_boss")
      .select("*")
      .order("id", { ascending: false });
    if (campBossData) setCampBossLogs(campBossData);

    const { data: onboardingData } = await supabase
      .from("employee_onboarding")
      .select("*")
      .order("id", { ascending: false });
    if (onboardingData) setOnboardingLogs(onboardingData);

    const { data: supervisorData } = await supabase
      .from("supervisor_reports")
      .select("*")
      .order("id", { ascending: false });
    if (supervisorData) setSupervisorReports(supervisorData);
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

    const channel3 = supabase
      .channel('schema-db-changes3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_output' }, () => {
        fetchData();
      })
      .subscribe();

    const channel4 = supabase
      .channel('schema-db-changes4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tools_mgmt' }, () => {
        fetchData();
      })
      .subscribe();

    const channel5 = supabase
      .channel('schema-db-changes5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_manpower' }, () => {
        fetchData();
      })
      .subscribe();

    const channel6 = supabase
      .channel('schema-db-changes6')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camp_boss' }, () => {
        fetchData();
      })
      .subscribe();

    const channel7 = supabase
      .channel('schema-db-changes7')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_onboarding' }, () => {
        fetchData();
      })
      .subscribe();

    const channel8 = supabase
      .channel('schema-db-changes8')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisor_reports' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
      supabase.removeChannel(channel4);
      supabase.removeChannel(channel5);
      supabase.removeChannel(channel6);
      supabase.removeChannel(channel7);
      supabase.removeChannel(channel8);
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
    let hasAlerted = false; // Prevent multiple alerts in loops
    
    if (activeTab === 'supervisor') {
      const highRiskFinances = claims.filter(c => c.ai_fraud_risk === 'High').length + " High Risk Claims";
      const criticalProcurements = procurements.filter(p => p.ai_priority === 'Critical').length + " Critical Material Shortages";
      const productivityBottlenecks = workOutputs.filter(w => w.ai_bottleneck_identified === 'High Risk').length + " Site Bottlenecks";
      const absenteeismAlerts = campBossLogs.filter(c => c.ai_absenteeism_risk === 'High Risk').length + " High Absenteeism Warnings";
      const complianceGaps = onboardingLogs.filter(o => o.ai_compliance_gap && !o.ai_compliance_gap.includes('Fully')).length + " HR Compliance Gaps";

      try {
        const res = await fetch("/api/agents/supervisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            highRiskFinances,
            criticalProcurements,
            productivityBottlenecks,
            absenteeismAlerts,
            complianceGaps
          }),
        });
        if (!res.ok) throw new Error("API returned " + res.status);
      } catch (err) {
        console.error("Supervisor failed", err);
        if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
      }
    } else if (activeTab === 'petty_cash') {
      const pendingClaims = claims.filter(c => !c.ai_recommendation);
      for (const claim of pendingClaims) {
        try {
          const res = await fetch("/api/agents/petty-cash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: claim.id,
              employee_name: claim.pettyCashHolder || "Unknown",
              amount: claim.amount || 0,
              description: claim.description || "No description",
              site: claim.projectName || "Unknown",
              date: claim.date || new Date().toISOString().split('T')[0],
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", claim.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'procurement') {
      const pendingProcurements = procurements.filter(p => !p.ai_recommendation);
      for (const item of pendingProcurements) {
        try {
          const res = await fetch("/api/agents/procurement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              mr_no: item.mrNo || "Unknown",
              materialName: item.materialName || item.title || "Unknown",
              supplier: item.supplierName || "Unknown",
              unit_price: item.unitPrice || 0,
              site: item.projectName || "Unknown",
              remarks: item.remarks || "No remarks",
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'work_output') {
      const pendingWork = workOutputs.filter(w => !w.ai_productivity_trend);
      for (const item of pendingWork) {
        try {
          const res = await fetch("/api/agents/work-output", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              technician_name: item.technicianName || "Unknown",
              trade: item.trade || "Unknown",
              work_description: item.workDescription || "Unknown",
              uom: item.unitOfMeasure || "Unknown",
              output_per_day: item.outputPerDay || 0,
              site: item.projectName || "Unknown",
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'tools') {
      const pendingTools = tools.filter(t => !t.ai_recommendation);
      for (const item of pendingTools) {
        try {
          const res = await fetch("/api/agents/tools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              tag_name: item.tagName || "Unknown",
              qty: item.qty || 0,
              item_name: item.itemName || "Unknown",
              brand: item.brand || "Unknown",
              custody_task: item.custodyTask || "Unknown",
              status: item.status || "Unknown",
              warranty_details: item.warrantyDetails || "Unknown",
              purchase_date: item.purchaseDate || 0,
              photo_url: item.toolbox_photo_url || null,
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'manpower') {
      const pendingManpower = manpowerLogs.filter(m => !m.ai_overtime_risk);
      for (const item of pendingManpower) {
        try {
          const res = await fetch("/api/agents/manpower", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              siteNo: item.siteNo || "Unknown",
              siteName: item.siteName || "Unknown",
              location: item.location || "Unknown",
              startTime: item.startTime || "Unknown",
              endTime: item.endTime || "Unknown",
              engineer: item.engineer || "Unknown",
              foreman: item.foreman || "Unknown",
              otherStaff: item.otherStaff || "Unknown",
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'camp_boss') {
      const pendingCampBoss = campBossLogs.filter(c => !c.ai_absenteeism_risk);
      for (const item of pendingCampBoss) {
        try {
          const res = await fetch("/api/agents/camp-boss", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              employeeId: item.employeeId || "Unknown",
              employeeName: item.employeeName || "Unknown",
              campLocation: item.campLocation || "Unknown",
              roomNumber: item.roomNumber || "Unknown",
              status: item.status || "Unknown",
              remarks: item.remarks || "No remarks",
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
        }
      }
    } else if (activeTab === 'onboarding') {
      const pendingOnboarding = onboardingLogs.filter(o => !o.ai_document_validation);
      for (const item of pendingOnboarding) {
        try {
          const res = await fetch("/api/agents/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              employeeName: item.employeeName || "Unknown",
              nationality: item.nationality || "Unknown",
              trade: item.trade || "Unknown",
              passportExpiry: item.passportExpiry || null,
              visaExpiry: item.visaExpiry || null,
              passportScanUrisJson: item.passportScanUrisJson || null,
            }),
          });
          if (!res.ok) throw new Error("API returned " + res.status);
        } catch (error) {
          console.error("Agent failed for ID", item.id, error);
          if (!hasAlerted) { alert("AI servers are currently busy. Please try again in a moment."); hasAlerted = true; }
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
              ) : activeTab === 'supervisor' ? (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <BrainCircuit className="w-4 h-4 group-hover:animate-pulse" />
                  Generate Master Report
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
          <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('supervisor')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'supervisor' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              <Network className="w-4 h-4" /> Command Center
            </button>
            <div className="w-px h-10 bg-white/10 mx-2 self-center rounded-full shrink-0" />
            <button 
              onClick={() => setActiveTab('petty_cash')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'petty_cash' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Finance (Petty Cash)
            </button>
            <button 
              onClick={() => setActiveTab('procurement')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'procurement' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Operations (Procurement)
            </button>
            <button 
              onClick={() => setActiveTab('work_output')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'work_output' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Operations (Work Output)
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'tools' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Assets (Tools)
            </button>
            <button 
              onClick={() => setActiveTab('manpower')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'manpower' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Workforce (Manpower)
            </button>
            <button 
              onClick={() => setActiveTab('camp_boss')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'camp_boss' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              Camps (Camp Boss)
            </button>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'onboarding' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
            >
              HR (Onboarding)
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-1 gap-6">

            {/* --- COMMAND CENTER TAB --- */}
            {activeTab === 'supervisor' && supervisorReports.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Network className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">Command Center Offline</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">Click "Generate Master Report" to trigger the Supervisor Agent. It will analyze all alerts from the 7 sub-agents simultaneously.</p>
              </div>
            )}

            {activeTab === 'supervisor' && supervisorReports.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left: Master List (Sidebar) */}
                <div className="w-full lg:w-1/3 flex flex-col gap-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Report Archive</h3>
                  {supervisorReports.map((report) => {
                    const isSelected = selectedReportId ? report.id === selectedReportId : supervisorReports[0].id === report.id;
                    return (
                      <div 
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            Report of {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${report.system_status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : report.system_status === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'}`}>
                            {report.system_status}
                          </span>
                        </div>
                        <p className={`text-xs ${isSelected ? 'text-indigo-300' : 'text-slate-500'} truncate`}>
                          {new Date(report.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Detail View (Full Report) */}
                <div className="w-full lg:w-2/3 sticky top-4">
                  {(() => {
                    const currentReport = selectedReportId ? supervisorReports.find(r => r.id === selectedReportId) : supervisorReports[0];
                    if (!currentReport) return null;
                    return (
                      <div className="relative p-1 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-purple-500/10 to-transparent shadow-2xl transition-all duration-300">
                        <div className="bg-slate-900/90 backdrop-blur-xl rounded-[23px] p-6 sm:p-8 relative overflow-hidden">
                          {/* Decorative */}
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                          
                          <div className="relative z-10 flex flex-col gap-8">
                            {/* Header */}
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <BrainCircuit className="w-8 h-8 text-indigo-400" />
                                <h2 className="text-2xl font-bold text-white tracking-tight">Supervisor Report</h2>
                              </div>
                              <p className="text-slate-400 text-sm">Generated: {new Date(currentReport.created_at).toLocaleString()}</p>
                            </div>

                            {/* Status & Impact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                 <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Company Status</p>
                                 <p className={`text-xl font-black ${currentReport.system_status === 'CRITICAL' ? 'text-rose-500' : currentReport.system_status === 'WARNING' ? 'text-amber-500' : 'text-teal-500'}`}>{currentReport.system_status}</p>
                              </div>
                              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                 <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Financial Impact</p>
                                 <p className={`text-xl font-black ${currentReport.financial_impact_risk === 'High Risk' ? 'text-rose-500' : currentReport.financial_impact_risk === 'Medium Risk' ? 'text-amber-500' : 'text-teal-500'}`}>{currentReport.financial_impact_risk}</p>
                              </div>
                            </div>

                            {/* AI Intelligence */}
                            <div className="space-y-6">
                              <div>
                                 <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Key Bottleneck</h3>
                                 <p className="text-slate-300 text-lg leading-relaxed bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                                   {currentReport.key_bottleneck}
                                 </p>
                              </div>

                              <div>
                                 <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-teal-500" /> Orchestrated Action Plan</h3>
                                 <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl">
                                   <p className="text-slate-300 text-md leading-loose whitespace-pre-line">
                                     {currentReport.orchestrated_action_plan?.replace(/(?:\r\n|\r|\n)?(\d+\.)/g, '\n\n$1').trim()}
                                   </p>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

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
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                          <div className="flex gap-2">
                            {claim.ai_category && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {claim.ai_category}
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              claim.ai_fraud_risk === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                              claim.ai_fraud_risk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            }`}>
                              {claim.ai_fraud_risk} Risk
                            </span>
                          </div>
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
                        <h3 className="font-semibold text-white text-lg truncate">{item.supplierName ? `${item.supplierName} (MR #${item.mrNo})` : `MR #${item.mrNo}`}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" /> <span className="truncate">{item.requestedBy || item.employeeId || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">${item.unitPrice || '0.00'}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full">
                    <p className="text-slate-300 text-sm leading-relaxed break-words">{item.remarks ? `Remarks: ${item.remarks}` : "No remarks provided."}</p>
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
                          {item.ai_recommended_vendor && (
                            <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2">
                              <p className="text-indigo-300 text-xs font-medium flex items-center gap-1">
                                💡 <span className="font-bold">AI Recommended Vendor:</span> {item.ai_recommended_vendor}
                              </p>
                            </div>
                          )}
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
            {/* --- WORK OUTPUT TAB --- */}
            {activeTab === 'work_output' && workOutputs.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <HardHat className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Work Logs Found</h3>
                <p className="text-slate-500">Submit a daily log to see it here.</p>
              </div>
            )}

            {activeTab === 'work_output' && workOutputs.map((item) => (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_productivity_trend === 'Low' && <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />}
                {item.ai_productivity_trend === 'Excellent' && <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />}
                {!item.ai_productivity_trend && <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                        <HardHat className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.technicianName || 'Unknown Technician'}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 shrink-0" /> <span className="truncate">{item.trade || 'Unknown Trade'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">{item.outputPerDay || '0'} <span className="text-sm">{item.unitOfMeasure || ''}</span></p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Output</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full">
                    <p className="text-slate-300 text-sm leading-relaxed break-words">{item.workDescription ? `Work: ${item.workDescription}` : "No description provided."}</p>
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_productivity_trend ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_delay_prediction === 'Delay Likely' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Delay Likely</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.ai_bottleneck_identified === 'High Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : item.ai_bottleneck_identified === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_bottleneck_identified}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {item.ai_productivity_trend === 'Excellent' ? <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" /> : item.ai_productivity_trend === 'Low' ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" /> : <Activity className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${item.ai_productivity_trend === 'Excellent' ? 'text-teal-400' : item.ai_productivity_trend === 'Low' ? 'text-rose-400' : 'text-amber-400'}`}>
                            {item.ai_productivity_trend} Productivity
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reasoning}</p>
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
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'work_output')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Acknowledge</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Investigating', 'work_output')} className="flex-1 bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-amber-500/30">Investigate</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* --- TOOLS MANAGEMENT TAB --- */}
            {activeTab === 'tools' && tools.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Assets Found</h3>
                <p className="text-slate-500">Add a tool inventory record to see it here.</p>
              </div>
            )}

            {activeTab === 'tools' && tools.map((item) => (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_loss_risk === 'High Risk' && <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />}
                {item.ai_loss_risk === 'Low Risk' && <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />}
                {!item.ai_loss_risk && <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                        {item.toolbox_photo_url ? (
                          <img src={item.toolbox_photo_url} alt="Tool" className="w-full h-full object-cover" />
                        ) : (
                          <Wrench className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.brand} {item.itemName}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 shrink-0" /> Custody: <span className="truncate">{item.custodyTask || 'Unassigned'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">{item.qty || '0'}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full flex justify-between">
                    <p className="text-slate-300 text-sm leading-relaxed break-words flex-1">Status: {item.status || "Unknown"}</p>
                    {item.toolbox_photo_url && (
                       <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
                          CV Active
                       </span>
                    )}
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_loss_risk ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_warranty_action === 'Claim Warranty' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Claim Warranty</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.ai_loss_risk === 'High Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : item.ai_loss_risk === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_loss_risk}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {item.ai_recommendation?.includes('Recall') || item.ai_recommendation?.includes('Investigate') ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${item.ai_recommendation?.includes('Recall') ? 'text-rose-400' : 'text-teal-400'}`}>
                            {item.ai_recommendation}
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reasoning}</p>
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
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'tools_mgmt')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Acknowledge</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Investigating', 'tools_mgmt')} className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30">Investigate</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* --- DAILY MANPOWER TAB --- */}
            {activeTab === 'manpower' && manpowerLogs.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Manpower Logs Found</h3>
                <p className="text-slate-500">Submit a daily attendance log to see it here.</p>
              </div>
            )}

            {activeTab === 'manpower' && manpowerLogs.map((item) => (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_overtime_risk === 'High Risk' && <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />}
                {item.ai_overtime_risk === 'Safe' && <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />}
                {!item.ai_overtime_risk && <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.siteName}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 shrink-0" /> <span className="truncate">{item.location}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">{item.otherStaff || '0'}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Staff</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full flex justify-between">
                    <p className="text-slate-300 text-sm flex-1">Shift: <span className="text-white font-medium">{item.startTime} - {item.endTime}</span></p>
                    <p className="text-slate-300 text-sm">Lead: <span className="text-white font-medium">{item.foreman}</span></p>
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_overtime_risk ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_subcontract_recommendation === 'Recommend Subcontracting' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Subcontract</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.ai_overtime_risk === 'High Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : item.ai_overtime_risk === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_overtime_risk} OT</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {item.ai_allocation_efficiency === 'Optimal' ? <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" /> : item.ai_allocation_efficiency === 'Poor Allocation' ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" /> : <Activity className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${item.ai_allocation_efficiency === 'Optimal' ? 'text-teal-400' : item.ai_allocation_efficiency === 'Poor Allocation' ? 'text-rose-400' : 'text-amber-400'}`}>
                            {item.ai_allocation_efficiency}
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reasoning}</p>
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
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'daily_manpower')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Approve Plan</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Investigating', 'daily_manpower')} className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30">Action Needed</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* --- CAMP BOSS TAB --- */}
            {activeTab === 'camp_boss' && campBossLogs.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Camp Logs Found</h3>
                <p className="text-slate-500">Submit a camp attendance log to see it here.</p>
              </div>
            )}

            {activeTab === 'camp_boss' && campBossLogs.map((item) => (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_absenteeism_risk === 'High Risk' && <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />}
                {item.ai_absenteeism_risk === 'Low Risk' && <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />}
                {!item.ai_absenteeism_risk && <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.employeeName}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 shrink-0" /> ID: <span className="truncate">{item.employeeId}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white tracking-tight">{item.status}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full flex justify-between">
                    <p className="text-slate-300 text-sm flex-1">Camp: <span className="text-white font-medium">{item.campLocation}</span></p>
                    <p className="text-slate-300 text-sm">Room: <span className="text-white font-medium">{item.roomNumber}</span></p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 w-full">
                     <p className="text-slate-400 text-sm italic">"{item.remarks || 'No remarks provided'}"</p>
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_absenteeism_risk ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting Autonomous Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_replacement_action?.includes('Request') && <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Find Replacement</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.ai_absenteeism_risk === 'High Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : item.ai_absenteeism_risk === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_absenteeism_risk}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {item.ai_absenteeism_risk === 'High Risk' ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${item.ai_absenteeism_risk === 'High Risk' ? 'text-rose-400' : 'text-teal-400'}`}>
                            {item.ai_anomaly_detected}
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reasoning}</p>
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
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'camp_boss')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Acknowledge</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Investigating', 'camp_boss')} className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30">Action Needed</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* --- EMPLOYEE ONBOARDING TAB --- */}
            {activeTab === 'onboarding' && onboardingLogs.length === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No Onboarding Records</h3>
                <p className="text-slate-500">Submit an employee onboarding form to see it here.</p>
              </div>
            )}

            {activeTab === 'onboarding' && onboardingLogs.map((item) => {
              let parsedUris = [];
              if (item.passportScanUrisJson) {
                try { parsedUris = JSON.parse(item.passportScanUrisJson); } catch(e){}
              }
              const hasDocUrl = parsedUris.length > 0;

              return (
              <div key={item.id} className="group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 sm:p-6 gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-300 shadow-2xl overflow-hidden">
                {/* Highlight glow */}
                {item.ai_compliance_gap && item.ai_compliance_gap.includes('Fully Compliant') ? (
                  <div className="absolute left-0 top-0 w-1 h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
                ) : item.ai_compliance_gap ? (
                  <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                ) : (
                  <div className="absolute left-0 top-0 w-1 h-full bg-slate-700" />
                )}

                {/* Left: Raw Data */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                        {hasDocUrl ? (
                          <img src={parsedUris[0]} alt="Doc" className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">{item.employeeName}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1 truncate">
                          <Activity className="w-3 h-3 shrink-0" /> <span className="truncate">{item.trade || 'Unknown Trade'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-white tracking-tight">{item.nationality || 'N/A'}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nationality</p>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-white/5 w-full flex justify-between items-center">
                    <p className="text-slate-300 text-sm flex-1">Status: <span className="text-white font-medium">{item.onboardingStatus || 'Pending'}</span></p>
                    {hasDocUrl && (
                       <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
                          CV Active
                       </span>
                    )}
                  </div>
                </div>

                {/* Right: AI Intelligence Block */}
                <div className="w-full lg:w-[400px] shrink-0 border border-white/10 rounded-2xl p-5 bg-white/[0.02] relative overflow-hidden backdrop-blur-md">
                  {!item.ai_document_validation ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 space-y-3">
                      <Clock className="w-8 h-8 animate-pulse text-slate-600" />
                      <p className="text-sm font-medium">Awaiting HR Audit</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence</span>
                        <div className="flex gap-2">
                          {item.ai_hr_action?.includes('Warning') && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Send Warning</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${!item.ai_compliance_gap?.includes('Fully Compliant') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>{item.ai_document_validation}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {!item.ai_compliance_gap?.includes('Fully Compliant') ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-bold text-lg leading-none mb-2 ${!item.ai_compliance_gap?.includes('Fully Compliant') ? 'text-rose-400' : 'text-teal-400'}`}>
                            {item.ai_compliance_gap}
                          </p>
                          <p className="text-slate-300 text-sm leading-relaxed">{item.ai_reasoning}</p>
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
                          <button onClick={() => handleManagerDecision(item.id, 'Approved', 'employee_onboarding')} className="flex-1 bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-teal-500/30">Approve</button>
                          <button onClick={() => handleManagerDecision(item.id, 'Investigating', 'employee_onboarding')} className="flex-1 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white py-2 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-rose-500/30">Reject / Warn</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
