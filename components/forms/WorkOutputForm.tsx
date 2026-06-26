import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker } from "lucide-react";

export default function WorkOutputForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectCode: "", projectName: "", technicianId: "", technicianName: "", trade: "", foremanId: "", foremanName: "", workDescription: "", unitOfMeasure: "", outputPerDay: "", date: ""
  });

  const handleQuickFill = (scenario: 'normal' | 'low_output' | 'delayed') => {
    const today = new Date().toISOString().split('T')[0];
    if (scenario === 'normal') {
      setFormData({ date: today, projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", technicianId: "EMP-105", technicianName: "Bob Builder", trade: "Concrete Mason", foremanId: "EMP-109", foremanName: "Tony Stark", workDescription: "Pouring concrete foundation for sector 4.", unitOfMeasure: "Cubic Meters", outputPerDay: "12" });
    } else if (scenario === 'low_output') {
      setFormData({ date: today, projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", technicianId: "EMP-106", technicianName: "John Safe", trade: "Concrete Mason", foremanId: "EMP-109", foremanName: "Tony Stark", workDescription: "Pouring concrete foundation. Extremely slow progress today.", unitOfMeasure: "Cubic Meters", outputPerDay: "2" });
    } else if (scenario === 'delayed') {
      setFormData({ date: today, projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", technicianId: "EMP-107", technicianName: "Mike Ross", trade: "Electrician", foremanId: "EMP-109", foremanName: "Tony Stark", workDescription: "Cable laying. Halted due to missing materials.", unitOfMeasure: "Meters", outputPerDay: "0" });
    }
  };

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
         fetch('/api/agents/work-output', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ...formData, id: newRecord.id })
         });
         alert("Record saved and submitted to Operations AI for analysis!"); 
         setFormData({ projectCode: "", projectName: "", technicianId: "", technicianName: "", trade: "", foremanId: "", foremanName: "", workDescription: "", unitOfMeasure: "", outputPerDay: "", date: "" });
       } catch (err) {
         console.error(err);
       }
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 flex-wrap">
        <button type="button" onClick={() => handleQuickFill('normal')} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Normal Output
        </button>
        <button type="button" onClick={() => handleQuickFill('low_output')} className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Low Productivity
        </button>
        <button type="button" onClick={() => handleQuickFill('delayed')} className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Zero Output (Delayed)
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Code</label>
          <input required name="projectCode" value={formData.projectCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Name</label>
          <input required name="projectName" value={formData.projectName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Technician ID</label>
          <input required name="technicianId" value={formData.technicianId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Technician Name</label>
          <input required name="technicianName" value={formData.technicianName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Trade</label>
          <input required name="trade" value={formData.trade} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Foreman ID</label>
          <input required name="foremanId" value={formData.foremanId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Foreman Name</label>
          <input required name="foremanName" value={formData.foremanName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Unit of Measure (UOM)</label>
          <input required name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
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
