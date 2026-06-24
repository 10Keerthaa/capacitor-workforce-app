"use client";

import Link from "next/link";
import { UserPlus, Wallet, ShoppingCart, Briefcase, Wrench, Tent, Users, ChevronRight } from "lucide-react";

const modules = [
  { id: "onboarding", title: "Employee Onboarding", icon: UserPlus, color: "from-blue-500 to-cyan-400" },
  { id: "petty-cash", title: "Petty Cash", icon: Wallet, color: "from-emerald-500 to-teal-400" },
  { id: "procurement", title: "Procurement (MRs)", icon: ShoppingCart, color: "from-orange-500 to-amber-400" },
  { id: "work-output", title: "Work Output", icon: Briefcase, color: "from-purple-500 to-pink-400" },
  { id: "tools", title: "Tools Management", icon: Wrench, color: "from-slate-500 to-gray-400" },
  { id: "camp-boss", title: "Camp Boss", icon: Tent, color: "from-indigo-500 to-blue-400" },
  { id: "manpower", title: "Daily Manpower", icon: Users, color: "from-rose-500 to-red-400" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
            10xWorkforce.AI
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Select a module below to enter new data or view history.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} href={`/modules/${mod.id}`}>
                <div className="group relative overflow-hidden bg-gray-900 border border-gray-800/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)] hover:border-indigo-500/50 hover:-translate-y-1 cursor-pointer">
                  {/* Subtle Background Glow on Hover */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mod.color} opacity-0 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 group-hover:opacity-15`}></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${mod.color} text-white shadow-lg`}>
                        <Icon size={26} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
                        {mod.title}
                      </h3>
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-indigo-400 transition-transform duration-300 group-hover:translate-x-1" size={24} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
