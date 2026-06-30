import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";
import { Beaker, Sparkles, Loader2 } from "lucide-react";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function PettyCashForm() {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [formData, setFormData] = useState({
    pettyCashHolder: "", supplierName: "", description: "", projectCode: "", projectName: "", currency: "USD", amount: "", vat: "", totalAmount: "", date: ""
  });
  
  const [invoiceUrisJson, setInvoiceUrisJson] = useState<string[]>([]);
  const [employeeList, setEmployeeList] = useState<{employee_name: string, employee_id: string}[]>([]);
  const [projectList, setProjectList] = useState<{project_name: string, project_code: string}[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: emps } = await supabase.from('master_employees').select('employee_name, employee_id');
      if (emps) setEmployeeList(emps);

      const { data: projs } = await supabase.from('projects_master').select('project_name, project_code');
      if (projs) setProjectList(projs);
    };
    fetchMasterData();
  }, []);

  const handleOcrUpload = async (urls: string[]) => {
    // Always add to invoice URIs so it's attached to the final form
    setInvoiceUrisJson(prev => Array.from(new Set([...prev, ...urls])));
    
    if (urls.length === 0) return;
    
    setOcrLoading(true);
    try {
      const response = await fetch('/api/agents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urls[urls.length - 1] })
      });
      const resData = await response.json();
      
      if (resData.success && resData.data) {
        const extracted = resData.data;
        setFormData(prev => {
          const newAmount = extracted.amount ? String(extracted.amount) : prev.amount;
          const newVat = extracted.vat ? String(extracted.vat) : prev.vat;
          const amt = parseFloat(newAmount) || 0;
          const v = parseFloat(newVat) || 0;
          
          return {
            ...prev,
            supplierName: extracted.supplierName || prev.supplierName,
            amount: newAmount,
            vat: newVat,
            totalAmount: (newAmount || newVat) ? (amt + v).toFixed(2) : prev.totalAmount,
            date: extracted.date || prev.date
          };
        });
      }
    } catch (error) {
      console.error("OCR failed:", error);
    }
    setOcrLoading(false);
  };

  const handleQuickFill = (scenario: 'safe' | 'fraud' | 'duplicate') => {
    const today = new Date().toISOString().split('T')[0];
    if (scenario === 'safe') {
      setFormData({ pettyCashHolder: "John Safe", supplierName: "Office Depot", description: "Standard office supplies and coffee for the site management meeting.", projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", currency: "USD", amount: "50", vat: "2.50", totalAmount: "52.50", date: today });
    } else if (scenario === 'fraud') {
      setFormData({ pettyCashHolder: "Tony Stark", supplierName: "Luxury Motors", description: "Purchasing a new set of rims for the site manager's personal vehicle.", projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", currency: "USD", amount: "2500", vat: "125", totalAmount: "2625", date: today });
    } else if (scenario === 'duplicate') {
      setFormData({ pettyCashHolder: "Tony Stark", supplierName: "Metro Fuel Services", description: "Lunch for the team.", projectCode: "PRJ-001", projectName: "City Infrastructure Revamp", currency: "USD", amount: "400", vat: "20", totalAmount: "420", date: today });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "amount" || name === "vat") {
        const amt = parseFloat(updated.amount) || 0;
        const v = parseFloat(updated.vat) || 0;
        // If both are empty, we might want to clear it, but 0.00 is fine too. Let's just output if there is some value.
        updated.totalAmount = (updated.amount || updated.vat) ? (amt + v).toFixed(2) : "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { ...formData, invoiceUrisJson };
    // If date is empty, delete it so Supabase uses its CURRENT_DATE default
    if (!payload.date) {
      delete (payload as any).date;
    }
    
    const { data, error } = await supabase.from('petty_cash').insert([payload]).select();
    
    if (error) alert("Error saving record: " + error.message);
    else { 
      alert("Record saved! AI is analyzing the claim..."); 
      
      // Trigger AI Agent in the background
      if (data && data[0]) {
        fetch('/api/agents/petty-cash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data[0])
        }).then(async (res) => {
            if (!res.ok) {
              await supabase.from('petty_cash').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: '?? System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', data[0].id);
              alert("? Record Saved.\n\n?? The AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('petty_cash').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: '?? System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', data[0].id);
          });
      }

      setFormData({ pettyCashHolder: "", supplierName: "", description: "", projectCode: "", projectName: "", currency: "USD", amount: "", vat: "", totalAmount: "", date: "" });
      setInvoiceUrisJson([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Smart Scan Hero Section */}
      <div className="bg-indigo-950/20 border-2 border-indigo-500/30 border-dashed rounded-2xl p-6 relative overflow-hidden group hover:bg-indigo-950/30 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Smart Scan Auto-Fill</h2>
          </div>
          <p className="text-indigo-200/70 text-sm mb-6">
            Save time! Upload your receipt and let AI extract the details instantly.
          </p>
          
          {ocrLoading ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-950/50 rounded-xl border border-indigo-500/20">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
              <p className="text-indigo-300 font-medium animate-pulse">AI is extracting receipt data...</p>
            </div>
          ) : (
            <FileUpload 
              bucketName="new-assets" 
              folderPath="pettycash/invoices" 
              onUploadComplete={handleOcrUpload} 
              multiple={false}
            />
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 flex-wrap">
        <button type="button" onClick={() => handleQuickFill('safe')} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Safe ($50)
        </button>
        <button type="button" onClick={() => handleQuickFill('fraud')} className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Fraud ($2500)
        </button>
        <button type="button" onClick={() => handleQuickFill('duplicate')} className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg">
          <Beaker className="w-3 h-3" /> Lunch ($400)
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Petty Cash Holder</label>
          <SearchableDropdown
            name="pettyCashHolder"
            required
            placeholder="Start typing name..."
            value={formData.pettyCashHolder}
            onChange={(val) => setFormData(prev => ({ ...prev, pettyCashHolder: val }))}
            onSelect={(opt) => setFormData(prev => ({ ...prev, pettyCashHolder: opt.label }))}
            options={employeeList.map(e => ({ label: e.employee_name, value: e.employee_id }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Supplier Name</label>
          <input required name="supplierName" value={formData.supplierName} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300">Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
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
          <label className="text-sm font-medium text-gray-300">Currency</label>
          <select name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none">
            <option>USD</option>
            <option>AED</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Amount</label>
          <input type="number" step="0.01" required name="amount" value={formData.amount} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">VAT</label>
          <input type="number" step="0.01" required name="vat" value={formData.vat} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Total Amount</label>
          <input type="number" step="0.01" required name="totalAmount" value={formData.totalAmount} readOnly className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-400 focus:ring-0 outline-none cursor-not-allowed opacity-70" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Invoice Upload</h3>
        <FileUpload bucketName="new-assets" folderPath="pettycash/invoices" onUploadComplete={setInvoiceUrisJson} multiple={true} />
      </div>

        <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Record"}
        </button>
      </form>
    </div>
  );
}
