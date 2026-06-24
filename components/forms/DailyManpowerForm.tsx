import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker } from "lucide-react";

export default function DailyManpowerForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "",
    engineer: "", foreman: "", driver: "", otherStaff: "", otherStaffTrade: "", date: ""
  });

  const handleQuickFill = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      siteNo: "S-005",
      siteName: "Metro Station Alpha",
      location: "Underground Platform B",
      taskTitle: "Emergency Generator Repair",
      startTime: "20:00",
      endTime: "08:00",
      engineer: "Sarah Connor",
      foreman: "Tony Stark",
      driver: "James Bond",
      otherStaff: "Mike Smith",
      otherStaffTrade: "Welder"
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtherStaffBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const staffName = e.target.value.trim();
    if (!staffName) return;

    try {
      const { data, error } = await supabase
        .from('master_employees')
        .select('trade')
        .ilike('employee_name', staffName)
        .maybeSingle();

      if (data && data.trade) {
        setFormData(prev => ({ ...prev, otherStaffTrade: data.trade }));
      }
    } catch (err) {
      console.error('Failed to fetch trade:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: newRecord, error } = await supabase.from('daily_manpower').insert([formData]).select().single();
    
    if (error) {
      alert("Error saving record: " + error.message);
    } else { 
      try {
        fetch('/api/agents/manpower', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: newRecord.id })
        }).catch(err => console.error("Agent call failed:", err));
        alert("Record saved and submitted to AI for analysis!"); 
        setFormData({ siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "", engineer: "", foreman: "", driver: "", otherStaff: "", otherStaffTrade: "", date: "" });
      } catch (err) {
        console.error(err);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={handleQuickFill} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-colors shadow-lg">
          <Beaker className="w-4 h-4" /> Quick Fill (Fatigue Risk Scenario)
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300">Date (YYYY-MM-DD)</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Site Number</label>
          <input required name="siteNo" value={formData.siteNo} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. S-1024" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Site Name</label>
          <input required name="siteName" value={formData.siteName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Location</label>
          <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Task Title</label>
          <input required name="taskTitle" value={formData.taskTitle} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pouring Concrete" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Start Time</label>
          <input type="time" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">End Time</label>
          <input type="time" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="endTime" value={formData.endTime} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Personnel Assignments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Engineer</label>
            <input name="engineer" value={formData.engineer} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Foreman / In-Charge</label>
            <input name="foreman" value={formData.foreman} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Driver</label>
            <input name="driver" value={formData.driver} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Other Staff</label>
            <input name="otherStaff" value={formData.otherStaff} onChange={handleChange} onBlur={handleOtherStaffBlur} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Enter name to auto-fill trade" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Other Staff Trade</label>
            <input name="otherStaffTrade" value={formData.otherStaffTrade} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Trade of additional staff" />
          </div>
        </div>
      </div>
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
