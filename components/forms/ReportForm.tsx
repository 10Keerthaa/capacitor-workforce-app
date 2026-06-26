import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const modules = [
    { id: "daily_manpower", name: "Daily Manpower" },
    { id: "camp_boss", name: "Camp Boss" },
    { id: "petty_cash", name: "Petty Cash" },
    { id: "mr_procurement", name: "MR Procurement" },
    { id: "employee_onboarding", name: "Employee Onboarding" },
    { id: "tools_management", name: "Tools Management" },
    { id: "work_output", name: "Work Output" },
  ];

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return alert("Please select a module");
    if (!startDate || !endDate) return alert("Please select start and end dates");

    setLoading(true);

    try {
      // Different modules use different date column names. We map them here:
      let dateColumn = "date";
      if (selectedModule === "tools_management") dateColumn = "checkoutDate";
      if (selectedModule === "mr_procurement") dateColumn = "requestedDate";
      if (selectedModule === "employee_onboarding") dateColumn = "dateOfJoining"; 

      const { data, error } = await supabase
        .from(selectedModule)
        .select("*")
        .gte(dateColumn, startDate)
        .lte(dateColumn, endDate);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No records found in this date range for the selected module.");
        setLoading(false);
        return;
      }

      // Convert JSON array to CSV format
      const filteredData = data.map((row: any) => {
        const newRow = { ...row };
        delete newRow.agent_status;
        delete newRow.agent_metadata;
        return newRow;
      });

      const headers = Object.keys(filteredData[0]).join(",");
      const rows = filteredData.map((row) =>
        Object.values(row)
          .map((value) => {
            // Handle JSON/Object stringification and escape quotes properly
            let strValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || "");
            strValue = strValue.replace(/"/g, '""'); // Escape double quotes for CSV
            return `"${strValue}"`; // Wrap in quotes to handle commas inside text
          })
          .join(",")
      );

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedModule}_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      alert("Export failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleExport} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Select Module</label>
        <select
          required
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="" disabled>Choose a module...</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Start Date</label>
          <input
            type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }}
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">End Date</label>
          <input
            type="date" onClick={(e) => (e.target as any).showPicker?.()} style={{ colorScheme: "dark" }}
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
      >
        {loading ? "Generating CSV..." : "Download CSV Report"}
      </button>
    </form>
  );
}
