import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function CampBossForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", employeeName: "", campLocation: "", roomNumber: "", status: "Present", remarks: "", date: ""
  });

  const [employeeList, setEmployeeList] = useState<{employee_name: string, employee_id: string}[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase.from('master_employees').select('employee_name, employee_id');
      if (data) setEmployeeList(data);
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: newRecord, error } = await supabase.from('camp_boss').insert([formData]).select().single();
    
    if (error) {
      alert("Error saving record: " + error.message);
    } else { 
      try {
        fetch('/api/agents/camp-boss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: newRecord.id })
        }).then(async (res) => {
            if (!res.ok) {
              await supabase.from('camp_boss').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: 'System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', newRecord.id);
              alert("Record Saved.\n\nThe AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('camp_boss').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: 'System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', newRecord.id);
          });
        alert("Record saved and submitted to AI for analysis!"); 
        setFormData({ employeeId: "", employeeName: "", campLocation: "", roomNumber: "", status: "Present", remarks: "", date: "" });
      } catch (err) {
        console.error(err);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee Name</label>
          <SearchableDropdown
            name="employeeName"
            required
            placeholder="Start typing name..."
            value={formData.employeeName}
            onChange={(val) => setFormData(prev => ({ ...prev, employeeName: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, employeeName: opt.label, employeeId: opt.value }))}
            options={employeeList.map(emp => ({ label: emp.employee_name, value: emp.employee_id }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee ID</label>
          <input required name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from name..." />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Camp Location</label>
          <input required name="campLocation" value={formData.campLocation} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Room Number</label>
          <input required name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Status</label>
          <select required name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
            <option>Present</option>
            <option>Absent</option>
            <option>Sick Leave</option>
            <option>Annual Leave</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300">Remarks</label>
          <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      
        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
