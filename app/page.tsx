import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-24 text-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          10xWorkforce.AI
        </h1>
        <h2 className="text-2xl font-semibold text-gray-300">
          Autonomous Agent Server
        </h2>
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl max-w-lg mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-emerald-400 font-medium">Server is active</p>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This Next.js application is currently configured as the backend AI orchestrator. 
            It connects to Supabase and manages automated agent tasks. 
            The data entry interface is handled by the mobile Android application.
          </p>
          
          <Link href="/dashboard" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all w-full">
            Open Manager Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
