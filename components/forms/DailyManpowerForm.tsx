import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sun, Moon } from "lucide-react";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function DailyManpowerForm() {
  const [loading, setLoading] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [morningRecordId, setMorningRecordId] = useState<number | null>(null);
  const [otherStaffList, setOtherStaffList] = useState([{ name: "", trade: "" }]);
  const [formData, setFormData] = useState({
    logType: "Morning Check-In", siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "",
    engineer: "", foreman: "", driver: "", date: "", remarks: ""
  });

  const [engineerList, setEngineerList] = useState<string[]>([]);
  const [foremanList, setForemanList] = useState<string[]>([]);
  const [driverList, setDriverList] = useState<string[]>([]);
  const [otherStaffBucket, setOtherStaffBucket] = useState<{name: string, trade: string}[]>([]);
  const [siteList, setSiteList] = useState<{site_name: string, site_code: string, location: string}[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: emps } = await supabase.from('master_employees').select('employee_name, trade');
      if (emps) {
        setEngineerList(emps.filter(e => e.trade === 'Engineer').map(e => e.employee_name));
        setForemanList(emps.filter(e => e.trade === 'Foreman' || e.trade === 'Site Manager').map(e => e.employee_name));
        setDriverList(emps.filter(e => e.trade === 'Driver').map(e => e.employee_name));
        setOtherStaffBucket(emps.filter(e => !['Engineer', 'Foreman', 'Site Manager', 'Driver'].includes(e.trade || '')).map(e => ({ name: e.employee_name, trade: e.trade || '' })));
      }

      const { data: sites } = await supabase.from('sites').select('site_name, site_code, location');
      if (sites) setSiteList(sites);
    };
    fetchMasterData();

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
          siteName: data[0].siteName || ""
        }));
      }
    };
    checkTodayLogs();
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtherStaffBlur = async (index: number, name: string) => {
    const staffName = name.trim();
    if (!staffName) return;

    try {
      const { data, error } = await supabase
        .from('master_employees')
        .select('trade')
        .ilike('employee_name', staffName)
        .maybeSingle();

      if (data && data.trade) {
        const newList = [...otherStaffList];
        newList[index].trade = data.trade;
        setOtherStaffList(newList);
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
      const payload = { ...formData, otherStaff: JSON.stringify(otherStaffList) } as any;
      if (!payload.startTime) payload.startTime = null;
      if (!payload.endTime) payload.endTime = null;
      const response = await supabase.from('daily_manpower').insert([payload]).select().single();
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
          body: JSON.stringify({ ...formData, otherStaff: JSON.stringify(otherStaffList), id: newRecord.id })
        }).then(async (res) => {
            if (!res.ok) {
              await supabase.from('daily_manpower').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: 'System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', newRecord.id);
              alert("Record Saved.\n\nThe AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('daily_manpower').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: 'System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', newRecord.id);
          });
        alert("Record saved and submitted to AI for analysis!"); 
        if (formData.logType === "Morning Check-In") {
          setCanCheckOut(true);
          setMorningRecordId(newRecord.id);
        }
        // Reset form but keep logType logic
        setFormData({ logType: formData.logType, siteNo: "", siteName: "", location: "", taskTitle: "", startTime: "", endTime: "", engineer: "", foreman: "", driver: "", date: "", remarks: "" });
        setOtherStaffList([{ name: "", trade: "" }]);
      } catch (err) {
        console.error(err);
      }
    }
    
    setLoading(false);
  };

  const fillQuickData = () => {
    setFormData({
      logType: "Morning Check-In",
      siteNo: "S-001",
      siteName: "Downtown Skyscraper",
      location: "City Center",
      taskTitle: "Excavation and foundation concrete pouring.",
      startTime: "07:00",
      endTime: "",
      engineer: "Sarah Connor",
      foreman: "Raj Patel",
      driver: "James Bond",
      date: new Date().toISOString().split('T')[0],
      remarks: "All workers equipped with PPE."
    });
    setOtherStaffList([
      { name: "John Doe", trade: "Electrician" },
      { name: "Ali Khan", trade: "Mason" },
      { name: "Carlos Ray", trade: "Plumber" }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Quick Fill Button */}
      <div className="flex gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/80">
        <button type="button" onClick={fillQuickData} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition-all border border-indigo-500/30">
          ⚡ Quick Fill (Morning Check-In)
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
            <label className="text-sm font-medium text-gray-300">Site Name</label>
            <SearchableDropdown
              name="siteName"
              required
              placeholder="Start typing site name..."
              value={formData.siteName}
              onChange={(val) => setFormData(prev => ({ ...prev, siteName: val }))}
              onSelect={(opt) => {
                setFormData(prev => ({
                  ...prev,
                  siteName: opt.label,
                  siteNo: opt.value,
                  location: opt.siteData?.location || prev.location
                }));
              }}
              options={siteList.map(s => ({ label: s.site_name, value: s.site_code, siteData: s }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Site Code (Auto-filled)</label>
            <input readOnly name="siteNo" value={formData.siteNo} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 focus:ring-0 outline-none cursor-not-allowed opacity-70" placeholder="Auto-fills from site name..." />
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
                <label className="text-sm font-medium text-gray-300">Remarks</label>
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
                <SearchableDropdown
                  name="engineer"
                  placeholder="Start typing name..."
                  value={formData.engineer}
                  onChange={(val) => setFormData(prev => ({ ...prev, engineer: val }))}
                  onSelect={(opt) => setFormData(prev => ({ ...prev, engineer: opt.label }))}
                  options={engineerList.map(n => ({ label: n, value: n }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Foreman / In-Charge</label>
                <SearchableDropdown
                  name="foreman"
                  placeholder="Start typing name..."
                  value={formData.foreman}
                  onChange={(val) => setFormData(prev => ({ ...prev, foreman: val }))}
                  onSelect={(opt) => setFormData(prev => ({ ...prev, foreman: opt.label }))}
                  options={foremanList.map(n => ({ label: n, value: n }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Driver</label>
                <SearchableDropdown
                  name="driver"
                  placeholder="Start typing name..."
                  value={formData.driver}
                  onChange={(val) => setFormData(prev => ({ ...prev, driver: val }))}
                  onSelect={(opt) => setFormData(prev => ({ ...prev, driver: opt.label }))}
                  options={driverList.map(n => ({ label: n, value: n }))}
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Other Staff</label>
                <button type="button" onClick={() => setOtherStaffList([...otherStaffList, { name: "", trade: "" }])} className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-500/30 transition-all">+ Add Other Staff</button>
              </div>
              {otherStaffList.map((staff, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <SearchableDropdown
                    placeholder="Enter name to auto-fill trade"
                    value={staff.name}
                    onChange={(val) => {
                      const newList = [...otherStaffList];
                      newList[index].name = val;
                      setOtherStaffList(newList);
                    }}
                    onSelect={(opt) => {
                      const newList = [...otherStaffList];
                      newList[index].name = opt.label;
                      newList[index].trade = opt.trade;
                      setOtherStaffList(newList);
                    }}
                    onBlur={(val) => handleOtherStaffBlur(index, val)}
                    options={otherStaffBucket.map(s => ({ label: s.name, value: s.name, trade: s.trade }))}
                  />
                  <div className="flex gap-2">
                    <input value={staff.trade} onChange={(e) => {
                      const newList = [...otherStaffList];
                      newList[index].trade = e.target.value;
                      setOtherStaffList(newList);
                    }} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Trade" />
                    {otherStaffList.length > 1 && (
                      <button type="button" onClick={() => {
                        const newList = otherStaffList.filter((_, i) => i !== index);
                        setOtherStaffList(newList);
                      }} className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 font-bold transition-all">X</button>
                    )}
                  </div>
                </div>
              ))}
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
