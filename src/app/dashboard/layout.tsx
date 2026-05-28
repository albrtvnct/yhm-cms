import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import SidebarNav from "./SidebarNav"; 
import TopbarActions from "./TopbarActions"; 

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch real data
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { church: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#f4f4f5] overflow-hidden font-sans text-zinc-900 selection:bg-purple-200">
      
      {/* Sleek Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex-col hidden md:flex shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 shrink-0">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900">
            ✝ Yesh<span className="text-amber-500">CMS</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">Menu Utama</div>
          <SidebarNav />
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-zinc-100 shrink-0 bg-zinc-50/50 m-2 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold truncate text-zinc-900">{user.name}</div>
              <div className="text-xs text-zinc-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Sleek Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full">
              <span className="text-zinc-500 font-medium hidden sm:inline">Gereja:</span>
              <span>{user.church.name}</span>
            </h2>
          </div>
          <TopbarActions />
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
