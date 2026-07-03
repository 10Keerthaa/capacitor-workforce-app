import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function ManagerApprovalQueue({ moduleId, onAction }: { moduleId: string, onAction?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

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

  const tableName = tableMap[moduleId];

  useEffect(() => {
    fetchPendingItems();
  }, [moduleId, viewMode]);

  const fetchPendingItems = async () => {
    if (!tableName) return;
    setLoading(true);
    
    let query = supabase.from(tableName).select('*').order('id', { ascending: false });
    
    if (viewMode === 'pending') {
      query = query.eq('agent_status', 'pending_manager_review');
    } else {
      query = query.in('agent_status', ['approved', 'rejected']);
    }

    const { data, error } = await query;

    if (data) setItems(data);
    setLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAction = async (id: number, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from(tableName)
      .update({ agent_status: action })
      .eq('id', id);

    if (!error) {
      setItems(items.filter(item => item.id !== id));
      if (onAction) onAction();
    } else {
      alert("Error: " + error.message);
    }
  };

  if (!tableName) return <div className="text-gray-500">Module table not found.</div>;

  if (loading) return <div className="text-gray-400">Loading pending approvals...</div>;



  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
           <span className="text-xl">📋</span>
           <span>Manager Dashboard</span>
        </h3>
        <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
          <button 
            onClick={() => setViewMode('pending')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Pending Queue
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Past Decisions
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
          <CheckCircle size={48} className="text-emerald-500/20 mb-4" />
          <p>{viewMode === 'pending' ? 'All caught up! No pending approvals.' : 'No past decisions found.'}</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {items.map(item => (
            <div key={item.id} className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl transition-all duration-300 hover:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-4">
                <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                  item.agent_status === 'pending_manager_review' ? 'bg-yellow-500/20 text-yellow-400' :
                  item.agent_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.agent_status === 'pending_manager_review' ? 'Needs Review' : item.agent_status}
                </span>
                <p className="text-sm text-gray-400 mt-2">Record ID: {item.id}</p>
              </div>
              <div className="flex space-x-3">
                {viewMode === 'pending' ? (
                  <>
                    <button onClick={() => handleAction(item.id, 'rejected')} className="flex items-center space-x-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors font-medium">
                      <XCircle size={18} /><span>Reject</span>
                    </button>
                    <button onClick={() => handleAction(item.id, 'approved')} className="flex items-center space-x-1 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors font-medium">
                      <CheckCircle size={18} /><span>Approve</span>
                    </button>
                  </>
                ) : (
                  <div className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-1 ${item.agent_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                     {item.agent_status === 'approved' ? <><CheckCircle size={18} /><span>Approved</span></> : <><XCircle size={18} /><span>Rejected</span></>}
                  </div>
                )}
                <button onClick={() => toggleExpand(item.id)} className="flex items-center space-x-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium ml-2">
                  {expandedItems[item.id] ? <><ChevronUp size={18} /><span>Hide Details</span></> : <><ChevronDown size={18} /><span>Show Details</span></>}
                </button>
              </div>
            </div>
            
            {expandedItems[item.id] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in-up">
                {/* Original Submission Card */}
                <div className="bg-gray-900/40 p-5 rounded-2xl text-sm text-gray-300 border border-gray-800 shadow-lg backdrop-blur-sm">
                  <p className="font-semibold text-white mb-4 border-b border-gray-800/80 pb-3 uppercase tracking-wider text-xs">Original Submission Data</p>
                  <div className="space-y-3">
                    {Object.entries(item).map(([key, val]) => {
                      if (key === 'agent_metadata' || key === 'agent_status' || key === 'id' || key === 'created_at' || typeof val === 'object' || val === null || val === '') return null;
                      
                      // Clean up camelCase and snake_case keys for display
                      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ');
                      
                      return (
                        <div key={key} className="flex justify-between items-center border-b border-gray-800/30 pb-2 last:border-0">
                          <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">{formattedKey}</span>
                          <span className="text-right font-semibold text-gray-100 ml-4 break-words">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Executive Summary Card */}
                {item.agent_metadata && (
                  <div className={`p-5 rounded-2xl text-sm flex flex-col h-full shadow-2xl backdrop-blur-md relative overflow-hidden ${
                    (item.agent_metadata.fraud_risk === 'High' || item.agent_metadata.ai_risk_level === 'High' || item.agent_metadata.ai_risk_level === 'Critical' || item.agent_metadata.ai_absenteeism_risk === 'High Risk' || item.agent_metadata.ai_absenteeism_risk === 'High')
                    ? 'bg-gradient-to-br from-red-950/40 via-gray-900/80 to-gray-900/90 border border-red-900/50'
                    : 'bg-gradient-to-br from-emerald-950/40 via-gray-900/80 to-gray-900/90 border border-emerald-900/50'
                  }`}>
                    {/* Decorative glowing orb in background */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
                      (item.agent_metadata.fraud_risk === 'High' || item.agent_metadata.ai_risk_level === 'High' || item.agent_metadata.ai_risk_level === 'Critical' || item.agent_metadata.ai_absenteeism_risk === 'High Risk' || item.agent_metadata.ai_absenteeism_risk === 'High') ? 'bg-red-500' : 'bg-emerald-500'
                    }`}></div>

                    <p className="font-semibold text-white mb-4 border-b border-white/10 pb-3 flex items-center space-x-2 z-10">
                      <span className="text-xl">✨</span>
                      <span className="uppercase tracking-wider text-xs">AI Executive Intelligence</span>
                    </p>
                    
                    <div className="space-y-4 flex-grow z-10">
                      {/* Risk Badge */}
                      {(item.agent_metadata.fraud_risk || item.agent_metadata.ai_risk_level || item.agent_metadata.ai_absenteeism_risk) && (
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                          <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">System Assessment</span>
                          <span className={`font-bold px-3 py-1 rounded-md text-xs tracking-widest uppercase shadow-sm ${
                            (item.agent_metadata.fraud_risk === 'High' || item.agent_metadata.ai_risk_level === 'High' || item.agent_metadata.ai_risk_level === 'Critical' || item.agent_metadata.ai_absenteeism_risk === 'High Risk' || item.agent_metadata.ai_absenteeism_risk === 'High') 
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                            : 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          }`}>
                            {item.agent_metadata.fraud_risk || item.agent_metadata.ai_risk_level || item.agent_metadata.ai_absenteeism_risk}
                          </span>
                        </div>
                      )}

                      {/* Highlights Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {item.agent_metadata.category && (
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Categorization</span>
                            <span className="text-white font-semibold text-sm">{item.agent_metadata.category}</span>
                          </div>
                        )}
                        {item.agent_metadata.recommended_vendor && (
                          <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Approved Vendor</span>
                            <span className="text-white font-semibold text-sm truncate" title={item.agent_metadata.recommended_vendor}>{item.agent_metadata.recommended_vendor}</span>
                          </div>
                        )}
                      </div>

                      {/* Reasoning Block */}
                      <div className="pt-2">
                        <span className="text-gray-400 block mb-2 font-medium text-xs uppercase tracking-wider">AI Reasoning</span>
                        <div className={`p-4 rounded-xl leading-relaxed text-gray-200 border-l-4 shadow-inner ${
                          (item.agent_metadata.fraud_risk === 'High' || item.agent_metadata.ai_risk_level === 'High' || item.agent_metadata.ai_risk_level === 'Critical' || item.agent_metadata.ai_absenteeism_risk === 'High Risk' || item.agent_metadata.ai_absenteeism_risk === 'High') 
                          ? 'bg-red-950/20 border-red-500/80' 
                          : 'bg-emerald-950/20 border-emerald-500/80'
                        }`}>
                          {(() => {
                            const reasonStr = item.agent_metadata.reason || item.agent_metadata.ai_reason || item.agent_metadata.ai_reasoning || "No detailed reasoning provided by the AI for this item.";
                            if (reasonStr.includes('Vendor:')) {
                              const lines = reasonStr.split('\n');
                              return lines.map((line: string, i: number) => {
                                if (line.startsWith('Vendor:') || line.startsWith('Price:')) {
                                  return (
                                    <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1 mb-2 text-blue-400 font-bold w-fit">
                                      {line}
                                    </div>
                                  );
                                }
                                return <p key={i} className="mt-2">{line}</p>;
                              });
                            }
                            return reasonStr;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
