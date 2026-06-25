import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker } from "lucide-react";

export default function ProcurementForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mrNo: "", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: ""
  });

  const handleQuickFill = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      mrNo: "MR-1005",
      employeeId: "EMP-109",
      requestedBy: "Tony Stark",
      projectCode: "PRJ-001",
      projectName: "City Infrastructure Revamp",
      siteCode: "S-005",
      siteName: "Metro Station Alpha",
      materialName: "Copper Wiring (100m)",
      remarks: "Standard weekly restock for sector 2. No rush.",
      quantity: "10",
      requestedDate: today,
      requiredDate: today
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.from('mr_procurement').insert([formData]).select();
    
    if (error) alert("Error saving record: " + error.message);
    else { 
      alert("Record saved! AI is analyzing the request..."); 
      
      if (data && data[0]) {
        fetch('/api/agents/procurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data[0])
        }).catch(err => console.error("Agent call failed:", err));
      }

      setFormData({ mrNo: "", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: "" }); 
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={handleQuickFill} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-colors shadow-lg">
          <Beaker className="w-4 h-4" /> Quick Fill (Supply Crisis Scenario)
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">MR No</label>
          <input required name="mrNo" value={formData.mrNo} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee ID</label>
          <input required name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Requested By</label>
          <input required name="requestedBy" value={formData.requestedBy} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
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
          <label className="text-sm font-medium text-gray-300">Site Code</label>
          <input required name="siteCode" value={formData.siteCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Site Name</label>
          <input required name="siteName" value={formData.siteName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="space-y-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-300">Material Name</label>
          <input required name="materialName" value={formData.materialName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Quantity</label>
          <input type="number" required name="quantity" value={formData.quantity} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Requested Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="requestedDate" value={formData.requestedDate} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Required Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="requiredDate" value={formData.requiredDate} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-300">Remarks</label>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
