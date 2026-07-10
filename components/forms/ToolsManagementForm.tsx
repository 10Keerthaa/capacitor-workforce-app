import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";

import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

export default function ToolsManagementForm() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"checkout" | "return">("checkout");
  const [showReturnTab, setShowReturnTab] = useState(false);
  const [siteList, setSiteList] = useState<{site_name: string, site_code: string}[]>([]);


  
  // Checkout State
  const [checkoutData, setCheckoutData] = useState({ itemName: "", tagName: "", quantity: "", assignedTo: "", action: "", condition: "Good", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "", siteName: "" });
  const [checkoutPhotoUrisJson, setCheckoutPhotoUrisJson] = useState<string[]>([]);
  
  const [employeeList, setEmployeeList] = useState<{employee_name: string, employee_id: string}[]>([]);
  const [toolList, setToolList] = useState<{tool_name: string, tag_name: string}[]>([]);
  
  // Return State
  const [returnData, setReturnData] = useState({ returnedQty: "", condition: "" });
  const [returnPhotoUrisJson, setReturnPhotoUrisJson] = useState<string[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: sites } = await supabase.from('sites').select('site_name, site_code');
      if (sites) setSiteList(sites);

      const { data: emps } = await supabase.from('master_employees').select('employee_name, employee_id');
      if (emps) setEmployeeList(emps);

      const { data: tools } = await supabase.from('master_tools').select('tool_name, tag_name');
      if (tools) setToolList(tools);
    };
    fetchMasterData();
  }, []);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock coordinates centered around Dubai (Lat: 25.2048, Lng: 55.2708)
    // Adding random offset for scattered pins
    const lat = 25.2048 + (Math.random() * 0.1 - 0.05);
    const lng = 55.2708 + (Math.random() * 0.1 - 0.05);

    // Only send fields that actually exist in the tools_management table schema
    const payload = {
      tagName: checkoutData.tagName,
      quantity: checkoutData.quantity,
      assignedTo: checkoutData.assignedTo,
      itemName: checkoutData.itemName,
      condition: checkoutData.condition,
      checkoutPhotoUrisJson: checkoutPhotoUrisJson,
      siteName: checkoutData.siteName,
      latitude: lat,
      longitude: lng
    };

    const { data, error } = await supabase.from('tools_management').insert([payload]).select();
    
    if (error) alert("Error: " + error.message);
    else { 
      alert("Checked out! AI is verifying custody limits..."); 
      
      // Trigger the AI agent for checkout analysis
      if (data && data[0]) {
        fetch('/api/agents/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data[0])
        }).catch(err => console.error("Agent execution failed:", err));
      }

      // Do NOT clear checkoutData entirely yet, so return flow has access to tagName and assignedTo
      setCheckoutPhotoUrisJson([]); 
      setShowReturnTab(true);
      setActiveStep("return");
    }
    setLoading(false);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Send a new record representing the return event
    const payload = {
      tagName: checkoutData.tagName,
      assignedTo: checkoutData.assignedTo,
      returnedQty: returnData.returnedQty,
      condition: returnData.condition,
      returnPhotoUrisJson: returnPhotoUrisJson
    };
    
    const { data, error } = await supabase.from('tools_management').insert([payload]).select();
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Return Logged! AI is analyzing the return...");
      
      // Trigger the AI agent for the return analysis
      if (data && data[0]) {
        fetch('/api/agents/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data[0])
        }).catch(err => console.error("Agent execution failed:", err));
      }
      
      setReturnData({ returnedQty: "", condition: "" });
      setReturnPhotoUrisJson([]);
      setShowReturnTab(false);
      setActiveStep("checkout");
      setCheckoutData({ itemName: "", tagName: "", quantity: "", assignedTo: "", action: "", condition: "Good", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "", siteName: "" });
    }
    setLoading(false);
  };

  const fillQuickData = () => {
    setCheckoutData(prev => ({
      ...prev,
      itemName: "Impact Drill",
      tagName: "TOOL-DR-01",
      quantity: "2",
      assignedTo: "John Doe",
      siteName: "Downtown Skyscraper",
      condition: "Good"
    }));
  };

  return (
    <div className="space-y-8">
      {/* Quick Fill Button */}
      {activeStep === "checkout" && (
        <div className="flex gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/80">
          <button type="button" onClick={fillQuickData} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition-all border border-indigo-500/30">
            ⚡ Quick Fill (Drill Checkout)
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex p-1 bg-gray-900 rounded-xl w-full max-w-sm">
          <button onClick={() => setActiveStep("checkout")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeStep === "checkout" ? "bg-indigo-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>Check-Out</button>
          {showReturnTab && (
            <button onClick={() => setActiveStep("return")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeStep === "return" ? "bg-indigo-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>Return</button>
          )}
        </div>
      </div>

      {activeStep === "checkout" ? (
        <form onSubmit={handleCheckoutSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Item Name</label>
              <SearchableDropdown
                name="itemName"
                required
                placeholder="Start typing tool name..."
                value={checkoutData.itemName}
                onChange={(val) => setCheckoutData(prev => ({ ...prev, itemName: val }))}
                onSelect={(opt) => setCheckoutData(prev => ({ ...prev, itemName: opt.label, tagName: opt.value }))}
                options={toolList.map(t => ({ label: t.tool_name, value: t.tag_name }))}
              />
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Tag ID</label><input required value={checkoutData.tagName} onChange={(e) => setCheckoutData({...checkoutData, tagName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" placeholder="Auto-fills from tool selection..." /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Quantity</label><input type="number" required value={checkoutData.quantity} onChange={(e) => setCheckoutData({...checkoutData, quantity: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Target Site</label>
              <SearchableDropdown
                name="siteName"
                required
                placeholder="Start typing site name..."
                value={checkoutData.siteName}
                onChange={(val) => setCheckoutData(prev => ({ ...prev, siteName: val }))}
                onSelect={(opt) => setCheckoutData(prev => ({ ...prev, siteName: opt.label }))}
                options={siteList.map(s => ({ label: s.site_name, value: s.site_code }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-300">Assigned To (Custodian)</label>
              <SearchableDropdown
                name="assignedTo"
                required
                placeholder="Start typing employee name..."
                value={checkoutData.assignedTo}
                onChange={(val) => setCheckoutData(prev => ({ ...prev, assignedTo: val }))}
                onSelect={(opt) => setCheckoutData(prev => ({ ...prev, assignedTo: opt.label }))}
                options={employeeList.map(e => ({ label: e.employee_name, value: e.employee_id }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Checkout Photo</label>
            <FileUpload key="checkout-upload" bucketName="new-assets" folderPath="tools/checkout" onUploadComplete={setCheckoutPhotoUrisJson} accept="image/*" capture={true} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">Save Checkout</button>
        </form>
      ) : (
        <form onSubmit={handleReturnSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Returned Qty</label><input type="number" required value={returnData.returnedQty} onChange={(e) => setReturnData({...returnData, returnedQty: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Condition/Status</label><input required value={returnData.condition} onChange={(e) => setReturnData({...returnData, condition: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Return Photo</label>
            <FileUpload key="return-upload" bucketName="new-assets" folderPath="tools/return" onUploadComplete={setReturnPhotoUrisJson} accept="image/*" capture={true} />
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all">Log Return</button>
        </form>
      )}
    </div>
  );
}
