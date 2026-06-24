import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { History as HistoryIcon, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ModuleHistory({ moduleId }: { moduleId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!tableName) return;
    
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

      if (data) setItems(data);
      setLoading(false);
    };

    fetchData();
  }, [moduleId, tableName]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs"><CheckCircle size={12}/> <span>Approved</span></span>;
      case 'rejected': return <span className="flex items-center space-x-1 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs"><XCircle size={12}/> <span>Rejected</span></span>;
      case 'pending_manager_review': return <span className="flex items-center space-x-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-xs"><AlertCircle size={12}/> <span>Needs Review</span></span>;
      default: return <span className="flex items-center space-x-1 text-gray-400 bg-gray-400/10 px-2 py-1 rounded text-xs"><Clock size={12}/> <span>{status || 'Pending'}</span></span>;
    }
  };

  if (!tableName) return null;
  if (loading) return <div className="text-gray-400 p-8 text-center">Loading history...</div>;
  if (items.length === 0) return <div className="text-gray-500 p-8 text-center">No history records found yet.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-6 flex items-center space-x-2"><HistoryIcon size={20}/> <span>Recent Submissions</span></h3>
      {items.map(item => (
        <div key={item.id} className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-gray-400 text-xs">ID: {item.id}</span>
              {getStatusBadge(item.agent_status)}
            </div>
            <div className="text-sm text-gray-300">
               {Object.entries(item).slice(1, 5).map(([k, v]) => {
                 if(k === 'agent_metadata' || k === 'agent_status' || typeof v === 'object' || v === null) return null;
                 return <span key={k} className="mr-4 inline-block mb-1"><strong>{k}:</strong> {String(v)}</span>
               })}
            </div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(item.created_at || Date.now()).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
