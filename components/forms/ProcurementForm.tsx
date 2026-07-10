import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Beaker } from "lucide-react";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function ProcurementForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mrNo: "Auto-Assigned on Save", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: ""
  });
  
  const [employeeList, setEmployeeList] = useState<{employee_name: string, employee_id: string}[]>([]);
  const [siteList, setSiteList] = useState<{site_name: string, site_code: string, parent_project_code: string}[]>([]);
  const [projectList, setProjectList] = useState<{project_name: string, project_code: string}[]>([]);
  const [materialList, setMaterialList] = useState<{material_name: string, material_code: string}[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: emps } = await supabase.from('master_employees').select('employee_name, employee_id');
      if (emps) setEmployeeList(emps);

      const { data: sites } = await supabase.from('sites').select('site_name, site_code, parent_project_code');
      if (sites) setSiteList(sites);
      
      const { data: projs } = await supabase.from('projects_master').select('project_name, project_code');
      if (projs) setProjectList(projs);
      
      const { data: mats } = await supabase.from('master_materials').select('material_name, material_code');
      if (mats) setMaterialList(mats);
    };
    fetchMasterData();
  }, []);



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
                agent_metadata: { error: true, reason: 'System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', data[0].id);
              alert("Record Saved.\n\nThe AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('mr_procurement').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: 'System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', data[0].id);
          });
      }

      setFormData({ mrNo: "Auto-Assigned on Save", employeeId: "", requestedBy: "", projectCode: "", projectName: "", siteCode: "", siteName: "", materialName: "", remarks: "", quantity: "", requestedDate: "", requiredDate: "" }); 
    }
    
    setLoading(false);
  };

  const fillQuickData = () => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const required = threeDaysLater.toISOString().split('T')[0];

    setFormData({
      mrNo: "Auto-Assigned on Save",
      employeeId: "EMP-104",
      requestedBy: "Raj Patel",
      projectCode: "PRJ-001",
      projectName: "City Infrastructure Revamp",
      siteCode: "S-001",
      siteName: "Downtown Skyscraper",
      materialName: "Industrial Paint (20L)",
      remarks: "Urgent requirement for finishing works.",
      quantity: "50",
      requestedDate: today,
      requiredDate: required
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Fill Button */}
      <div className="flex gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/80">
        <button type="button" onClick={fillQuickData} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition-all border border-indigo-500/30">
          ⚡ Quick Fill (Paint Requisition)
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
          <SearchableDropdown
            name="requestedBy"
            required
            placeholder="Start typing name..."
            value={formData.requestedBy}
            onChange={(val) => setFormData(prev => ({ ...prev, requestedBy: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, requestedBy: opt.label, employeeId: opt.value }))}
            options={employeeList.map(e => ({ label: e.employee_name, value: e.employee_id }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employee ID</label>
          <input required name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Auto-fills from name..." />
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
              const siteData = opt.siteData;
              const proj = projectList.find(p => p.project_code === siteData.parent_project_code);
              setFormData(prev => ({ 
                ...prev, 
                siteName: opt.label, 
                siteCode: siteData.site_code, 
                projectName: proj?.project_name || "", 
                projectCode: siteData.parent_project_code || "" 
              }));
            }}
            options={siteList.map(s => ({ label: s.site_name, value: s.site_code, siteData: s }))}
          />
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Material Name</label>
          <SearchableDropdown
            name="materialName"
            required
            placeholder="Start typing material..."
            value={formData.materialName}
            onChange={(val) => setFormData(prev => ({ ...prev, materialName: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, materialName: opt.label }))}
            options={materialList.map(m => ({ label: m.material_name, value: m.material_code }))}
          />
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
