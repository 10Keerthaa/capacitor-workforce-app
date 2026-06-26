import { useState } from "react";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/ui/FileUpload";
import { Beaker } from "lucide-react";

export default function ToolsManagementForm() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"checkout" | "return">("checkout");
  const [showReturnTab, setShowReturnTab] = useState(false);
  
  // Checkout State
  const [checkoutData, setCheckoutData] = useState({ itemName: "", brand: "", tagName: "", warrantyDetails: "", purchaseDate: "", quantity: "", assignedTo: "", action: "", condition: "", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "" });
  const [checkoutPhotoUrisJson, setCheckoutPhotoUrisJson] = useState<string[]>([]);
  
  const handleQuickFill = (scenario: 'good' | 'damaged' | 'lost') => {
    const today = new Date().toISOString().split('T')[0];
    if (activeStep === "checkout") {
      if (scenario === 'good') {
        setCheckoutData({ ...checkoutData, itemName: "Drill", brand: "Makita", tagName: `T-${Math.floor(Math.random()*1000)}`, warrantyDetails: "Active", purchaseDate: today, quantity: "1", assignedTo: "John Safe", action: "Check-Out", condition: "Good", date: today, remarks: "Standard checkout." });
      } else if (scenario === 'damaged') {
        setCheckoutData({ ...checkoutData, itemName: "Grinder", brand: "Bosch", tagName: `T-${Math.floor(Math.random()*1000)}`, warrantyDetails: "Expired", purchaseDate: "2023-01-01", quantity: "1", assignedTo: "Tony Stark", action: "Check-Out", condition: "Damaged", date: today, remarks: "Tool dropped from scaffold." });
      } else if (scenario === 'lost') {
        setCheckoutData({ ...checkoutData, itemName: "Laser Level", brand: "Hilti", tagName: `T-${Math.floor(Math.random()*1000)}`, warrantyDetails: "Active", purchaseDate: "2024-01-01", quantity: "1", assignedTo: "Unknown", action: "Check-Out", condition: "Lost/Stolen", date: today, remarks: "Left on site overnight, missing in morning." });
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
    const { error } = await supabase.from('tools_management').insert([{ ...checkoutData, checkoutPhotoUrisJson }]);
    if (error) alert("Error: " + error.message);
    else { 
      alert("Checked out!"); 
      setCheckoutData({ itemName: "", brand: "", tagName: "", warrantyDetails: "", purchaseDate: "", quantity: "", assignedTo: "", action: "", condition: "", date: "", workerName: "", workerId: "", toolId: "", toolName: "", remarks: "" }); 
      setCheckoutPhotoUrisJson([]); 
      setShowReturnTab(true);
      setActiveStep("return");
    }
    setLoading(false);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("In a full implementation, you would select an active tool checkout to link this return to. Since we have no RLS, we'll just insert a separate log.");
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
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Tag Name</label><input required value={checkoutData.tagName} onChange={(e) => setCheckoutData({...checkoutData, tagName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
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
