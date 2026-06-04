"use client";

import { useState } from "react";

export default function TestAgentPage() {
  const [amount, setAmount] = useState("500");
  const [description, setDescription] = useState("Lunch for myself");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runAgent = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/agents/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_name: "Test Worker",
          amount: amount,
          description: description,
          site: "Site A",
        }),
      });

      const data = await response.json();
      setResult(data.agent_analysis);
    } catch (error) {
      console.error(error);
      setResult({ error: "Failed to run agent" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-10 text-white font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Petty Cash Agent Simulator
          </h1>
          <p className="text-gray-400 mt-2">
            Submit a fake expense below to see how the AI Brain analyzes it.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Expense Amount ($)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
              rows={3}
            />
          </div>
          
          <button
            onClick={runAgent}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Agent is Thinking..." : "Run AI Analysis"}
          </button>
        </div>

        {result && (
          <div className="bg-gray-900 p-6 rounded-xl border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <h2 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Agent Decision
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                <p className="font-medium">{result.category}</p>
              </div>
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fraud Risk</p>
                <p className={`font-medium ${result.fraud_risk === 'High' ? 'text-red-400' : result.fraud_risk === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {result.fraud_risk}
                </p>
              </div>
            </div>

            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommendation</p>
                <p className={`font-bold ${result.recommendation === 'Approve' ? 'text-green-400' : result.recommendation === 'Reject' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {result.recommendation}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-gray-300 italic">"{result.reason}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
