import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function WorkOutputForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectCode: "", projectName: "", technicianId: "", technicianName: "", trade: "", foremanId: "", foremanName: "", workDescription: "", unitOfMeasure: "", outputPerDay: "", date: ""
  });
  
  const [foremanList, setForemanList] = useState<{employee_name: string, employee_id: string}[]>([]);
  const [technicianList, setTechnicianList] = useState<{employee_name: string, employee_id: string, trade: string}[]>([]);
  const [projectList, setProjectList] = useState<{project_name: string, project_code: string}[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: emps } = await supabase.from('master_employees').select('employee_name, employee_id, trade');
      if (emps) {
        setForemanList(emps.filter(e => e.trade === 'Foreman' || e.trade === 'Site Manager'));
        setTechnicianList(emps.filter(e => e.trade !== 'Foreman' && e.trade !== 'Site Manager'));
      }

      const { data: projs } = await supabase.from('projects_master').select('project_name, project_code');
      if (projs) setProjectList(projs);
    };
    fetchMasterData();
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Save raw data to Supabase
    const { data: newRecord, error } = await supabase.from('work_output').insert([formData]).select().single();
    
    if (error) {
       alert("Error saving record: " + error.message);
    } else { 
       // 2. Trigger the AI Operations Agent invisibly in the background
       try {
         const res = await fetch('/api/agents/work-output', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ...formData, id: newRecord.id })
         });
         if (!res.ok) {
           await supabase.from('work_output').update({
             agent_status: 'pending_manager_review',
             agent_metadata: { error: true, reason: 'System Error: AI Overloaded. Rerouted to Manual Review.' }
           }).eq('id', newRecord.id);
           alert("Record Saved.\n\nThe AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
         } else {
           alert("Record saved and submitted to Operations AI for analysis!"); 
         }
       } catch (err) {
         console.error(err);
         await supabase.from('work_output').update({
           agent_status: 'pending_manager_review',
           agent_metadata: { error: true, reason: 'System Error: AI Connection Failed. Rerouted to Manual Review.' }
         }).eq('id', newRecord.id);
       }
       setFormData({ projectCode: "", projectName: "", technicianId: "", technicianName: "", trade: "", foremanId: "", foremanName: "", workDescription: "", unitOfMeasure: "", outputPerDay: "", date: "" });
    }
    
    setLoading(false);
  };

  const fillQuickData = () => {
    setFormData({
      projectCode: "PRJ-001",
      projectName: "City Infrastructure Revamp",
      technicianId: "EMP-101",
      technicianName: "John Doe",
      trade: "Electrician",
      foremanId: "EMP-104",
      foremanName: "Raj Patel",
      workDescription: "Laid cable conduits for the entire ground floor.",
      unitOfMeasure: "meters",
      outputPerDay: "120",
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Fill Button */}
      <div className="flex gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/80">
        <button type="button" onClick={fillQuickData} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition-all border border-indigo-500/30">
          ⚡ Quick Fill (Conduit Installation)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Name</label>
          <SearchableDropdown
            name="projectName"
            required
            placeholder="Start typing project name..."
            value={formData.projectName}
            onChange={(val) => setFormData(prev => ({ ...prev, projectName: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, projectName: opt.label, projectCode: opt.value }))}
            options={projectList.map(p => ({ label: p.project_name, value: p.project_code }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Code</label>
          <input required name="projectCode" value={formData.projectCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from name..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Foreman Name</label>
          <SearchableDropdown
            name="foremanName"
            required
            placeholder="Start typing foreman name..."
            value={formData.foremanName}
            onChange={(val) => setFormData(prev => ({ ...prev, foremanName: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, foremanName: opt.label, foremanId: opt.value }))}
            options={foremanList.map(f => ({ label: f.employee_name, value: f.employee_id }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Foreman ID</label>
          <input required name="foremanId" value={formData.foremanId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from foreman..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Technician Name</label>
          <SearchableDropdown
            name="technicianName"
            required
            placeholder="Start typing tech name..."
            value={formData.technicianName}
            onChange={(val) => setFormData(prev => ({ ...prev, technicianName: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, technicianName: opt.label, technicianId: opt.value, trade: opt.trade || prev.trade }))}
            options={technicianList.map(t => ({ label: t.employee_name, value: t.employee_id, trade: t.trade }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Technician ID</label>
          <input required name="technicianId" value={formData.technicianId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from tech..." />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Trade</label>
          <input required name="trade" value={formData.trade} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from tech..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Unit of Measure (UOM)</label>
          <input required name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-gray-300">Output / Day</label>
          <input type="number" required name="outputPerDay" value={formData.outputPerDay} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-300">Work Description</label>
          <textarea required name="workDescription" value={formData.workDescription} onChange={handleChange} rows={3} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
