"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardList, History } from "lucide-react";
import Link from "next/link";
import DailyManpowerForm from "@/components/forms/DailyManpowerForm";
import CampBossForm from "@/components/forms/CampBossForm";
import PettyCashForm from "@/components/forms/PettyCashForm";
import ProcurementForm from "@/components/forms/ProcurementForm";
import OnboardingForm from "@/components/forms/OnboardingForm";
import ToolsManagementForm from "@/components/forms/ToolsManagementForm";
import WorkOutputForm from "@/components/forms/WorkOutputForm";

const moduleInfo = {
  "onboarding": { title: "Employee Onboarding", table: "employee_onboarding" },
  "petty-cash": { title: "Petty Cash", table: "petty_cash" },
  "procurement": { title: "Procurement (MRs)", table: "mr_procurement" },
  "work-output": { title: "Work Output", table: "work_output" },
  "tools": { title: "Tools Management", table: "tools_management" },
  "camp-boss": { title: "Camp Boss", table: "camp_boss" },
  "manpower": { title: "Daily Manpower", table: "daily_manpower" },
};

export default function ModulePage() {
  const params = useParams();
  const id = params.id as string;
  const info = moduleInfo[id as keyof typeof moduleInfo];
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  if (!info) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center p-10 text-white font-sans text-2xl">Module not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800/60 p-4 sticky top-0 z-20 shadow-lg backdrop-blur-md bg-opacity-80">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Link href="/" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 hover:text-indigo-400 transition-all active:scale-95">
            <ArrowLeft size={22} className="text-gray-300 transition-colors" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
            {info.title}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col pb-12">
        
        {/* Dynamic Tabs */}
        <div className="flex space-x-2 bg-gray-900/60 p-1.5 rounded-2xl mb-6 border border-gray-800/40 shadow-inner">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "form" 
                ? "bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] scale-[1.02]" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            <ClipboardList size={20} strokeWidth={2.5} />
            <span>New Entry</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "history" 
                ? "bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] scale-[1.02]" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            <History size={20} strokeWidth={2.5} />
            <span>History</span>
          </button>
        </div>

        {/* Dynamic Tab Content Area */}
        <div className="flex-1 bg-gray-900/80 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden relative backdrop-blur-sm">
          {activeTab === "form" ? (
            <div className="p-6 md:p-8">
              <div className="mb-8 border-b border-gray-800 pb-4">
                <h2 className="text-2xl font-bold text-gray-100">Submit New Data</h2>
                <p className="text-gray-400 mt-2">Fill in the required fields to create a new {info.title} record securely into Supabase.</p>
              </div>
              
              {/* Render Specific Forms Based on ID */}
              {id === "manpower" && <DailyManpowerForm />}
              {id === "camp-boss" && <CampBossForm />}
              {id === "petty-cash" && <PettyCashForm />}
              {id === "procurement" && <ProcurementForm />}
              {id === "onboarding" && <OnboardingForm />}
              {id === "tools" && <ToolsManagementForm />}
              {id === "work-output" && <WorkOutputForm />}
              
              {!["manpower", "camp-boss", "petty-cash", "procurement", "onboarding", "tools", "work-output"].includes(id) && (
                <div className="text-center text-gray-500 py-10">Form not yet implemented for this module.</div>
              )}
            </div>
          ) : (
            <div className="p-6 md:p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
              <History size={64} strokeWidth={1} className="text-gray-700 mb-6" />
              <h2 className="text-2xl font-bold text-gray-300 mb-2">No Records Yet</h2>
              <p className="text-gray-500 text-center max-w-sm">
                Data submitted through the form will automatically appear here once synchronized with the database.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
