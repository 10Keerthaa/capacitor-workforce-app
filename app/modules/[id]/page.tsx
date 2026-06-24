"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, History, PlusCircle, CheckCircle } from "lucide-react";
import DailyManpowerForm from "@/components/forms/DailyManpowerForm";
import CampBossForm from "@/components/forms/CampBossForm";
import PettyCashForm from "@/components/forms/PettyCashForm";
import ProcurementForm from "@/components/forms/ProcurementForm";
import OnboardingForm from "@/components/forms/OnboardingForm";
import ToolsManagementForm from "@/components/forms/ToolsManagementForm";
import WorkOutputForm from "@/components/forms/WorkOutputForm";
import ManagerApprovalQueue from "@/components/ManagerApprovalQueue";
import ModuleHistory from "@/components/ModuleHistory";

const moduleInfo: Record<string, { title: string }> = {
  "onboarding": { title: "Employee Onboarding" },
  "petty-cash": { title: "Petty Cash" },
  "procurement": { title: "Procurement (MRs)" },
  "work-output": { title: "Work Output" },
  "tools": { title: "Tools Management" },
  "camp-boss": { title: "Camp Boss" },
  "manpower": { title: "Daily Manpower" },
};

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const info = moduleInfo[id];

  const [activeTab, setActiveTab] = useState<"new" | "history" | "manager">("new");
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!id) return;
    
    // Map moduleId to table names
    const tableMap: Record<string, string> = {
      "petty-cash": "petty_cash",
      "procurement": "mr_procurement",
      "manpower": "daily_manpower",
      "camp-boss": "camp_boss",
      "tools": "tools_management",
      "onboarding": "employee_onboarding",
      "work-output": "work_output"
    };

    const tableName = tableMap[id as string];
    if (!tableName) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('agent_status', 'pending_manager_review');
      
      setPendingCount(count || 0);
    };

    fetchCount();

    // Listen for realtime updates to the count!
    const channel = supabase.channel(`public:${tableName}_count`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
         fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, refreshTrigger]);

  if (!info) return <div className="p-8 text-white">Module not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {info.title}
            </h1>
          </div>
          
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors ${
                activeTab === "new" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <PlusCircle size={18} />
              <span>New Entry</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors ${
                activeTab === "history" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <History size={18} />
              <span>History</span>
            </button>
            <button
              onClick={() => setActiveTab("manager")}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors ${
                activeTab === "manager" ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <CheckCircle size={18} />
              <span>Manager Approvals</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse ml-2">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="bg-gray-900 rounded-2xl border border-gray-800/60 shadow-xl overflow-hidden">
          {activeTab === "new" ? (
            <div className="p-6 md:p-8">
              {id === "manpower" && <DailyManpowerForm />}
              {id === "camp-boss" && <CampBossForm />}
              {id === "petty-cash" && <PettyCashForm />}
              {id === "procurement" && <ProcurementForm />}
              {id === "onboarding" && <OnboardingForm />}
              {id === "tools" && <ToolsManagementForm />}
              {id === "work-output" && <WorkOutputForm />}
              
              {!Object.keys(moduleInfo).includes(id) && (
                <div className="text-center text-gray-500 py-10">Form not yet implemented for this module.</div>
              )}
            </div>
          ) : activeTab === "manager" ? (
            <div className="p-6 md:p-8">
              <ManagerApprovalQueue moduleId={id} onAction={() => setRefreshTrigger(prev => prev + 1)} />
            </div>
          ) : (
            <div className="p-6 md:p-8 h-full min-h-[400px]">
              <ModuleHistory moduleId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
