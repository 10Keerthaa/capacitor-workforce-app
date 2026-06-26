import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker, Sun, Moon } from "lucide-react";

export default function DailyManpowerForm() {
  const [loading, setLoading] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [morningRecordId, setMorningRecordId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    logType: "Morning Check-In", siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "",
    engineer: "", foreman: "", driver: "", otherStaff: "", otherStaffTrade: "", date: "", remarks: ""
  });

  useEffect(() => {
    const checkTodayLogs = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_manpower')
        .select('*')
        .eq('date', today)
        .eq('logType', 'Morning Check-In')
        .limit(1);

      if (data && data.length > 0) {
        setCanCheckOut(true);
        setMorningRecordId(data[0].id);
        setFormData(prev => ({
          ...prev,
          logType: "Evening Check-Out",
          siteNo: data[0].siteNo || "",
          siteName: data[0].siteName || "",
          location: data[0].location || "",
          taskTitle: data[0].taskTitle || "",
          startTime: data[0].startTime || "",
          engineer: data[0].engineer || "",
          foreman: data[0].foreman || "",
          driver: data[0].driver || "",
          otherStaff: data[0].otherStaff || "",
          otherStaffTrade: data[0].otherStaffTrade || ""
        }));
      }
    };
    checkTodayLogs();
  }, []);

  const handleQuickFill = (scenario: 'normal' | 'missing_staff' | 'overtime') => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.logType === "Morning Check-In") {
      if (scenario === 'normal') {
        setFormData({ ...formData, date: today, siteNo: "S-101", siteName: "Downtown Commercial Tower", location: "Level 4 North Wing", taskTitle: "Concrete Pouring", startTime: "07:00", engineer: "John Safe", foreman: "Mike Ross", driver: "Paul Atreides", otherStaff: "", otherStaffTrade: "" });
      } else if (scenario === 'missing_staff') {
        setFormData({ ...formData, date: today, siteNo: "S-102", siteName: "Metro Stn", location: "Underground", taskTitle: "Excavation", startTime: "08:00", engineer: "Tony Stark", foreman: "", driver: "", otherStaff: "", otherStaffTrade: "" });
      } else {
        // Overtime/Trade mismatch setup
        setFormData({ ...formData, date: today, siteNo: "S-101", siteName: "Downtown Commercial Tower", location: "Level 4 North Wing", taskTitle: "Electrical Panel Installation", startTime: "07:00", engineer: "Michael Scott", foreman: "Dwight Schrute", driver: "Jim Halpert", otherStaff: "Kevin Malone", otherStaffTrade: "Plumber" });
      }
    } else {
      if (scenario === 'normal') {
        setFormData({ ...formData, date: today, siteNo: "S-101", siteName: "Downtown Commercial Tower", location: "Level 4 North Wing", taskTitle: "Concrete Pouring", endTime: "17:00", remarks: "Completed on schedule." });
      } else if (scenario === 'missing_staff') {
        setFormData({ ...formData, date: today, siteNo: "S-102", siteName: "Metro Stn", location: "Underground", taskTitle: "Excavation", endTime: "16:00", remarks: "Halted early due to missing foreman." });
      } else {
        setFormData({ ...formData, date: today, siteNo: "S-101", siteName: "Downtown Commercial Tower", location: "Level 4 North Wing", taskTitle: "Electrical Panel Installation", endTime: "22:00", remarks: "15 hour shift. Major delays." });
      }
    }
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
    
    let newRecord;
    let error;

    if (formData.logType === "Evening Check-Out" && morningRecordId) {
      // Update the existing morning row
      const response = await supabase
        .from('daily_manpower')
        .update({
          logType: formData.logType,
          endTime: formData.endTime,
          remarks: formData.remarks,
          taskTitle: formData.taskTitle // in case they changed it
        })
        .eq('id', morningRecordId)
        .select()
        .single();
      newRecord = response.data;
      error = response.error;
    } else {
      // Insert a brand new row (Morning Check-In)
      const response = await supabase.from('daily_manpower').insert([formData]).select().single();
      newRecord = response.data;
      error = response.error;
    }
    
    if (error) {
      alert("Error saving record: " + error.message);
    } else { 
      try {
        fetch('/api/agents/manpower', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: newRecord.id })
        }).then(async (res) => {
            if (!res.ok) {
              await supabase.from('daily_manpower').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: '?? System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', newRecord.id);
              alert("? Record Saved.\n\n?? The AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('daily_manpower').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: '?? System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', newRecord.id);
          });
        alert("Record saved and submitted to AI for analysis!"); 
        if (formData.logType === "Morning Check-In") {
          setCanCheckOut(true);
          setMorningRecordId(newRecord.id);
        }
        // Reset form but keep logType logic
        setFormData({ logType: formData.logType, siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "", engineer: "", foreman: "", driver: "", otherStaff: "", otherStaffTrade: "", date: "", remarks: "" });
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
          <Beaker className="w-3 h-3" /> Normal Check
        </button>
        <button type="button" onClick={() => handleQuickFill('missing_staff')} className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Missing Foreman
        </button>
        <button type="button" onClick={() => handleQuickFill('overtime')} className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Overtime / Mismatch
        </button>
      </div>

      <div className="flex items-center gap-4 bg-gray-900 p-2 rounded-xl border border-gray-800">
        <button 
          type="button"
          onClick={() => setFormData({...formData, logType: "Morning Check-In"})}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${formData.logType === 'Morning Check-In' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-gray-500 hover:bg-gray-800'}`}
        >
          <Sun className="w-4 h-4" /> Morning Check-In
        </button>
        <button 
          type="button"
          disabled={!canCheckOut}
          onClick={() => setFormData({...formData, logType: "Evening Check-Out"})}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${formData.logType === 'Evening Check-Out' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'text-gray-500 hover:bg-gray-800'} ${!canCheckOut ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
        >
          <Moon className="w-4 h-4" /> Evening Check-Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300">Date</label>
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

          {formData.logType === "Morning Check-In" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Task Title</label>
                <input required name="taskTitle" value={formData.taskTitle} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pouring Concrete" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Start Time</label>
                <input type="time" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
            </>
          )}

          {formData.logType === "Evening Check-Out" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Task Title (Verify)</label>
                <input required name="taskTitle" value={formData.taskTitle} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pouring Concrete" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">End Time</label>
                <input type="time" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="endTime" value={formData.endTime} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Remarks / Issues</label>
                <textarea rows={3} name="remarks" value={formData.remarks} onChange={(e: any) => handleChange(e)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Describe what was done and any issues (e.g., 'Finished 80%, delayed by rain')" />
              </div>
            </>
          )}
        </div>
      
        {formData.logType === "Morning Check-In" && (
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
        )}
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
