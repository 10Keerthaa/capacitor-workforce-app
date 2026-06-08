"use client";

import { useState } from "react";

export default function TestAgentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("procurement");

  const runProcurementAgent = async () => {
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/agents/procurement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1, mr_no: "MR-999", supplier: "BuildMart Materials", unit_price: "5000", site: "Downtown Tower", remarks: "Need 500 bags of cement urgently for the foundation."
        }),
      });
      const data = await response.json(); setResult(data.ai_analysis || data);
    } catch (error) { setResult({ error: "Failed to run agent" }); } finally { setLoading(false); }
  };

  const runCampBossAgent = async () => {
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/agents/camp-boss", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1, employeeId: "EMP-102", employeeName: "Rahul Sharma", employeePhone: "+971501234567", campLocation: "Camp Alpha", roomNumber: "102A", status: "Absent", remarks: "Reported fever and bad cough."
        }),
      });
      const data = await response.json(); setResult(data.ai_analysis || data);
    } catch (error) { setResult({ error: "Failed to run agent" }); } finally { setLoading(false); }
  };

  const runOnboardingAgent = async () => {
    setLoading(true); setResult(null);
    try {
      const response = await fetch("/api/agents/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1, employeeName: "John Doe", employeeEmail: "test@example.com", nationality: "British", trade: "Engineer", passportExpiry: "1700000000", visaExpiry: "1600000000" // Expired epochs
        }),
      });
      const data = await response.json(); setResult(data.ai_analysis || data);
    } catch (error) { setResult({ error: "Failed to run agent" }); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-10 text-white font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI Agent Test Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Click an agent below to simulate running it. This will trigger the AI and send the live Telegram alert!
          </p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setActiveTab('procurement')} className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'procurement' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Procurement Agent (PDF)</button>
          <button onClick={() => setActiveTab('campboss')} className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'campboss' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Camp Boss Agent (SMS)</button>
          <button onClick={() => setActiveTab('onboarding')} className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'onboarding' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>HR Onboarding Agent (Email)</button>
        </div>

        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
          {activeTab === 'procurement' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Simulate: Material Request</h2>
              <p className="text-gray-400"><strong>Scenario:</strong> A site engineer requested 500 bags of cement from BuildMart Materials for the Downtown Tower project.</p>
              <button onClick={runProcurementAgent} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 mt-4 text-lg">
                {loading ? "Agent is Generating PDF..." : "Run Procurement Agent"}
              </button>
            </div>
          )}
          {activeTab === 'campboss' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Simulate: Worker Attendance</h2>
              <p className="text-gray-400"><strong>Scenario:</strong> Worker Rahul Sharma is marked as 'Absent' today with remarks: 'Reported fever and bad cough'.</p>
              <button onClick={runCampBossAgent} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 mt-4 text-lg">
                {loading ? "Agent is Translating..." : "Run Camp Boss Agent"}
              </button>
            </div>
          )}
          {activeTab === 'onboarding' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Simulate: New Hire Scan</h2>
              <p className="text-gray-400"><strong>Scenario:</strong> HR uploaded documents for John Doe. The system detects his visa expired.</p>
              <button onClick={runOnboardingAgent} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 mt-4 text-lg">
                {loading ? "Agent is Drafting Email..." : "Run HR Agent"}
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className="bg-gray-900 p-6 rounded-xl border border-blue-900/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              Agent Decision Complete! Check Telegram!
            </h2>
            <pre className="bg-gray-950 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-gray-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
