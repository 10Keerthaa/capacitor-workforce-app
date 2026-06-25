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
  
  const handleQuickFill = () => {
    setActiveStep("checkout");
    setCheckoutData({
      ...checkoutData,
      date: new Date().toISOString().split('T')[0],
      workerName: "John Safe",
      workerId: "EMP-111",
      toolId: "T-800",
      toolName: "Makita Hammer Drill",
      action: "Check-Out",
      condition: "Excellent",
      remarks: "Standard checkout for morning shift."
    });
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
      setCheckoutData({ itemName: "", brand: "", tagName: "", warrantyDetails: "", purchaseDate: "", quantity: "", assignedTo: "" }); 
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
        <button type="button" onClick={handleQuickFill} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-colors shadow-lg">
          <Beaker className="w-4 h-4" /> Quick Fill (Mass Checkout)
        </button>
      </div>

      {activeStep === "checkout" ? (
        <form onSubmit={handleCheckoutSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Item Name</label><input required value={checkoutData.itemName} onChange={(e) => setCheckoutData({...checkoutData, itemName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Brand</label><input required value={checkoutData.brand} onChange={(e) => setCheckoutData({...checkoutData, brand: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Tag Name</label><input required value={checkoutData.tagName} onChange={(e) => setCheckoutData({...checkoutData, tagName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Quantity</label><input type="number" required value={checkoutData.quantity} onChange={(e) => setCheckoutData({...checkoutData, quantity: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Purchase Date</label><input type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }} required value={checkoutData.purchaseDate} onChange={(e) => setCheckoutData({...checkoutData, purchaseDate: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Assigned To (Custodian)</label><input required value={checkoutData.assignedTo} onChange={(e) => setCheckoutData({...checkoutData, assignedTo: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
            <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-gray-300">Warranty Details</label><input value={checkoutData.warrantyDetails} onChange={(e) => setCheckoutData({...checkoutData, warrantyDetails: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none" /></div>
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
