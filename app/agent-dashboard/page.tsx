"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, BrainCircuit, AlertTriangle, CheckCircle, 
  Clock, ShieldAlert, Cpu, Network, Zap, Pause, AlertCircle, ChevronRight, Server,
  RefreshCw, Target, TrendingUp, LayoutDashboard, Users, BarChart3, Search, Filter, XCircle, MapPin, Database, Save, Plus, Edit2, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/ui/LiveMap'), { ssr: false });

export default function AgenticDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [supervisorReport, setSupervisorReport] = useState<any>(null);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [isSweeping, setIsSweeping] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<any>(null);
  
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [agentData, setAgentData] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, processed: 0, approvals: 0, confidence: 94.2 });

  // Worker Data State
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [newWorkerForm, setNewWorkerForm] = useState({ name: '', employee_id: '', trade: '', labor_type: 'Direct', assigned_project: 'Unassigned' });
  const [isAddingWorker, setIsAddingWorker] = useState(false);

  const [editingWorkerId, setEditingWorkerId] = useState<number | null>(null);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingWorker(true);
    try {
      if (editingWorkerId) {
        const { error } = await supabase.from('master_employees').update({ 
          employee_name: newWorkerForm.name,
          employee_id: newWorkerForm.employee_id,
          trade: newWorkerForm.trade,
          labor_type: newWorkerForm.labor_type,
          assigned_project: newWorkerForm.assigned_project
        }).eq('id', editingWorkerId);
        if (error) {
          alert("Error updating worker: " + error.message);
        } else {
          setIsAddWorkerModalOpen(false);
          setNewWorkerForm({ name: '', employee_id: '', trade: '', labor_type: 'Direct', assigned_project: 'Unassigned' });
          setEditingWorkerId(null);
          fetchDashboardData();
        }
      } else {
        const { error } = await supabase.from('master_employees').insert([{ 
          employee_name: newWorkerForm.name,
          employee_id: newWorkerForm.employee_id,
          trade: newWorkerForm.trade,
          labor_type: newWorkerForm.labor_type,
          assigned_project: newWorkerForm.assigned_project
        }]);
        if (error) {
          alert("Error adding worker: " + error.message);
        } else {
          setIsAddWorkerModalOpen(false);
          setNewWorkerForm({ name: '', employee_id: '', trade: '', labor_type: 'Direct', assigned_project: 'Unassigned' });
          fetchDashboardData();
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("An unexpected error occurred: " + err.message);
    } finally {
      setIsAddingWorker(false);
    }
  };

  const handleDeleteWorker = async (id: number) => {
    if(!confirm("Are you sure you want to delete this worker?")) return;
    try {
      await supabase.from('master_employees').delete().eq('id', id);
      fetchDashboardData();
    } catch(e) { console.error(e); }
  };

  // Master Data State
  const [masterDataTab, setMasterDataTab] = useState('projects');
  const [masterDataList, setMasterDataList] = useState<any[]>([]);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);
  const [masterDataForm, setMasterDataForm] = useState<any>({});
  const [isAddingMasterData, setIsAddingMasterData] = useState(false);

  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [projectListDropdown, setProjectListDropdown] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'master-data') {
      const fetchMasterDataList = async () => {
        let table = 'projects_master';
        if (masterDataTab === 'projects') table = 'projects_master';
        else if (masterDataTab === 'materials') table = 'master_materials';
        else if (masterDataTab === 'sites') table = 'sites';
        else if (masterDataTab === 'camps') table = 'master_camps';
        
        const { data } = await supabase.from(table).select('*').limit(50);
        if (data) setMasterDataList(data);

        if (masterDataTab === 'sites') {
           const { data: proj } = await supabase.from('projects_master').select('project_code, project_name');
           if (proj) setProjectListDropdown(proj);
        }
      };
      fetchMasterDataList();
    }
  }, [activeTab, masterDataTab]);

  const handleSaveMasterData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMasterData(true);
    let table = 'projects_master';
    if (masterDataTab === 'projects') table = 'projects_master';
    else if (masterDataTab === 'materials') table = 'master_materials';
    else if (masterDataTab === 'sites') table = 'sites';
    else if (masterDataTab === 'camps') table = 'master_camps';

    try {
      if (editingMasterId) {
        const { error } = await supabase.from(table).update([masterDataForm]).eq('id', editingMasterId);
        if (!error) {
          setIsMasterDataModalOpen(false);
          setMasterDataForm({});
          setEditingMasterId(null);
          const { data } = await supabase.from(table).select('*').limit(50);
          if (data) setMasterDataList(data);
        }
      } else {
        const { error } = await supabase.from(table).insert([masterDataForm]);
        if (!error) {
          setIsMasterDataModalOpen(false);
          setMasterDataForm({});
          const { data } = await supabase.from(table).select('*').limit(50);
          if (data) setMasterDataList(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingMasterData(false);
    }
  };

  const handleDeleteMasterData = async (id: number) => {
    if(!confirm("Are you sure you want to delete this record?")) return;
    let table = 'projects_master';
    if (masterDataTab === 'projects') table = 'projects_master';
    else if (masterDataTab === 'materials') table = 'master_materials';
    else if (masterDataTab === 'sites') table = 'sites';
    else if (masterDataTab === 'camps') table = 'master_camps';
    
    try {
      await supabase.from(table).delete().eq('id', id);
      const { data } = await supabase.from(table).select('*').limit(50);
      if (data) setMasterDataList(data);
    } catch(e) { console.error(e); }
  };

  // Live Chart Data State
  const [laborRoiData, setLaborRoiData] = useState<any[]>([]);
  const [assetData, setAssetData] = useState<any[]>([]);
  const [fraudData, setFraudData] = useState<any[]>([]);
  const [aiHealthData, setAiHealthData] = useState<any[]>([]);
  const [pricingTrendData, setPricingTrendData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    const tables = [
      { name: 'petty_cash', agent: 'Finance Agent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      { name: 'mr_procurement', agent: 'Procurement Agent', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
      { name: 'daily_manpower', agent: 'Manpower Agent', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
      { name: 'work_output', agent: 'Operations Agent', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
      { name: 'camp_boss', agent: 'Workforce Agent', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
      { name: 'tools_management', agent: 'Asset Agent', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
      { name: 'employee_onboarding', agent: 'Onboarding Agent', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    ];

    let allPending: any[] = [];
    let allLogs: any[] = [];
    let totalProcessed = 0;
    let dynamicAgents: any[] = [];

    await Promise.all(tables.map(async (t) => {
      // Get Pending Approvals
      const { data: pending } = await supabase
        .from(t.name)
        .select('*')
        .eq('agent_status', 'pending_manager_review')
        .order('id', { ascending: false })
        .limit(3);
      
      if (pending) {
        pending.forEach(p => {
          let titleString = p.employeeName || p.projectName || p.siteName || p.supplierName || p.toolName || p.expenseType || 'Record';
          let description = `ID: ${p.id} (${titleString})`;
          let details = p.agent_metadata?.ai_reasoning || p.agent_metadata?.reason || 'High risk detected by AI. Review required.';
          
          if (t.name === 'camp_boss' && p.agent_metadata) {
            details = `Risk Level: ${p.agent_metadata.ai_absenteeism_risk || 'N/A'}\nRecommended Action: ${p.agent_metadata.ai_replacement_action || 'N/A'}\nCamp Utilization: ${p.agent_metadata.ai_camp_utilization || 'N/A'}\nReasoning: ${p.agent_metadata.ai_reasoning || 'N/A'}`;
          }
          
          if (t.name === 'mr_procurement' && p.agent_metadata) {
            details = `Priority: ${p.agent_metadata.ai_priority || 'Normal'}\nPricing Trend: ${p.agent_metadata.ai_pricing_trend || 'N/A'}\nEmail Draft: ${p.agent_metadata.ai_email_draft || 'N/A'}\nReasoning: ${p.agent_metadata.ai_reason || 'N/A'}`;
          }

          let priorityScore = 0;
          if (p.agent_metadata?.ai_priority === 'Critical') priorityScore = 1000000;

          allPending.push({ id: p.id, sourceTable: t.name, agentName: t.agent, color: t.color, description, details, sortId: p.id + priorityScore });
        });
      }

      // Get Logs / Load
      const { data: recent, count } = await supabase
        .from(t.name)
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .limit(3);

      if (recent) {
        recent.forEach(r => {
          // Check for error/timeout reason
          const isError = r.agent_metadata?.error || (r.agent_metadata?.reason && r.agent_metadata.reason.includes('System Error'));
          let action = isError ? '⚠️ AI Timeout: Rerouted to Manual Review' : `Processed new record for ${r.projectName || r.siteName || r.trade || r.id}`;
          
          allLogs.push({
            id: r.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: r.id,
            agent: t.agent,
            action: action,
            type: isError ? 'error' : (r.agent_status === 'pending_manager_review' ? 'warning' : 'success')
          });
        });
      }

      totalProcessed += (count || 0);
      const load = Math.min(Math.floor(((count || 0) / 10) * 100) + Math.floor(Math.random() * 20), 100);
      const status = load > 50 ? 'active' : load > 10 ? 'waiting' : 'idle';

      dynamicAgents.push({ id: t.name, name: t.agent, role: t.name.replace('_', ' ').toUpperCase(), status, load, color: t.color, bg: t.bg, border: t.border });
    }));

    allPending.sort((a, b) => b.sortId - a.sortId);
    allLogs.sort((a, b) => b.fullTime - a.fullTime);

    setPendingApprovals(allPending);
    setRecentLogs(allLogs.slice(0, 10));
    setAgentData(dynamicAgents);
    setStats({
      active: dynamicAgents.filter(a => a.status === 'active').length,
      processed: totalProcessed,
      approvals: allPending.length,
      confidence: 94.2
    });

    // Fetch Workers Data
    const { data: masterWorkers } = await supabase.from('master_employees').select('*');
    const { data: projList } = await supabase.from('projects_master').select('project_code, project_name');
    if (projList) setProjectListDropdown(projList);
    const { data: manpowerLogs } = await supabase.from('daily_manpower')
      .select('siteName, date, engineer, foreman, driver, otherStaff')
      .order('id', { ascending: false })
      .limit(1000);
    const { data: campBossLogs } = await supabase.from('camp_boss')
      .select('employeeId, employeeName, status, date')
      .order('id', { ascending: false })
      .limit(1000);

    if (masterWorkers) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      
      const processedWorkers = masterWorkers.map(w => {
        const campRecordToday = campBossLogs?.find(c => 
          (c.employeeId === w.employee_id || c.employeeName === w.employee_name) &&
          (c.date === todayDateStr || c.date?.startsWith(todayDateStr))
        );

        const isWorkerInManpowerLog = (log: any, workerName: string) => {
          if (!log || !workerName) return false;
          const lowerName = workerName.toLowerCase();
          return (
            log.engineer?.toLowerCase() === lowerName ||
            log.foreman?.toLowerCase() === lowerName ||
            log.driver?.toLowerCase() === lowerName ||
            log.otherStaff?.toLowerCase().includes(lowerName)
          );
        };

        const assignmentToday = manpowerLogs?.find(m => 
          isWorkerInManpowerLog(m, w.employee_name) && 
          (m.date === todayDateStr || m.date?.startsWith(todayDateStr))
        );
        
        const mostRecent = assignmentToday || manpowerLogs?.find(m => 
          isWorkerInManpowerLog(m, w.employee_name)
        );

        let finalStatus = 'Active'; // Default to Active if not in camp boss logs
        let finalSite = 'Unassigned';

        if (campRecordToday) {
          // If they have a camp boss record today, they are absent
          finalStatus = 'Absent';
          finalSite = 'In Camp (Absent)';
        } else {
          // If they are active, we just use daily_manpower to find WHERE they are
          if (assignmentToday) {
            finalSite = assignmentToday.siteName;
          } else if (mostRecent) {
            finalSite = `Last: ${mostRecent.siteName}`;
          }
        }

        return {
          db_id: w.id,
          id: w.employee_id || w.id,
          name: w.employee_name || 'Unknown Worker',
          role: w.trade || 'General Worker',
          status: finalStatus,
          site: finalSite,
          contact: 'N/A', // contact not in master_employees
          joinDate: 'Recent',
          labor_type: w.labor_type || 'Direct',
          assigned_project: w.assigned_project || w.current_site || 'Unassigned'
        };
      });
      setWorkersList(processedWorkers);
    }
  };

  const fetchChartData = async () => {
    try {
      // 1. Asset Drain
      const { data: tools } = await supabase.from('tools_management').select('condition');
      let active = 0, damaged = 0, lost = 0;
      tools?.forEach(t => {
        if (t.condition === 'Good' || t.condition === 'Active' || t.condition === 'Excellent') active++;
        else if (t.condition === 'Damaged') damaged++;
        else lost++;
      });
      const totalTools = active + damaged + lost;
      if (totalTools === 0) {
        setAssetData([{ name: 'No Data', value: 1, color: '#333' }]);
      } else {
        setAssetData([
          { name: 'Active Tools', value: active, color: '#10b981' },
          { name: 'Damaged', value: damaged, color: '#f59e0b' },
          { name: 'Lost/Stolen', value: lost, color: '#ef4444' },
        ]);
      }

      // 2. Fraud Radar
      const { data: proc } = await supabase.from('mr_procurement').select('projectName, siteName, agent_metadata');
      const { data: petty } = await supabase.from('petty_cash').select('projectName, agent_metadata');
      let fMap: any = {};
      const addRisk = (site: string, isHoard: boolean) => {
        if (!fMap[site]) fMap[site] = { site, hoardingRisk: 0, pettyCashAnomalies: 0 };
        if (isHoard) fMap[site].hoardingRisk++;
        else fMap[site].pettyCashAnomalies++;
      };
      proc?.forEach(p => {
        const risk = p.agent_metadata?.ai_risk_level || p.agent_metadata?.hoarding_risk;
        if (risk === 'High' || risk === 'Critical') addRisk(p.siteName || p.projectName || 'General', true);
      });
      petty?.forEach(p => {
        const risk = p.agent_metadata?.fraud_risk || p.agent_metadata?.ai_risk_level;
        if (risk === 'High' || risk === 'Critical') addRisk(p.projectName || 'General', false);
      });
      setFraudData(Object.values(fMap));

      // 3. Labor ROI
      const { data: camp } = await supabase.from('camp_boss').select('date, status');
      const { data: work } = await supabase.from('work_output').select('date, outputPerDay');
      let dateMap: any = {};
      camp?.forEach(c => {
        if (!c.date) return;
        if (!dateMap[c.date]) dateMap[c.date] = { name: c.date, headcount: 0, output: 0 };
        if (c.status === 'Present') dateMap[c.date].headcount++;
      });
      work?.forEach(w => {
        if (!w.date) return;
        if (!dateMap[w.date]) dateMap[w.date] = { name: w.date, headcount: 0, output: 0 };
        dateMap[w.date].output += (parseFloat(w.outputPerDay) || 0);
      });
      const roiArr = Object.values(dateMap).sort((a:any,b:any) => a.name.localeCompare(b.name)).slice(-7);
      setLaborRoiData(roiArr.length ? roiArr : [{name: 'No Data', headcount: 0, output: 0}]);

      // 4. AI Health
      let hMap: any = {};
      for (const t of ['work_output', 'petty_cash', 'mr_procurement', 'daily_manpower']) {
        const { data } = await supabase.from(t).select('agent_status');
        data?.forEach(d => {
          const day = 'Recent Activity';
          if (!hMap[day]) hMap[day] = { day, autonomous: 0, blocked: 0 };
          if (d.agent_status === 'approved') hMap[day].autonomous++;
          else if (d.agent_status === 'pending_manager_review') hMap[day].blocked++;
        });
      }
      setAiHealthData(Object.values(hMap).length ? Object.values(hMap) : [{day: 'Recent Activity', autonomous: 1, blocked: 0}]);

      // 5. Pricing Trends
      const { data: pricingData } = await supabase
        .from('mr_procurement')
        .select('materialName, unitPrice, created_at')
        .order('created_at', { ascending: true });
        
      if (pricingData && pricingData.length > 0) {
        // Find the most frequently ordered material for the chart
        const materialCounts: Record<string, number> = {};
        pricingData.forEach(p => {
          if (p.materialName) {
            materialCounts[p.materialName] = (materialCounts[p.materialName] || 0) + 1;
          }
        });
        
        let topMaterial = '';
        let maxCount = 0;
        for (const [mat, count] of Object.entries(materialCounts)) {
          if (count > maxCount) { maxCount = count; topMaterial = mat; }
        }

        if (topMaterial) {
          const chartPoints = pricingData
            .filter(p => p.materialName === topMaterial && p.created_at && p.unitPrice > 0)
            .map(p => ({
              date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: parseFloat(p.unitPrice),
              material: p.materialName
            }));
          setPricingTrendData(chartPoints.length > 0 ? chartPoints : [{ date: 'No Data', price: 0, material: topMaterial }]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLatestReport = async () => {
    const { data } = await supabase
      .from('supervisor_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data && data.length > 0) {
      setReportHistory(data);
      setSupervisorReport(data[0]);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchLatestReport();
    fetchDashboardData();
    fetchChartData();

    // Auto-collapse sidebar after 1.5 seconds for sleek intro
    const timer = setTimeout(() => {
      setIsSidebarCollapsed(true);
    }, 1500);

    // Set up Real-Time Dashboard Metrics
    const tablesToWatch = [
      'petty_cash', 'mr_procurement', 'daily_manpower', 'work_output', 
      'camp_boss', 'tools_management', 'employee_onboarding'
    ];

    const channel = supabase.channel('dashboard-metrics');

    tablesToWatch.forEach(tableName => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          // Re-fetch data whenever any of the tables change
          fetchDashboardData();
          fetchChartData();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, []);

  const handleDrawerAction = async (id: number, sourceTable: string, action: 'approved' | 'rejected' | 'processing') => {
    try {
      const { error } = await supabase
        .from(sourceTable)
        .update({ agent_status: action })
        .eq('id', id);
        
      if (!error) {
        setPendingApprovals(prev => prev.filter(p => p.id !== id || p.sourceTable !== sourceTable));
        setSelectedReviewItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runGlobalSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await fetch('/api/agents/supervisor', { method: 'POST', body: JSON.stringify({}) });
      if (res.ok) {
        await fetchLatestReport();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSweeping(false);
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
        isSidebarCollapsed ? 'justify-center w-12 mx-auto px-0' : 'w-full'
      } ${
        activeTab === id 
          ? 'bg-blue-400 text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]' 
          : 'text-gray-400 hover:text-white hover:bg-[#111]'
      }`}
      title={isSidebarCollapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isSidebarCollapsed && label}
    </button>
  );

  const renderDashboard = () => (
    <div className="animate-fade-in-up">

      {/* Top Stats */}
      <div className="flex flex-row overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10 pb-2 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {[
          { title: 'Total Workers (Present)', value: `${workersList.filter(w => w.status === 'Active').length}/${workersList.length}`, icon: Users, color: 'text-indigo-400', glow: 'bg-indigo-500/5' },
          { title: 'Tasks Processed', value: stats.processed.toLocaleString(), icon: Activity, color: 'text-emerald-400', glow: 'bg-emerald-500/5' },
          { title: 'Pending Approvals', value: stats.approvals, icon: AlertTriangle, color: 'text-amber-400', glow: 'bg-amber-500/5' },
          { title: 'Critical Alerts', value: supervisorReport?.system_status === 'CRITICAL' ? '1 High Risk' : '0 High Risk', icon: ShieldAlert, color: 'text-rose-400', glow: 'bg-rose-500/5' },
        ].map((stat, i) => (
          <div key={i} className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-start bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 relative overflow-hidden group hover:bg-[#111] hover:border-[#333] transition-all duration-500">
            <div className={`absolute -right-10 -top-10 w-32 h-32 ${stat.glow} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">{stat.title}</p>
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
            </div>
            <h3 className="text-4xl font-semibold tracking-tight text-white relative z-10">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>


      {/* ENTERPRISE COMMAND CENTER GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative z-10 mb-10">
        
        {/* Left Half: MASTER SUPERVISOR INTELLIGENCE PANEL */}
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 relative overflow-hidden group flex flex-col h-[600px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-1000"></div>
          
          <div className="flex justify-between items-center mb-6 gap-4 border-b border-[#222] pb-4 relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#111] rounded-xl border border-[#333]">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Master Supervisor Core</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {reportHistory.length > 0 && (
                <select 
                  className="bg-[#111] border border-[#333] text-gray-300 text-[10px] uppercase tracking-widest font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer appearance-none"
                  value={supervisorReport?.id || ''}
                  onChange={(e) => {
                    const selected = reportHistory.find(r => r.id === parseInt(e.target.value));
                    if (selected) setSupervisorReport(selected);
                  }}
                >
                  {reportHistory.map((report, idx) => {
                    const dateObj = new Date(report.created_at);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return (
                      <option key={report.id} value={report.id}>
                        {idx === 0 ? `Latest (${formattedDate})` : formattedDate}
                      </option>
                    );
                  })}
                </select>
              )}
              <button 
                onClick={runGlobalSweep}
                disabled={isSweeping}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-[#222] disabled:text-gray-500 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isSweeping ? 'animate-spin' : ''}`} />
                {isSweeping ? 'Analyzing...' : 'Sweep'}
              </button>
            </div>
          </div>

          {supervisorReport ? (
            <div className="flex flex-col gap-4 relative z-10 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
              {/* Status & Risk */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <p className="text-gray-500 text-[9px] mb-1 uppercase tracking-widest font-medium">System Status</p>
                  <span className={`text-sm font-semibold tracking-tight ${supervisorReport.system_status === 'CRITICAL' ? 'text-rose-400' : supervisorReport.system_status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {supervisorReport.system_status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                  <p className="text-gray-500 text-[9px] mb-1 uppercase tracking-widest font-medium">Financial Risk</p>
                  <span className={`text-sm font-semibold tracking-tight ${supervisorReport.financial_impact_risk === 'High Risk' ? 'text-rose-400' : supervisorReport.financial_impact_risk === 'Medium Risk' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {supervisorReport.financial_impact_risk || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Bottleneck */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-rose-400 font-bold tracking-tight text-xs uppercase">Key Bottleneck Detected</p>
                </div>
                <p className="text-gray-300 leading-relaxed text-xs">{supervisorReport.key_bottleneck}</p>
              </div>

              {/* Action Plan */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 shrink-0">
                <div className="flex items-center gap-2 mb-4 border-b border-[#222] pb-3">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <p className="text-gray-300 font-bold tracking-tight text-xs uppercase">Orchestrated Action Plan</p>
                </div>
                <div className="text-gray-400 text-xs space-y-3">
                  {(supervisorReport.orchestrated_action_plan || '')
                    .replace(/([\.!?])\s*(\d+\.)/g, '$1\n$2')
                    .replace(/(^|\s)(\d+\.)\s/g, '\n$2 ')
                    .split('\n')
                    .map((step: string) => step.trim().replace(/^\d+[\.\)]?\s*/, '').replace(/\*\*/g, ''))
                    .filter((cleanStep: string) => cleanStep.length > 5)
                    .map((cleanStep: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 bg-[#0a0a0a] p-3 rounded-lg border border-[#222]">
                        <div className="text-indigo-400 flex-shrink-0 font-bold mt-0.5">
                          [{idx + 1}]
                        </div>
                        <p className="leading-relaxed">{cleanStep}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center flex-1 bg-[#111] rounded-xl border border-[#222] border-dashed relative z-10 m-2">
              <BrainCircuit className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium text-sm">System is standing by.</p>
              <p className="text-gray-600 text-xs mt-1">Click "Sweep" to run the analysis.</p>
            </div>
          )}
        </div>

        {/* Right Half: Stacked Panels (Human in Loop & Live Feed) */}
        <div className="xl:col-span-2 flex flex-col gap-6 h-[600px]">
          
          {/* Top Panel: Approvals */}
          <div className="flex-1 min-h-0 bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <h2 className="text-[10px] font-medium tracking-widest text-gray-500 uppercase mb-4 flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
            Human-in-the-Loop
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent flex-1">
            {pendingApprovals.length > 0 ? pendingApprovals.map((item, idx) => (
              <div key={idx} className="bg-[#111] border border-[#222] rounded-xl p-4 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/50"></div>
                <div className="flex justify-between items-start mb-2 pl-3">
                  <span className={`text-[9px] font-bold tracking-widest uppercase text-orange-500 bg-orange-500/10 px-2 py-1 rounded`}>{item.agentName}</span>
                  <Clock className="w-3 h-3 text-gray-500"/>
                </div>
                <p className="text-xs text-gray-200 font-medium mb-1 pl-3 line-clamp-2">{item.description}</p>
                <p className="text-[10px] text-gray-500 mb-3 pl-3 line-clamp-2">{item.details}</p>
                <div className="pl-3">
                  <button onClick={() => setSelectedReviewItem(item)} className="inline-block bg-white hover:bg-gray-200 text-black text-[9px] uppercase tracking-widest font-bold py-1.5 px-3 rounded transition-colors text-center cursor-pointer">Review</button>
                </div>
              </div>
            )) : (
              <div className="text-center flex flex-col items-center justify-center h-full bg-[#111] rounded-xl border border-[#222] border-dashed">
                <CheckCircle className="w-6 h-6 text-emerald-500/50 mb-2" />
                <p className="text-gray-500 font-medium text-[10px] uppercase tracking-widest">No Active Threats</p>
              </div>
            )}
          </div>
        </div>

          {/* Bottom Panel: Live Feed */}
          <div className="flex-1 min-h-0 bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 to-transparent opacity-50"></div>
          <h2 className="text-[10px] font-medium tracking-widest text-gray-500 uppercase mb-4 flex items-center gap-2 pl-3 shrink-0">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Live Telemetry
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-0 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
            {recentLogs.map((log, idx) => (
              <div key={`${log.id}-${idx}`} className="flex gap-2 text-[10px] border-b border-[#1a1a1a] py-3 last:border-0 pl-3 hover:bg-[#111] transition-colors">
                <div className="mt-0.5 shrink-0">
                  {log.type === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></div>}
                  {log.type === 'warning' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80"></div>}
                  {log.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80"></div>}
                  {log.type === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-600 font-mono text-[9px] shrink-0">[{log.time}]</span>
                    <span className={`uppercase tracking-widest font-bold truncate ${log.type === 'warning' ? 'text-rose-400' : 'text-indigo-400'}`}>{log.agent}</span>
                  </div>
                  <p className="text-gray-400 line-clamp-2 leading-relaxed">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderWorkers = () => {
    const filteredWorkers = workersList.filter(w => 
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="animate-fade-in-up">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Workers Directory</h1>
            <p className="text-gray-500 text-sm mt-1">{workersList.length} total workers registered</p>
          </div>
          <button 
            onClick={() => {
              setEditingWorkerId(null);
              setNewWorkerForm({ name: '', employee_id: '', trade: '', labor_type: 'Direct', assigned_project: 'Unassigned' });
              setIsAddWorkerModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold tracking-widest text-[10px] uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Worker
          </button>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center gap-4 bg-[#111]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search workers by name or skill..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button className="bg-[#222] hover:bg-[#333] text-gray-300 p-2 rounded-lg transition-colors border border-[#333]">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] border-b border-[#222] text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Trade / Skill</th>
                  <th className="p-4">Status (Present/Absent)</th>
                  <th className="p-4">Assigned Project</th>
                  <th className="p-4">Current Site</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filteredWorkers.map((w, i) => (
                  <tr key={i} className="hover:bg-[#111] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-blue-400 transition-colors">
                          {w.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                        </div>
                        <p className="font-semibold text-gray-200">{w.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-medium">
                      {w.id || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">{w.role}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${w.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                        <span className={`text-xs font-bold ${w.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {w.status === 'Active' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-1 rounded border border-purple-400/20">{w.assigned_project || 'Unassigned'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-gray-300">{w.site || 'Unassigned'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => {
                        setEditingWorkerId(w.db_id);
                        setNewWorkerForm({ 
                          name: w.name, 
                          employee_id: w.id, 
                          trade: w.role, 
                          labor_type: w.labor_type, 
                          assigned_project: w.assigned_project 
                        });
                        setIsAddWorkerModalOpen(true);
                      }} className="text-gray-500 hover:text-blue-400 mr-3 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteWorker(w.db_id)} className="text-gray-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredWorkers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No workers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMasterData = () => {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Master Data Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Manage global system configurations</p>
          </div>
          <button 
            onClick={() => {
              setEditingMasterId(null);
              let defaultForm: any = {};
              if (masterDataList.length > 0) {
                try {
                  const idField = masterDataTab === 'projects' ? 'project_code' : 
                                 masterDataTab === 'materials' ? 'material_code' : 
                                 masterDataTab === 'sites' ? 'site_code' : 'camp_code';
                  const prefix = masterDataTab === 'projects' ? 'PRJ-' : 
                                masterDataTab === 'materials' ? 'MAT-' : 
                                masterDataTab === 'sites' ? 'SIT-' : 'CMP-';
                  
                  const codes = masterDataList.map(item => item[idField]).filter(Boolean);
                  let maxNum = 0;
                  codes.forEach(code => {
                    const match = code.match(/\\d+/);
                    if (match) {
                      const num = parseInt(match[0], 10);
                      if (num > maxNum) maxNum = num;
                    }
                  });
                  if (maxNum > 0) {
                    const nextCode = `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
                    defaultForm[idField] = nextCode;
                  }
                } catch (e) {
                  console.error("Auto sequence error", e);
                }
              }
              setMasterDataForm(defaultForm);
              setIsMasterDataModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold tracking-widest text-[10px] uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Record
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#222] pb-2 overflow-x-auto [scrollbar-width:none]">
          {['projects', 'materials', 'sites', 'camps'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setMasterDataTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${masterDataTab === tab ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:bg-[#111]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] border-b border-[#222] text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  {masterDataTab === 'projects' && <><th className="p-4">Project Name</th><th className="p-4">Project Code</th><th className="p-4">Priority Level</th><th className="p-4 text-right">Actions</th></>}
                  {masterDataTab === 'materials' && <><th className="p-4">Material Name</th><th className="p-4">Vendor</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></>}
                  {masterDataTab === 'sites' && <><th className="p-4">Site Name</th><th className="p-4">Site Code</th><th className="p-4">Location</th><th className="p-4 text-right">Actions</th></>}
                  {masterDataTab === 'camps' && <><th className="p-4">Camp Name</th><th className="p-4">Camp Code</th><th className="p-4">Location</th><th className="p-4 text-right">Actions</th></>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {[...masterDataList].sort((a, b) => {
                  if (masterDataTab === 'projects') {
                    const weight: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    return (weight[b.priority_level] || 0) - (weight[a.priority_level] || 0);
                  }
                  return 0;
                }).map((item, i) => (
                  <tr key={i} className="hover:bg-[#111] transition-colors">
                    {masterDataTab === 'projects' && (
                      <><td className="p-4 text-sm font-semibold text-gray-200">{item.project_name || item.projectName || 'Unnamed'}</td><td className="p-4 text-xs text-gray-400">{item.project_code || 'N/A'}</td><td className="p-4"><span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">{item.priority_level || 'Normal'}</span></td></>
                    )}
                    {masterDataTab === 'materials' && (
                      <><td className="p-4 text-sm font-semibold text-gray-200">{item.material_name || item.item_name || 'Unnamed'}</td><td className="p-4 text-xs text-gray-400">{item.approved_vendor || item.vendor || 'N/A'}</td><td className="p-4 text-xs text-emerald-400">${item.standard_price || item.price || 0}</td></>
                    )}
                    {masterDataTab === 'sites' && (
                      <><td className="p-4 text-sm font-semibold text-gray-200">{item.site_name || 'Unnamed'}</td><td className="p-4 text-xs text-gray-400">{item.site_code || 'N/A'}</td><td className="p-4 text-xs text-gray-400">{item.location || 'N/A'}</td></>
                    )}
                    {masterDataTab === 'camps' && (
                      <><td className="p-4 text-sm font-semibold text-gray-200">{item.camp_name || 'Unnamed'}</td><td className="p-4 text-xs text-gray-400">{item.camp_code || 'N/A'}</td><td className="p-4 text-xs text-gray-400">{item.location || 'N/A'}</td></>
                    )}
                    <td className="p-4 text-right">
                      <button onClick={() => {
                        setEditingMasterId(item.id);
                        setMasterDataForm(item);
                        setIsMasterDataModalOpen(true);
                      }} className="text-gray-500 hover:text-blue-400 mr-3 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteMasterData(item.id)} className="text-gray-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {masterDataList.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMap = () => (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-white">Live Resource Map</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time Asset & Workforce Tracking</p>
      </div>
      <LiveMap />
    </div>
  );

  const renderReports = () => {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white">Executive BI Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time Agentic Analytics & Operations Health</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Labor ROI */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">Labor ROI & Productivity</h3>
            <p className="text-gray-500 text-xs mb-6">Headcount (Camp Boss) vs. Output (Work Output)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={laborRoiData}>
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="output" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" name="Concrete Poured (m3)" />
                  <Line type="monotone" dataKey="headcount" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} name="Total Laborers" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Material Hoarding & Fraud */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold tracking-widest text-orange-400 uppercase mb-2">Material Hoarding & Fraud Radar</h3>
            <p className="text-gray-500 text-xs mb-6">AI High-Risk Flags: Procurement vs. Petty Cash</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fraudData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="site" stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#111' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                  <Bar dataKey="hoardingRisk" name="Hoarding Flags (MR)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pettyCashAnomalies" name="Fraud Flags (Cash)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Physical Asset Drain */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl flex flex-col">
            <h3 className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-2">Physical Asset Drain</h3>
            <p className="text-gray-500 text-xs mb-2">Live Inventory Health (Tools Management)</p>
            <div className="flex-1 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#888' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: AI Intervention Rate */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">System-Wide AI Health</h3>
            <p className="text-gray-500 text-xs mb-6">Autonomous Approvals vs. Manager Interventions</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiHealthData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                  <XAxis type="number" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis dataKey="day" type="category" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#111' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                  <Bar dataKey="autonomous" name="Auto-Approved (Low Risk)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="blocked" name="AI Blocked (Manager Review)" fill="#3b82f6" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>



        </div>
      </div>
    );
  };

  const renderSlideOutDrawer = () => {
    if (!selectedReviewItem) return null;
    const item = selectedReviewItem;
    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setSelectedReviewItem(null)}
        />
        
        {/* Drawer */}
        <div className="relative w-full max-w-lg h-full bg-[#0a0a0a] border-l border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-300 flex flex-col animate-fade-in-up">
          <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#111]">
            <div>
              <h2 className="text-xl font-black tracking-tighter text-white">Human-in-the-Loop Review</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Source: {item.sourceTable}</p>
            </div>
            <button onClick={() => setSelectedReviewItem(null)} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-[#222] rounded-full">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#333]">
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Issue Description</p>
              <p className="text-sm text-gray-200 leading-relaxed">{item.description}</p>
            </div>
            
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-rose-400" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-rose-400">AI Reasoning & Details</p>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed relative z-10 space-y-1">
                {item.details.split('\n').map((line: string, i: number) => {
                  const isHighlight = line.includes('Vendor:') || line.includes('Price:');
                  return (
                    <span key={i} className={`block ${isHighlight ? 'font-bold text-white' : ''}`}>
                      {line}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-[#111] border border-[#222] rounded-xl p-5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Agent Context</p>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold tracking-widest uppercase ${item.color} ${item.bg} px-3 py-1.5 rounded border ${item.border}`}>
                  {item.agentName}
                </span>
                <span className="text-xs text-gray-400">
                  {item.sourceTable === 'petty_cash' ? 'Awaiting Finance Approval' :
                   item.sourceTable === 'employee_onboarding' ? 'Awaiting HR Approval' :
                   item.sourceTable === 'mr_procurement' ? 'Awaiting Procurement Approval' :
                   item.sourceTable === 'work_output' ? 'Awaiting Operations Override' :
                   item.sourceTable === 'daily_manpower' ? 'Awaiting Site Admin Override' :
                   item.sourceTable === 'camp_boss' ? 'Awaiting Camp Manager Override' :
                   item.sourceTable === 'tools_management' ? 'Awaiting Asset Manager Override' :
                   'Awaiting Manager Override'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-[#222] bg-[#111] grid grid-cols-2 gap-4">
            {item.details?.includes('System Error') ? (
              <button 
                onClick={() => {
                  // In a real scenario, this triggers the API route again
                  alert("Triggering AI Retry for " + item.sourceTable);
                  handleDrawerAction(item.id, item.sourceTable, 'processing');
                }} 
                className="flex items-center justify-center gap-2 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded-xl transition-colors font-bold tracking-widest text-[10px] uppercase col-span-2 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                <RefreshCw className="w-4 h-4" /> Retry AI Analysis
              </button>
            ) : null}
            <button 
              onClick={() => handleDrawerAction(item.id, item.sourceTable, 'rejected')} 
              className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors font-bold tracking-widest text-[10px] uppercase shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={() => handleDrawerAction(item.id, item.sourceTable, 'approved')} 
              className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl transition-colors font-bold tracking-widest text-[10px] uppercase shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#000000] text-gray-100 font-sans overflow-hidden selection:bg-indigo-500/30 relative">
      
      {/* Sidebar (Desktop Only) */}
      <aside 
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
        className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#222] flex-col z-50 fixed left-4 top-4 bottom-4 rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden`}
      >
        <div className="p-6 border-b border-[#222] flex flex-col items-center">
           <Link 
             href="/" 
             className={`inline-flex items-center gap-2 mb-4 group ${isSidebarCollapsed ? 'justify-center w-full' : 'self-start'}`}
             title={isSidebarCollapsed ? 'Back to Home' : undefined}
           >
             <ChevronRight className="rotate-180 w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
             {!isSidebarCollapsed && <span className="text-xs font-bold text-gray-500 group-hover:text-white tracking-widest uppercase transition-colors whitespace-nowrap">Home</span>}
           </Link>
           
           <h2 className={`text-xl font-black tracking-tight text-white flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center w-full' : 'self-start'}`}>
             <Network className="text-blue-400 w-6 h-6 shrink-0" />
             {!isSidebarCollapsed && "COMMAND"}
           </h2>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] overflow-x-hidden">
          {!isSidebarCollapsed && <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-4 ml-2 mt-2 whitespace-nowrap">Main Menu</p>}
          <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <SidebarItem id="map" label="Live Map" icon={MapPin} />
          <SidebarItem id="workers" label="Workers" icon={Users} />
          <SidebarItem id="reports" label="Reports" icon={BarChart3} />
          <SidebarItem id="master-data" label="Master Data" icon={Database} />
        </div>
        <div className="p-4 border-t border-[#222]">
          <div className={`flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl cursor-pointer hover:border-[#333] transition-colors ${isSidebarCollapsed ? 'p-2 justify-center' : 'p-3'}`}>
             <div className="w-8 h-8 shrink-0 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center font-bold text-sm">
               SA
             </div>
             {!isSidebarCollapsed && (
               <div className="overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">Site Admin</p>
                 <p className="text-[10px] text-gray-500 truncate">admin@10xworkforce.ai</p>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#222] z-40 flex items-center justify-between px-4">
        <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
          <ChevronRight className="rotate-180 w-5 h-5" />
        </Link>
        <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          <Network className="text-blue-400 w-5 h-5" />
          COMMAND
        </h2>
        <div className="w-9"></div> {/* Spacer */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#000000] ml-0 md:ml-[104px]">
         {/* Background Mesh fixed behind scrollable content */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 fixed">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
         </div>
         
         <div className="p-6 md:p-10 pt-20 pb-24 md:pt-10 max-w-7xl mx-auto min-h-full transition-all duration-300">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'map' && renderMap()}
            {activeTab === 'workers' && renderWorkers()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'master-data' && renderMasterData()}
         </div>
         {renderSlideOutDrawer()}

         {/* Add Worker Modal */}
         {isAddWorkerModalOpen && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddWorkerModalOpen(false)} />
             <div className="relative bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white">{editingWorkerId ? 'Edit' : 'Add New'} Worker</h2>
                 <button onClick={() => setIsAddWorkerModalOpen(false)} className="text-gray-500 hover:text-white">
                   <XCircle className="w-6 h-6" />
                 </button>
               </div>
               <form onSubmit={handleAddWorker} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Employee Name</label>
                   <input required type="text" value={newWorkerForm.name} onChange={e => setNewWorkerForm({...newWorkerForm, name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Alex Mercer" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Employee ID</label>
                   <input required type="text" value={newWorkerForm.employee_id} onChange={e => setNewWorkerForm({...newWorkerForm, employee_id: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. EMP-1042" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Trade / Skill</label>
                   <input required type="text" value={newWorkerForm.trade} onChange={e => setNewWorkerForm({...newWorkerForm, trade: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Master Welder" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Labor Type</label>
                    <select required value={newWorkerForm.labor_type} onChange={e => setNewWorkerForm({...newWorkerForm, labor_type: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                      <option value="Direct">Direct</option>
                      <option value="Subcontractor">Subcontractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Default Assigned Project</label>
                    <select required value={newWorkerForm.assigned_project} onChange={e => setNewWorkerForm({...newWorkerForm, assigned_project: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                      <option value="Unassigned">Unassigned</option>
                      {projectListDropdown.map((p: any) => (
                        <option key={p.project_code} value={p.project_code}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                 <button disabled={isAddingWorker} type="submit" className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors mt-6 flex items-center justify-center gap-2">
                   {isAddingWorker ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {isAddingWorker ? 'Saving...' : 'Save Worker to Database'}
                 </button>
               </form>
             </div>
           </div>
         )}

         {/* Master Data Modal */}
         {isMasterDataModalOpen && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMasterDataModalOpen(false)} />
             <div className="relative bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white capitalize">{editingMasterId ? 'Edit' : 'Add New'} {masterDataTab.slice(0, -1)}</h2>
                 <button onClick={() => setIsMasterDataModalOpen(false)} className="text-gray-500 hover:text-white">
                   <XCircle className="w-6 h-6" />
                 </button>
               </div>
               <form onSubmit={handleSaveMasterData} className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] pr-2">
                 
                 {masterDataTab === 'projects' && (
                   <>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Project Code</label><input required type="text" value={masterDataForm.project_code || ''} onChange={e => setMasterDataForm({...masterDataForm, project_code: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Project Name</label><input required type="text" value={masterDataForm.project_name || ''} onChange={e => setMasterDataForm({...masterDataForm, project_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Client Name</label><input type="text" value={masterDataForm.client_name || ''} onChange={e => setMasterDataForm({...masterDataForm, client_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Budget</label><input type="number" step="0.01" value={masterDataForm.total_budget || ''} onChange={e => setMasterDataForm({...masterDataForm, total_budget: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div>
                       <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Priority Level</label>
                       <select required value={masterDataForm.priority_level || ''} onChange={e => setMasterDataForm({...masterDataForm, priority_level: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                         <option value="">Select Priority</option>
                         <option value="High">High</option>
                         <option value="Medium">Medium</option>
                         <option value="Low">Low</option>
                       </select>
                     </div>
                   </>
                 )}
                 
                 {masterDataTab === 'materials' && (
                   <>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Material Code</label><input required type="text" value={masterDataForm.material_code || ''} onChange={e => setMasterDataForm({...masterDataForm, material_code: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Material Name</label><input required type="text" value={masterDataForm.material_name || ''} onChange={e => setMasterDataForm({...masterDataForm, material_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div>
                       <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Category</label>
                       <select required value={masterDataForm.category || ''} onChange={e => setMasterDataForm({...masterDataForm, category: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                         <option value="">Select Category</option>
                         <option value="Raw Material">Raw Material</option>
                         <option value="Electrical">Electrical</option>
                         <option value="Plumbing">Plumbing</option>
                         <option value="PPE">PPE</option>
                         <option value="Finishing">Finishing</option>
                         <option value="Tools & Equipment">Tools & Equipment</option>
                       </select>
                     </div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Approved Vendor</label><input type="text" value={masterDataForm.approved_vendor || ''} onChange={e => setMasterDataForm({...masterDataForm, approved_vendor: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Standard Price</label><input required type="number" step="0.01" value={masterDataForm.standard_price || ''} onChange={e => setMasterDataForm({...masterDataForm, standard_price: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                   </>
                 )}

                 {masterDataTab === 'sites' && (
                   <>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Site Code</label><input required type="text" value={masterDataForm.site_code || ''} onChange={e => setMasterDataForm({...masterDataForm, site_code: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Site Name</label><input required type="text" value={masterDataForm.site_name || ''} onChange={e => setMasterDataForm({...masterDataForm, site_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Location</label><input type="text" value={masterDataForm.location || ''} onChange={e => setMasterDataForm({...masterDataForm, location: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Total Budget</label><input type="number" step="0.01" value={masterDataForm.total_budget || ''} onChange={e => setMasterDataForm({...masterDataForm, total_budget: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Required Manpower</label><input type="number" value={masterDataForm.required_manpower || ''} onChange={e => setMasterDataForm({...masterDataForm, required_manpower: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div>
                       <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Status</label>
                       <select required value={masterDataForm.status || ''} onChange={e => setMasterDataForm({...masterDataForm, status: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                         <option value="">Select Status</option>
                         <option value="Active">Active</option>
                         <option value="Completed">Completed</option>
                         <option value="On Hold">On Hold</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Parent Project</label>
                       <select required value={masterDataForm.parent_project_code || ''} onChange={e => setMasterDataForm({...masterDataForm, parent_project_code: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500">
                         <option value="">Select Parent Project</option>
                         {projectListDropdown.map((p:any) => (
                           <option key={p.project_code} value={p.project_code}>{p.project_name}</option>
                         ))}
                       </select>
                     </div>
                   </>
                 )}

                 {masterDataTab === 'camps' && (
                   <>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Camp Code</label><input required type="text" value={masterDataForm.camp_code || ''} onChange={e => setMasterDataForm({...masterDataForm, camp_code: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Camp Name</label><input required type="text" value={masterDataForm.camp_name || ''} onChange={e => setMasterDataForm({...masterDataForm, camp_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Location</label><input required type="text" value={masterDataForm.location || ''} onChange={e => setMasterDataForm({...masterDataForm, location: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Total Bed Capacity</label><input required type="number" value={masterDataForm.total_bed_capacity || ''} onChange={e => setMasterDataForm({...masterDataForm, total_bed_capacity: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Current Occupied Beds</label><input required type="number" value={masterDataForm.current_occupied_beds || ''} onChange={e => setMasterDataForm({...masterDataForm, current_occupied_beds: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                     <div><label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Camp Manager Name</label><input type="text" value={masterDataForm.camp_manager_name || ''} onChange={e => setMasterDataForm({...masterDataForm, camp_manager_name: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" /></div>
                   </>
                 )}

                 <button disabled={isAddingMasterData} type="submit" className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors mt-6 flex items-center justify-center gap-2">
                   {isAddingMasterData ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {isAddingMasterData ? 'Saving...' : 'Save Record'}
                 </button>
               </form>
             </div>
           </div>
         )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-[#222] z-50 flex justify-around p-3 pb-safe">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Dashboard</span>
        </button>
        <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Map</span>
        </button>
        <button onClick={() => setActiveTab('workers')} className={`flex flex-col items-center gap-1 ${activeTab === 'workers' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Workers</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Reports</span>
        </button>
      </nav>
    </div>
  );
}
