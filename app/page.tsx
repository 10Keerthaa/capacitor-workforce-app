"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Wallet, ShoppingCart, Briefcase, Wrench, Tent, Users, ChevronRight, BrainCircuit, Download } from "lucide-react";

const modules = [
  { id: "agent-dashboard", title: "Agentic Command Center", desc: "Executive View & Cross-Module Intelligence", icon: BrainCircuit, customPath: "/agent-dashboard", colSpan: "lg:col-span-3 md:col-span-2 col-span-1" },
  { id: "onboarding", title: "Employee Onboarding", icon: UserPlus },
  { id: "petty-cash", title: "Petty Cash", icon: Wallet },
  { id: "procurement", title: "Procurement (MRs)", icon: ShoppingCart },
  { id: "work-output", title: "Work Output", icon: Briefcase },
  { id: "tools", title: "Tools Management", icon: Wrench },
  { id: "camp-boss", title: "Camp Boss", icon: Tent },
  { id: "manpower", title: "Daily Manpower", icon: Users },
  { id: "reports", title: "Reports & Exports", icon: Download },
];

export default function Home() {
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans p-6 md:p-10 pb-24 selection:bg-blue-500/30">
      
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">
        
        {/* Premium Enterprise Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#222] pb-6 mt-2">
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              {greeting}, Keerthana
            </h1>
            <p className="text-sm text-gray-500">
              Here is an overview of your operations today.
            </p>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-4 bg-[#111] border border-[#222] rounded-full p-1.5 pr-5 shadow-sm hover:border-[#333] transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">Keerthana</span>
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Site Admin</span>
            </div>
          </div>
        </header>

        {/* Premium Flat SaaS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const href = mod.customPath || `/modules/${mod.id}`;
            const isCommandCenter = mod.id === "agent-dashboard";

            return (
              <Link key={mod.id} href={href} className={mod.colSpan || "col-span-1"}>
                <div className={`group relative h-full bg-[#111] border border-[#222] rounded-xl p-6 transition-all duration-300 hover:bg-[#151515] hover:border-[#333] hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-center ${isCommandCenter ? 'bg-gradient-to-r from-[#111] to-[#151515] border-[#2a2a2a] min-h-[140px]' : 'min-h-[120px]'}`}>
                  
                  <div className={`flex items-center justify-between relative z-10 ${isCommandCenter ? 'flex-col sm:flex-row sm:items-center' : ''}`}>
                    <div className={`flex items-center gap-4 ${isCommandCenter ? 'space-x-4' : ''}`}>
                      <div className={`rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0 ${isCommandCenter ? 'w-14 h-14 bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'w-12 h-12 bg-[#1a1a1a] text-gray-400 group-hover:text-white border border-[#222]'}`}>
                        <Icon size={isCommandCenter ? 28 : 20} strokeWidth={2} />
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <h3 className={`font-semibold transition-colors ${isCommandCenter ? 'text-xl tracking-tight text-white' : 'text-base tracking-tight text-gray-200 group-hover:text-white'}`}>
                          {mod.title}
                        </h3>
                        {isCommandCenter && (
                          <p className="text-gray-500 mt-1 text-xs font-medium">{mod.desc}</p>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className={`text-gray-600 group-hover:text-white transition-transform duration-300 group-hover:translate-x-1 ${isCommandCenter ? 'hidden sm:block' : ''}`} size={20} strokeWidth={2} />
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
