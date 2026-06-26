import { useState } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";
import { Beaker } from "lucide-react";

export default function ToolsManagementForm() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"checkout" | "return">("checkout");
  const [showReturnTab, setShowReturnTab] = useState(false);
  
  // Checkout State
  const [checkoutData, setCheckoutData] = useState({ itemName: "", tagName: "", quantity: "", assignedTo: "", action: "", condition: "", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "" });
  const [checkoutPhotoUrisJson, setCheckoutPhotoUrisJson] = useState<string[]>([]);
  
  const handleQuickFill = (scenario: 'good' | 'damaged' | 'lost') => {
    const today = new Date().toISOString().split('T')[0];
    if (activeStep === "checkout") {
      if (scenario === 'good') {
        setCheckoutData({ ...checkoutData, itemName: "Impact Drill", tagName: "TOOL-DR-01", quantity: "1", assignedTo: "John Safe", action: "Check-Out", condition: "Good", date: today, remarks: "Standard checkout." });
      } else if (scenario === 'damaged') {
        setCheckoutData({ ...checkoutData, itemName: "Rotary Hammer", tagName: "TOOL-DR-02", quantity: "1", assignedTo: "Tony Stark", action: "Check-Out", condition: "Damaged", date: today, remarks: "Tool dropped from scaffold." });
      } else if (scenario === 'lost') {
        setCheckoutData({ ...checkoutData, itemName: "Circular Saw", tagName: "TOOL-SA-01", quantity: "1", assignedTo: "Unknown", action: "Check-Out", condition: "Lost/Stolen", date: today, remarks: "Left on site overnight, missing in morning." });
      }
    } else {
      if (scenario === 'good') {
        setReturnData({ returnedQty: "1", condition: "Good" });
      } else if (scenario === 'damaged') {
        setReturnData({ returnedQty: "1", condition: "Damaged - Broken Handle" });
      } else if (scenario === 'lost') {
        setReturnData({ returnedQty: "0", condition: "Lost/Stolen - Could not find" });
      }
    }
  };
  
  // Return State
  const [returnData, setReturnData] = useState({ returnedQty: "", condition: "" });
  const [returnPhotoUrisJson, setReturnPhotoUrisJson] = useState<string[]>([]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Only send fields that actually exist in the tools_management table schema
    const payload = {
      tagName: checkoutData.tagName,
      quantity: checkoutData.quantity,
      assignedTo: checkoutData.assignedTo,
      itemName: checkoutData.itemName,
      condition: checkoutData.condition,
      checkoutPhotoUrisJson: checkoutPhotoUrisJson
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

      setCheckoutData({ itemName: "", tagName: "", quantity: "", assignedTo: "", action: "", condition: "", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "" }); 
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
      setCheckoutData({ itemName: "", tagName: "", quantity: "", assignedTo: "", action: "", condition: "", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex p-1 bg-gray-900 rounded-xl w-full max-w-sm">
          <button onClick={() => setActiveStep("checkout")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeStep === "checkout" ? "bg-indigo-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>Check-Out</button>
          {showReturnTab && (
            <button onClick={() => setActiveStep("return")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeStep === "return" ? "bg-indigo-500 text-white shadow" : "text-gray-400 hover:text-white"}`}>Return</button>
          )}
        </div>
        <div className="flex justify-end gap-2 flex-wrap">
          <button type="button" onClick={() => handleQuickFill('good')} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors shadow-lg">
            <Beaker className="w-3 h-3" /> Tool (Good)
          </button>
          <button type="button" onClick={() => handleQuickFill('damaged')} className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg">
            <Beaker className="w-3 h-3" /> Tool (Damaged)
          </button>
          <button type="button" onClick={() => handleQuickFill('lost')} className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-lg">
            <Beaker className="w-3 h-3" /> Tool (Lost)
          </button>
        </div>
      </div>

      {activeStep === "checkout" ? (
        <form onSubmit={handleCheckoutSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Item Name</label><input required value={checkoutData.itemName} onChange={(e) => setCheckoutData({...checkoutData, itemName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Tag ID</label><input required value={checkoutData.tagName} onChange={(e) => setCheckoutData({...checkoutData, tagName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Quantity</label><input type="number" required value={checkoutData.quantity} onChange={(e) => setCheckoutData({...checkoutData, quantity: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-gray-300">Assigned To (Custodian)</label><input required value={checkoutData.assignedTo} onChange={(e) => setCheckoutData({...checkoutData, assignedTo: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Checkout Photo (Optional)</label>
            <FileUpload bucketName="new-assets" folderPath="tools/checkout" onUploadComplete={setCheckoutPhotoUrisJson} accept="image/*" />
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
            <label className="text-sm font-medium text-gray-300">Return Photo (Optional)</label>
            <FileUpload bucketName="new-assets" folderPath="tools/return" onUploadComplete={setReturnPhotoUrisJson} accept="image/*" />
          </div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl transition-all">Log Return</button>
        </form>
      )}
    </div>
  );
}
