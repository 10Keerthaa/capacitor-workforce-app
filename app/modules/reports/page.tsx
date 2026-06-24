"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import ReportForm from "@/components/forms/ReportForm";

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
              <Download size={20} className="text-green-400" />
              Reports & Data Export
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 rounded-2xl border border-gray-800/60 shadow-xl overflow-hidden p-8">
          <p className="text-gray-400 mb-8">Select a module and a date range to generate and download a raw CSV export of your data.</p>
          <ReportForm />
        </div>
      </div>
    </div>
  );
}
