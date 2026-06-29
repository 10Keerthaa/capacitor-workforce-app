import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker } from "lucide-react";

export default function ProcurementForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mrNo: "Auto-Assigned on Save", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: ""
  });
  
  const [employeeList, setEmployeeList] = useState<{employee_name: string, employee_id: string}[]>([]);
  const [siteList, setSiteList] = useState<{site_name: string, site_code: string, parent_project_code: string}[]>([]);
  const [projectList, setProjectList] = useState<{project_name: string, project_code: string}[]>([]);
  const [materialList, setMaterialList] = useState<string[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: emps } = await supabase.from('master_employees').select('employee_name, employee_id');
      if (emps) setEmployeeList(emps);

      const { data: sites } = await supabase.from('sites').select('site_name, site_code, parent_project_code');
      if (sites) setSiteList(sites);
      
      const { data: projs } = await supabase.from('projects_master').select('project_name, project_code');
      if (projs) setProjectList(projs);
      
      const { data: mats } = await supabase.from('master_materials').select('material_name');
      if (mats) setMaterialList(mats.map((m: any) => m.material_name));
    };
    fetchMasterData();
  }, []);

  const handleQuickFill = (scenario: 'safe' | 'hoarding' | 'unapproved') => {
    const today = new Date().toISOString().split('T')[0];
    if (scenario === 'safe') {
      setFormData({ mrNo: "Auto-Assigned on Save", employeeId: "EMP-109", requestedBy: "Ahmed Ali", projectCode: "PRJ-002", projectName: "Downtown Mall Project", siteCode: "S-002", siteName: "Site B", materialName: "Safety Gloves", remarks: "Standard weekly restock.", quantity: "50", requestedDate: today, requiredDate: today });
    } else if (scenario === 'hoarding') {
      setFormData({ mrNo: "Auto-Assigned on Save", employeeId: "EMP-110", requestedBy: "Bruce Wayne", projectCode: "PRJ-003", projectName: "Burj Skyline", siteCode: "S-003", siteName: "Site C", materialName: "Copper Wiring (100m)", remarks: "Ordering extra just in case we need it next year.", quantity: "5000", requestedDate: today, requiredDate: today });
    } else if (scenario === 'unapproved') {
      setFormData({ mrNo: "Auto-Assigned on Save", employeeId: "EMP-111", requestedBy: "Clark Kent", projectCode: "PRJ-004", projectName: "Palm Jumeirah Villas", siteCode: "S-004", siteName: "Site D", materialName: "Luxury Office Chairs", remarks: "For the new site trailer.", quantity: "4", requestedDate: today, requiredDate: today });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { ...formData };
    delete (payload as any).mrNo; // Let the system generate this after we get the DB ID

    const { data, error } = await supabase.from('mr_procurement').insert([payload]).select();
    
    if (error) alert("Error saving record: " + error.message);
    else { 
      alert("Record saved! AI is analyzing the request..."); 
      
      if (data && data[0]) {
        // Generate the True Sequential MR Number using the Database ID (e.g. ID 5 becomes MR-1005)
        const generatedMrNo = `MR-${1000 + data[0].id}`;
        const updatedRow = { ...data[0], mrNo: generatedMrNo };
        
        // Update the database with the new sequential number
        await supabase.from('mr_procurement').update({ mrNo: generatedMrNo }).eq('id', data[0].id);

        fetch('/api/agents/procurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRow)
        }).then(async (res) => {
            if (!res.ok) {
              await supabase.from('mr_procurement').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: '?? System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', data[0].id);
              alert("? Record Saved.\n\n?? The AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('mr_procurement').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: '?? System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', data[0].id);
          });
      }

      setFormData({ mrNo: "Auto-Assigned on Save", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: "" }); 
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 flex-wrap">
        <button type="button" onClick={() => handleQuickFill('safe')} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Safe Restock
        </button>
        <button type="button" onClick={() => handleQuickFill('hoarding')} className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Hoarding (5000x)
        </button>
        <button type="button" onClick={() => handleQuickFill('unapproved')} className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Unapproved Item
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">MR No (Auto-Generated)</label>
          <input required name="mrNo" value={formData.mrNo} readOnly className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 focus:ring-0 outline-none cursor-not-allowed opacity-70" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Requested By</label>
          <input required name="requestedBy" list="employee-names" value={formData.requestedBy} onChange={(e) => {
            handleChange(e);
            const match = employeeList.find(emp => emp.employee_name === e.target.value);
            if (match) setFormData(prev => ({ ...prev, employeeId: match.employee_id }));
          }} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Start typing name..." />
          <datalist id="employee-names">
            {employeeList.map(emp => <option key={emp.employee_id} value={emp.employee_name} />)}
          </datalist>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee ID</label>
          <input required name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from name..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Site Name</label>
          <input required name="siteName" list="site-names" value={formData.siteName} onChange={(e) => {
            handleChange(e);
            const match = siteList.find(s => s.site_name === e.target.value);
            if (match) {
              const proj = projectList.find(p => p.project_code === match.parent_project_code);
              setFormData(prev => ({ 
                ...prev, 
                siteCode: match.site_code,
                projectCode: match.parent_project_code || prev.projectCode,
                projectName: proj ? proj.project_name : prev.projectName
              }));
            }
          }} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Start typing site..." />
          <datalist id="site-names">
            {siteList.map(s => <option key={s.site_code} value={s.site_name} />)}
          </datalist>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Site Code</label>
          <input required name="siteCode" value={formData.siteCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from site..." />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Name</label>
          <input required name="projectName" value={formData.projectName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from site..." />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Project Code</label>
          <input required name="projectCode" value={formData.projectCode} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from site..." />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-gray-300">Material Name</label>
          <input required name="materialName" list="material-names" value={formData.materialName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Start typing material..." />
          <datalist id="material-names">
            {materialList.map(m => <option key={m} value={m} />)}
          </datalist>
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
