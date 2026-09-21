import { useState, useEffect, useMemo } from "react";
import { getKleapDb } from "@/lib/kleap-db";
import { useKleapUser } from "@/components/auth/KleapAuth";
import {
  LayoutDashboard, Users, Building2, Armchair, Grid3x3, Search,
  History, BarChart3, Settings, LogOut, Plus, Edit2, Trash2,
  Printer, Download, X, GraduationCap, MapPin, ChevronRight,
  Sparkles, RotateCcw, Check, AlertCircle, Loader2
} from "lucide-react";

/* ---------- Types */
type Student = { id?: number; roll_no: string; name: string; department: string; year: string; section: string; gender: string; created_at?: string };
type Classroom = { id?: number; classroom_id: string; name: string; building: string; floor: string; rows: number; columns: number; capacity: number; created_at?: string };
type Allocation = { id?: number; classroom_id: string; department?: string; year?: string; section?: string; seat_number: string; row_label: string; col_num: number; roll_no: string; student_name: string };
type HistoryItem = { id?: number; classroom_id?: string; classroom_name: string; department?: string; year?: string; section?: string; student_count: number; seat_count: number; allocated_at: string };
type View = "dashboard" | "students" | "classrooms" | "allocation" | "chart" | "search" | "history" | "reports" | "settings";

const ROW_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SECTIONS = ["A", "B", "C", "D"];
const GENDERS = ["Male", "Female", "Other"];

export default function SeatApp() {
  const { user, isPending } = useKleapUser();
  const [timedOut, setTimedOut] = useState(false);
  const [adminSession, setAdminSession] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try { setAdminSession(localStorage.getItem("seat_admin_session")); } catch {}
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, [isPending]);

  function handleLogin() {
    try { setAdminSession(localStorage.getItem("seat_admin_session")); } catch {}
  }

  function handleLogout() {
    try { localStorage.removeItem("seat_admin_session"); } catch {}
    setAdminSession(null);
  }

  if (adminSession) {
    return <MainApp userEmail={adminSession} onLogout={handleLogout} />;
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainApp userEmail={user.email || "admin"} />;
}

/* ====================== LOGIN SCREEN ====================== */
function LoginScreen({ onLogin }: { onLogin?: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (username.trim() === "admin" && password === "admin123") {
      try { localStorage.setItem("seat_admin_session", "admin"); } catch {}
      setInfo("Welcome back. Loading dashboard...");
      setTimeout(() => { try { onLogin?.(); } catch {} window.location.reload(); }, 350);
      return;
    }
    setLoading(true);
    const db = getKleapDb();
    if (!db) {
      setError("System unavailable. Please try again.");
      setLoading(false);
      return;
    }
    const email = `${username}@seat.local`;
    try {
      const res = await db.auth.signIn.email({ email, password });
      if (res?.error) throw res.error;
      setInfo("Signed in. Loading dashboard...");
      setTimeout(() => window.location.reload(), 400);
    } catch (err: any) {
      // Account doesn't exist — auto-create it
      try {
        const su = await db.auth.signUp.email({ email, password, name: username });
        if (su?.error) throw su.error;
        setInfo("Account created — you're signed in as the first admin.");
        setTimeout(() => window.location.reload(), 600);
      } catch (e2: any) {
        setError(e2?.message || "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary text-primary-foreground items-center justify-center mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Seat Allocation</h1>
          <p className="text-muted-foreground mt-2">College classroom management system</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-1">Administrator Login</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in with the demo credentials below</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-muted-foreground text-xs">
            <p className="font-medium text-foreground mb-1">Demo credentials</p>
            <p>Username: <span className="font-mono">admin</span> · Password: <span className="font-mono">admin123</span></p>
            <p className="mt-2 italic">First sign-in creates your admin profile automatically.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====================== MAIN APP ====================== */
function MainApp({ userEmail, onLogout }: { userEmail: string; onLogout?: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const db = getKleapDb();
    if (!db) return;
    setLoading(true);
    const [s, c, a, h] = await Promise.all([
      db.from("students").select("*").order("roll_no"),
      db.from("classrooms").select("*").order("classroom_id"),
      db.from("allocations").select("*"),
      db.from("allocation_history").select("*").order("allocated_at", { ascending: false })
    ]);
    const sData = (s.data || []) as Student[];
    const cData = (c.data || []) as Classroom[];
    setStudents(sData);
    setClassrooms(cData);
    setAllocations((a.data || []) as Allocation[]);
    setHistory((h.data || []) as HistoryItem[]);
    setLoading(false);
    if (!seeded && sData.length === 0 && cData.length === 0) {
      await seedSample();
      setSeeded(true);
    }
  }

  async function seedSample() {
    const db = getKleapDb();
    if (!db) return;
    await db.from("students").insert([
      { roll_no: "23CSE001", name: "Rahul Kumar", department: "CSE", year: "2nd Year", section: "A", gender: "Male" },
      { roll_no: "23CSE002", name: "Priya Sharma", department: "CSE", year: "2nd Year", section: "A", gender: "Female" },
      { roll_no: "23ECE003", name: "Arun Kumar", department: "ECE", year: "2nd Year", section: "A", gender: "Male" },
      { roll_no: "23CSE004", name: "Meena Devi", department: "CSE", year: "2nd Year", section: "A", gender: "Female" },
      { roll_no: "23ECE005", name: "Kiran Raj", department: "ECE", year: "2nd Year", section: "A", gender: "Male" },
    ]);
    await db.from("classrooms").insert([
      { classroom_id: "CSE-101", name: "CSE Lecture Hall", building: "Block A", floor: "1st Floor", rows: 5, columns: 6, capacity: 30 },
      { classroom_id: "CSE-102", name: "CSE Lab 2", building: "Block A", floor: "1st Floor", rows: 4, columns: 5, capacity: 20 },
      { classroom_id: "ECE-201", name: "ECE Seminar Hall", building: "Block B", floor: "2nd Floor", rows: 5, columns: 5, capacity: 25 },
    ]);
    await loadAll();
  }

  async function signOut() {
    const db = getKleapDb();
    if (db) await db.auth.signOut();
    window.location.reload();
  }

  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalClassrooms: classrooms.length,
    totalSeats: classrooms.reduce((s, c) => s + c.capacity, 0),
    allocatedSeats: allocations.length,
    availableSeats: classrooms.reduce((s, c) => s + c.capacity, 0) - allocations.length,
    unallocatedStudents: students.length - allocations.length,
  }), [students, classrooms, allocations]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems: { id: View; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "classrooms", label: "Classrooms", icon: Building2 },
    { id: "allocation", label: "Seat Allocation", icon: Armchair },
    { id: "chart", label: "Seating Chart", icon: Grid3x3 },
    { id: "search", label: "Search Student", icon: Search },
    { id: "history", label: "History", icon: History },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar navItems={navItems} view={view} setView={setView} onSignOut={signOut} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TopBar onMenu={() => setSidebarOpen(true)} userEmail={userEmail} view={view} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {view === "dashboard" && <DashboardView stats={stats} classrooms={classrooms} allocations={allocations} />}
          {view === "students" && <StudentsView students={students} reload={loadAll} />}
          {view === "classrooms" && <ClassroomsView classrooms={classrooms} reload={loadAll} />}
          {view === "allocation" && <AllocationView classrooms={classrooms} students={students} allocations={allocations} reload={loadAll} />}
          {view === "chart" && <ChartView classrooms={classrooms} allocations={allocations} />}
          {view === "search" && <SearchView students={students} allocations={allocations} classrooms={classrooms} />}
          {view === "history" && <HistoryView history={history} classrooms={classrooms} allocations={allocations} />}
          {view === "reports" && <ReportsView stats={stats} classrooms={classrooms} students={students} allocations={allocations} />}
          {view === "settings" && <SettingsView reload={loadAll} />}
        </main>
      </div>
    </div>
  );
}

/* ====================== SIDEBAR ====================== */
function Sidebar({ navItems, view, setView, onSignOut, open, onClose }: any) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base">Seat Allocation</h2>
              <p className="text-xs text-sidebar-foreground/70">College Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map((item: any) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-1 ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent transition">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ====================== TOP BAR ====================== */
function TopBar({ onMenu, userEmail, view }: any) {
  const titles: Record<string, string> = {
    dashboard: "Dashboard Overview",
    students: "Student Management",
    classrooms: "Classroom Management",
    allocation: "Seat Allocation",
    chart: "Visual Seating Chart",
    search: "Student Search",
    history: "Allocation History",
    reports: "Reports & Analytics",
    settings: "Settings",
  };
  return (
    <header className="bg-card sticky top-0 z-30 border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="lg:hidden p-2 -ml-2 hover:bg-secondary rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{titles[view] || "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-foreground font-medium pr-1">{userEmail.split("@")[0]}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ====================== DASHBOARD ====================== */
function DashboardView({ stats, classrooms, allocations }: any) {
  const cards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "bg-blue-500" },
    { label: "Total Classrooms", value: stats.totalClassrooms, icon: Building2, color: "bg-indigo-500" },
    { label: "Total Seats", value: stats.totalSeats, icon: Grid3x3, color: "bg-violet-500" },
    { label: "Allocated Seats", value: stats.allocatedSeats, icon: Armchair, color: "bg-emerald-500" },
    { label: "Available Seats", value: stats.availableSeats, icon: Sparkles, color: "bg-amber-500" },
    { label: "Unallocated Students", value: stats.unallocatedStudents, icon: AlertCircle, color: "bg-rose-500" },
  ];

  const utilization = stats.totalSeats > 0 ? Math.round((stats.allocatedSeats / stats.totalSeats) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4 md:p-5">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${c.color} text-white flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl md:text-3xl font-bold mt-1">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-semibold mb-4">Classroom Utilization</h3>
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold">{utilization}%</span>
              <span className="text-sm text-muted-foreground">{stats.allocatedSeats} / {stats.totalSeats} seats</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${utilization}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {classrooms.map((c: Classroom) => {
              const used = allocations.filter((a: Allocation) => a.classroom_id === c.classroom_id).length;
              const pct = c.capacity > 0 ? Math.round((used / c.capacity) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{c.classroom_id} — {c.name}</p>
                    <p className="text-xs text-muted-foreground">{used} / {c.capacity} seats</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{pct}%</span>
                </div>
              );
            })}
            {classrooms.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No classrooms yet — add one to begin.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="#students" className="p-4 bg-secondary hover:bg-accent rounded-lg transition group">
              <Users className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-sm">Add Students</p>
              <p className="text-xs text-muted-foreground">Manage student list</p>
            </a>
            <a href="#classrooms" className="p-4 bg-secondary hover:bg-accent rounded-lg transition group">
              <Building2 className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-sm">Add Classroom</p>
              <p className="text-xs text-muted-foreground">Set up new room</p>
            </a>
            <a href="#allocation" className="p-4 bg-secondary hover:bg-accent rounded-lg transition group">
              <Sparkles className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-sm">Auto-Allocate</p>
              <p className="text-xs text-muted-foreground">Smart allocation</p>
            </a>
            <a href="#chart" className="p-4 bg-secondary hover:bg-accent rounded-lg transition group">
              <Grid3x3 className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-sm">View Chart</p>
              <p className="text-xs text-muted-foreground">Visual seating</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================== STUDENTS ====================== */
function StudentsView({ students, reload }: any) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; student?: Student }>(null);

  const filtered = students.filter((s: Student) =>
    (!search || s.roll_no.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterDept || s.department === filterDept) &&
    (!filterYear || s.year === filterYear) &&
    (!filterSection || s.section === filterSection)
  );

  async function handleDelete(id: number) {
    if (!confirm("Delete this student? This will also remove any allocation.")) return;
    const db = getKleapDb();
    if (!db) return;
    await db.from("students").delete().eq("id", id);
    await db.from("allocations").delete().eq("roll_no", students.find((s: Student) => s.id === id)?.roll_no || "");
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>
        <button onClick={() => setModal({ mode: "add" })} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 self-start">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by roll or name..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary border border-input text-sm">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary border border-input text-sm">
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary border border-input text-sm">
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Roll No</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Year</th>
                <th className="px-4 py-3 text-left font-semibold">Section</th>
                <th className="px-4 py-3 text-left font-semibold">Gender</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: Student) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono">{s.roll_no}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs font-medium">{s.department}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.year}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.section}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.gender}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal({ mode: "edit", student: s })} className="p-1.5 hover:bg-secondary rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(s.id!)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <StudentModal modal={modal} onClose={() => setModal(null)} reload={reload} existing={students} />}
    </div>
  );
}

function StudentModal({ modal, onClose, reload, existing }: any) {
  const isEdit = modal.mode === "edit";
  const init = isEdit ? modal.student : { roll_no: "", name: "", department: "CSE", year: "2nd Year", section: "A", gender: "Male" };
  const [form, setForm] = useState<Student>(init);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.roll_no.trim() || !form.name.trim()) {
      setError("Roll number and name are required.");
      return;
    }
    const dup = existing.find((s: Student) => s.roll_no === form.roll_no && s.id !== form.id);
    if (dup) { setError("Roll number must be unique."); return; }
    setSaving(true);
    const db = getKleapDb();
    if (!db) { setSaving(false); return; }
    if (isEdit) {
      const { id, created_at, ...rest } = form;
      await db.from("students").update(rest).eq("id", id);
    } else {
      const { id, created_at, ...rest } = form;
      await db.from("students").insert(rest);
    }
    setSaving(false);
    onClose();
    reload();
  }

  return (
    <Modal title={isEdit ? "Edit Student" : "Add Student"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Roll Number *" value={form.roll_no} onChange={v => setForm({ ...form, roll_no: v })} />
          <Field label="Full Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Select label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPARTMENTS} />
          <Select label="Year" value={form.year} onChange={v => setForm({ ...form, year: v })} options={YEARS} />
          <Select label="Section" value={form.section} onChange={v => setForm({ ...form, section: v })} options={SECTIONS} />
          <Select label="Gender" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={GENDERS} />
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ====================== CLASSROOMS ====================== */
function ClassroomsView({ classrooms, reload }: any) {
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; classroom?: Classroom }>(null);

  async function handleDelete(id: number, cid: string) {
    if (!confirm("Delete this classroom and its allocations?")) return;
    const db = getKleapDb();
    if (!db) return;
    await db.from("classrooms").delete().eq("id", id);
    await db.from("allocations").delete().eq("classroom_id", cid);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{classrooms.length} classrooms configured</p>
        <button onClick={() => setModal({ mode: "add" })} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Classroom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((c: Classroom) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{c.classroom_id}</h3>
                <p className="text-sm text-muted-foreground">{c.name}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ mode: "edit", classroom: c })} className="p-1.5 hover:bg-secondary rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c.id!, c.classroom_id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />{c.building} · {c.floor}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Grid3x3 className="w-3.5 h-3.5" />{c.rows} rows × {c.columns} columns
              </div>
              <div className="flex items-center gap-2 font-semibold text-primary pt-1">
                <Armchair className="w-3.5 h-3.5" />{c.capacity} seats
              </div>
            </div>
          </div>
        ))}
        {classrooms.length === 0 && (
          <div className="col-span-full bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            No classrooms yet. Click "Add Classroom" to start.
          </div>
        )}
      </div>

      {modal && <ClassroomModal modal={modal} onClose={() => setModal(null)} reload={reload} existing={classrooms} />}
    </div>
  );
}

function ClassroomModal({ modal, onClose, reload, existing }: any) {
  const isEdit = modal.mode === "edit";
  const init: Classroom = isEdit ? modal.classroom : { classroom_id: "", name: "", building: "", floor: "1st Floor", rows: 4, columns: 5, capacity: 20 };
  const [form, setForm] = useState<Classroom>(init);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-update capacity
  useEffect(() => {
    setForm(f => ({ ...f, capacity: f.rows * f.columns }));
  }, [form.rows, form.columns]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.classroom_id.trim() || !form.name.trim()) { setError("Classroom ID and name are required."); return; }
    if (form.rows < 1 || form.columns < 1) { setError("Rows and columns must be at least 1."); return; }
    if (form.capacity < 1) { setError("Capacity must be greater than zero."); return; }
    const dup = existing.find((c: Classroom) => c.classroom_id === form.classroom_id && c.id !== form.id);
    if (dup) { setError("Classroom ID must be unique."); return; }
    setSaving(true);
    const db = getKleapDb();
    if (!db) { setSaving(false); return; }
    if (isEdit) {
      const { id, created_at, ...rest } = form;
      await db.from("classrooms").update(rest).eq("id", id);
    } else {
      const { id, created_at, ...rest } = form;
      await db.from("classrooms").insert(rest);
    }
    setSaving(false);
    onClose();
    reload();
  }

  return (
    <Modal title={isEdit ? "Edit Classroom" : "Add Classroom"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Classroom ID *" value={form.classroom_id} onChange={v => setForm({ ...form, classroom_id: v })} />
          <Field label="Classroom Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Field label="Building" value={form.building} onChange={v => setForm({ ...form, building: v })} />
          <Field label="Floor" value={form.floor} onChange={v => setForm({ ...form, floor: v })} />
          <Field label="Rows *" type="number" value={String(form.rows)} onChange={v => setForm({ ...form, rows: Math.max(1, parseInt(v) || 1) })} />
          <Field label="Columns *" type="number" value={String(form.columns)} onChange={v => setForm({ ...form, columns: Math.max(1, parseInt(v) || 1) })} />
        </div>
        <div className="bg-accent/50 border border-accent rounded-lg text-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-accent-foreground font-medium">Total Capacity (auto)</span>
            <span className="font-bold text-primary">{form.capacity} seats</span>
          </div>
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Classroom"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ====================== ALLOCATION ====================== */
function AllocationView({ classrooms, students, allocations, reload }: any) {
  const [classroomId, setClassroomId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [mode, setMode] = useState<"sequential" | "random">("sequential");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const classroom = classrooms.find((c: Classroom) => c.classroom_id === classroomId);
  const eligible = students.filter((s: Student) =>
    (!department || s.department === department) &&
    (!year || s.year === year) &&
    (!section || s.section === section)
  );
  const alreadyAllocated = new Set(allocations.map((a: Allocation) => a.roll_no));
  const unallocatedEligible = eligible.filter((s: Student) => !alreadyAllocated.has(s.roll_no));
  const classroomAllocs = classroom ? allocations.filter((a: Allocation) => a.classroom_id === classroomId) : [];

  async function allocate() {
    setMessage(null);
    if (!classroom) { setMessage({ type: "err", text: "Select a classroom." }); return; }
    if (eligible.length === 0) { setMessage({ type: "err", text: "No students match the selected filters." }); return; }
    const seats: { row: string; col: number; seat: string }[] = [];
    for (let r = 0; r < classroom.rows; r++) {
      for (let c = 1; c <= classroom.columns; c++) {
        seats.push({ row: ROW_LABELS[r], col: c, seat: `${ROW_LABELS[r]}${c}` });
      }
    }
    const occupied = new Set(classroomAllocs.map((a: Allocation) => a.seat_number));
    const availableSeats = seats.filter(s => !occupied.has(s.seat));
    if (unallocatedEligible.length === 0) { setMessage({ type: "err", text: "All eligible students are already allocated." }); return; }
    if (availableSeats.length === 0) { setMessage({ type: "err", text: "No seats available in this classroom." }); return; }
    const studentsToSeat = mode === "random"
      ? [...unallocatedEligible].sort(() => Math.random() - 0.5)
      : [...unallocatedEligible];
    const count = Math.min(studentsToSeat.length, availableSeats.length);
    const db = getKleapDb();
    if (!db) return;
    const newAllocs = [];
    for (let i = 0; i < count; i++) {
      const seat = availableSeats[i];
      const student = studentsToSeat[i];
      newAllocs.push({
        classroom_id: classroomId, department: department || null, year: year || null, section: section || null,
        seat_number: seat.seat, row_label: seat.row, col_num: seat.col,
        roll_no: student.roll_no, student_name: student.name,
      });
    }
    await db.from("allocations").insert(newAllocs);
    await db.from("allocation_history").insert({
      classroom_id: classroomId, classroom_name: classroom.name,
      department: department || "All", year: year || "All", section: section || "All",
      student_count: count, seat_count: availableSeats.length,
    });
    setMessage({
      type: "ok",
      text: `Allocated ${count} students. ${studentsToSeat.length - count > 0 ? `${studentsToSeat.length - count} students remain unallocated (insufficient seats).` : "All eligible students seated."}`
    });
    reload();
  }

  async function resetAllocation() {
    if (!classroom) { setMessage({ type: "err", text: "Select a classroom first." }); return; }
    if (!confirm(`Clear all allocations for ${classroomId}?`)) return;
    const db = getKleapDb();
    if (!db) return;
    await db.from("allocations").delete().eq("classroom_id", classroomId);
    setMessage({ type: "ok", text: "Allocation cleared for this classroom." });
    reload();
  }

  async function resetAll() {
    if (!confirm("Clear ALL allocations across all classrooms?")) return;
    const db = getKleapDb();
    if (!db) return;
    await db.from("allocations").delete().neq("id", 0);
    setMessage({ type: "ok", text: "All allocations cleared." });
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <h3 className="font-semibold mb-4">Allocate Seats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select label="Classroom" value={classroomId} onChange={setClassroomId} options={["", ...classrooms.map((c: Classroom) => c.classroom_id)]} placeholder="Select classroom" />
          <Select label="Department" value={department} onChange={setDepartment} options={["", ...DEPARTMENTS]} placeholder="All departments" />
          <Select label="Year" value={year} onChange={setYear} options={["", ...YEARS]} placeholder="All years" />
          <Select label="Section" value={section} onChange={setSection} options={["", ...SECTIONS]} placeholder="All sections" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Mode:</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={mode === "sequential"} onChange={() => setMode("sequential")} /> Sequential
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={mode === "random"} onChange={() => setMode("random")} /> Random
            </label>
          </div>
        </div>

        {classroom && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            <Stat label="Classroom capacity" value={classroom.capacity} />
            <Stat label="Seats used" value={classroomAllocs.length} />
            <Stat label="Eligible students" value={eligible.length} />
            <Stat label="Unallocated (eligible)" value={unallocatedEligible.length} />
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
            {message.type === "ok" ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={allocate} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Sparkles className="w-4 h-4" /> Allocate Seats
          </button>
          <button onClick={resetAllocation} disabled={!classroom} className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50">
            <RotateCcw className="w-4 h-4" /> Reset Classroom
          </button>
          <button onClick={resetAll} className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20">
            <RotateCcw className="w-4 h-4" /> Reset All Allocations
          </button>
        </div>
      </div>

      {classroom && classroomAllocs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-semibold mb-4">Current Allocations in {classroomId}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Seat</th>
                  <th className="px-4 py-2 text-left font-semibold">Roll No</th>
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Dept</th>
                  <th className="px-4 py-2 text-left font-semibold">Year</th>
                  <th className="px-4 py-2 text-left font-semibold">Section</th>
                </tr>
              </thead>
              <tbody>
                {classroomAllocs.sort((a: Allocation, b: Allocation) => a.seat_number.localeCompare(b.seat_number)).map((a: Allocation) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono font-semibold text-primary">{a.seat_number}</td>
                    <td className="px-4 py-2 font-mono">{a.roll_no}</td>
                    <td className="px-4 py-2 font-medium">{a.student_name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{a.department || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{a.year || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{a.section || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================== CHART ====================== */
function ChartView({ classrooms, allocations }: any) {
  const [classroomId, setClassroomId] = useState(classrooms[0]?.classroom_id || "");
  useEffect(() => { if (!classroomId && classrooms.length) setClassroomId(classrooms[0].classroom_id); }, [classrooms]);
  const classroom = classrooms.find((c: Classroom) => c.classroom_id === classroomId);
  const allocs = classroom ? allocations.filter((a: Allocation) => a.classroom_id === classroomId) : [];
  const seatMap = new Map(allocs.map((a: Allocation) => [a.seat_number, a]));

  if (classrooms.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
        Add a classroom first to view the seating chart.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <Select label="Classroom" value={classroomId} onChange={setClassroomId} options={classrooms.map((c: Classroom) => c.classroom_id)} />
      </div>

      {classroom && (
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold">{classroom.name}</h3>
              <p className="text-xs text-muted-foreground">{classroom.building} · {classroom.floor}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" />Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary border border-border" />Available</span>
            </div>
          </div>

          <div className="text-center mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">— Front —</div>

          <div className="space-y-2 max-w-4xl mx-auto">
            {Array.from({ length: classroom.rows }).map((_, r) => (
              <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${classroom.columns}, minmax(0, 1fr))` }}>
                {Array.from({ length: classroom.columns }).map((__, c) => {
                  const seatId = `${ROW_LABELS[r]}${c + 1}`;
                  const occupant = seatMap.get(seatId);
                  return (
                    <div key={seatId} className={`p-2 md:p-3 rounded-lg border text-center min-h-[70px] flex flex-col justify-center ${occupant ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"}`}>
                      <div className="font-mono text-xs font-semibold">{seatId}</div>
                      {occupant ? (
                        <>
                          <div className="text-[10px] md:text-xs font-medium truncate">{occupant.student_name}</div>
                          <div className="text-[9px] md:text-[10px] font-mono opacity-80 truncate">{occupant.roll_no}</div>
                        </>
                      ) : (
                        <div className="text-[10px] text-muted-foreground italic">empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-center mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">— Back —</div>
        </div>
      )}
    </div>
  );
}

/* ====================== SEARCH ====================== */
function SearchView({ students, allocations, classrooms }: any) {
  const [query, setQuery] = useState("");
  const lower = query.trim().toLowerCase();
  const results: Array<Student & { classroom_id?: string; seat_number?: string }> = [];

  if (lower) {
    students.forEach((s: Student) => {
      const alloc = allocations.find((a: Allocation) => a.roll_no === s.roll_no);
      if (
        s.roll_no.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower) ||
        (alloc && alloc.seat_number.toLowerCase().includes(lower))
      ) {
        results.push({ ...s, classroom_id: alloc?.classroom_id, seat_number: alloc?.seat_number });
      }
    });
    if (results.length === 0) {
      const alloc = allocations.find((a: Allocation) => a.seat_number.toLowerCase() === lower || a.roll_no.toLowerCase() === lower);
      if (alloc) {
        const stu = students.find((s: Student) => s.roll_no === alloc.roll_no);
        if (stu) results.push({ ...stu, classroom_id: alloc.classroom_id, seat_number: alloc.seat_number });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <h3 className="font-semibold mb-3">Search by Roll No, Name, or Seat Number</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query} onChange={e => setQuery(e.target.value)} autoFocus
            placeholder="Try: 23CSE001 or Rahul or B3..."
            className="w-full pl-10 pr-3 py-3 rounded-lg bg-secondary border border-input focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {query && (
        <div className="space-y-3">
          {results.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">No results for "{query}".</div>
          )}
          {results.map((r, i) => {
            const classroom = classrooms.find((c: Classroom) => c.classroom_id === r.classroom_id);
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{r.name}</h4>
                    <span className="text-xs text-muted-foreground font-mono">{r.roll_no}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs font-medium">{r.department}</span>
                    <span>{r.year}</span>
                    <span>·</span>
                    <span>Section {r.section}</span>
                  </div>
                </div>
                {r.classroom_id ? (
                  <div className="flex items-center gap-3 bg-primary/10 px-4 py-3 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{classroom?.name || r.classroom_id}</p>
                      <p className="font-bold text-primary text-lg leading-tight">Seat {r.seat_number}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not allocated</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ====================== HISTORY ====================== */
function HistoryView({ history, classrooms, allocations }: any) {
  const [view, setView] = useState<HistoryItem | null>(null);
  if (history.length === 0) {
    return <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">No allocation history yet.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Classroom</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Year</th>
                <th className="px-4 py-3 text-left font-semibold">Section</th>
                <th className="px-4 py-3 text-left font-semibold">Students</th>
                <th className="px-4 py-3 text-left font-semibold">Seats</th>
                <th className="px-4 py-3 text-right font-semibold">View</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3">{new Date(h.allocated_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{h.classroom_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.year}</td>
                  <td className="px-4 py-3 text-muted-foreground">{h.section}</td>
                  <td className="px-4 py-3">{h.student_count}</td>
                  <td className="px-4 py-3">{h.seat_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setView(h)} className="text-primary text-sm font-medium hover:underline flex items-center gap-1 ml-auto">
                      View chart <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {view && <HistoryViewer item={view} onClose={() => setView(null)} classrooms={classrooms} allocations={allocations} />}
    </div>
  );
}

function HistoryViewer({ item, onClose, classrooms, allocations }: any) {
  const classroom = classrooms.find((c: Classroom) => c.classroom_id === item.classroom_id);
  const allocs = allocations.filter((a: Allocation) => a.classroom_id === item.classroom_id);
  const seatMap = new Map(allocs.map((a: Allocation) => [a.seat_number, a]));

  return (
    <Modal title={`Seating — ${item.classroom_name}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="Department" value={item.department} />
          <Info label="Year" value={item.year} />
          <Info label="Section" value={item.section} />
          <Info label="Allocated" value={new Date(item.allocated_at).toLocaleString()} />
        </div>
        <div className="text-center text-xs font-semibold text-muted-foreground uppercase">— Front —</div>
        <div className="space-y-2">
          {Array.from({ length: classroom?.rows || 0 }).map((_, r) => (
            <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${classroom?.columns || 1}, minmax(0, 1fr))` }}>
              {Array.from({ length: classroom?.columns || 0 }).map((__, cn) => {
                const seatId = `${ROW_LABELS[r]}${cn + 1}`;
                const occupant = seatMap.get(seatId);
                return (
                  <div key={seatId} className={`p-2 rounded-lg border text-center min-h-[60px] flex flex-col justify-center text-xs ${occupant ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"}`}>
                    <div className="font-mono font-semibold">{seatId}</div>
                    {occupant && <div className="truncate">{occupant.student_name}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="text-center text-xs font-semibold text-muted-foreground uppercase">— Back —</div>
      </div>
    </Modal>
  );
}

/* ====================== REPORTS ====================== */
function ReportsView({ stats, classrooms, students, allocations }: any) {
  function exportCSV() {
    const rows = [["Seat", "Roll No", "Name", "Classroom", "Department", "Year", "Section"]];
    allocations.forEach((a: Allocation) => {
      rows.push([a.seat_number, a.roll_no, a.student_name, a.classroom_id, a.department || "", a.year || "", a.section || ""]);
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    download(csv, "seat-allocations.csv", "text/csv");
  }
  function exportStudentsCSV() {
    const rows = [["Roll No", "Name", "Department", "Year", "Section", "Gender"]];
    students.forEach((s: Student) => rows.push([s.roll_no, s.name, s.department, s.year, s.section, s.gender]));
    const csv = rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    download(csv, "students.csv", "text/csv");
  }

  const utilization = stats.totalSeats > 0 ? Math.round((stats.allocatedSeats / stats.totalSeats) * 100) : 0;

  return (
    <div className="space-y-4 print:bg-white">
      <div className="flex flex-wrap gap-2 print:hidden">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Printer className="w-4 h-4" /> Print Report
        </button>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent">
          <Download className="w-4 h-4" /> Download Allocations CSV
        </button>
        <button onClick={exportStudentsCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-accent">
          <Download className="w-4 h-4" /> Download Students CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6" id="printable-report">
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-2xl font-bold">Seat Allocation Report</h2>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Stat label="Total Students" value={stats.totalStudents} />
          <Stat label="Allocated" value={stats.allocatedSeats} />
          <Stat label="Unallocated" value={stats.unallocatedStudents} />
          <Stat label="Total Seats" value={stats.totalSeats} />
          <Stat label="Available" value={stats.availableSeats} />
          <Stat label="Utilization" value={`${utilization}%`} />
        </div>

        <h3 className="font-semibold mb-3">Classroom Utilization</h3>
        <table className="w-full text-sm mb-6">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 text-left">Classroom</th>
              <th className="px-4 py-2 text-left">Building</th>
              <th className="px-4 py-2 text-right">Capacity</th>
              <th className="px-4 py-2 text-right">Allocated</th>
              <th className="px-4 py-2 text-right">Available</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((c: Classroom) => {
              const used = allocations.filter((a: Allocation) => a.classroom_id === c.classroom_id).length;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{c.classroom_id} — {c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.building}</td>
                  <td className="px-4 py-2 text-right">{c.capacity}</td>
                  <td className="px-4 py-2 text-right">{used}</td>
                  <td className="px-4 py-2 text-right">{c.capacity - used}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 className="font-semibold mb-3">Allocations</h3>
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-2 text-left">Seat</th>
              <th className="px-4 py-2 text-left">Roll No</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Classroom</th>
              <th className="px-4 py-2 text-left">Dept</th>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Section</th>
            </tr>
          </thead>
          <tbody>
            {allocations.sort((a: Allocation, b: Allocation) => a.seat_number.localeCompare(b.seat_number)).map((a: Allocation) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono font-semibold">{a.seat_number}</td>
                <td className="px-4 py-2 font-mono">{a.roll_no}</td>
                <td className="px-4 py-2">{a.student_name}</td>
                <td className="px-4 py-2">{a.classroom_id}</td>
                <td className="px-4 py-2">{a.department}</td>
                <td className="px-4 py-2">{a.year}</td>
                <td className="px-4 py-2">{a.section}</td>
              </tr>
            ))}
            {allocations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No allocations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================== SETTINGS ====================== */
function SettingsView({ reload }: any) {
  const [busy, setBusy] = useState<string | null>(null);

  async function resetTable(table: string, label: string) {
    if (!confirm(`Delete all ${label}? This cannot be undone.`)) return;
    setBusy(label);
    const db = getKleapDb();
    if (!db) { setBusy(null); return; }
    await db.from(table).delete().neq("id", 0);
    setBusy(null);
    reload();
  }

  async function resetDemo() {
    if (!confirm("Reset to demo data? This will delete everything and reload sample data.")) return;
    setBusy("demo");
    const db = getKleapDb();
    if (!db) { setBusy(null); return; }
    await db.from("allocations").delete().neq("id", 0);
    await db.from("allocation_history").delete().neq("id", 0);
    await db.from("students").delete().neq("id", 0);
    await db.from("classrooms").delete().neq("id", 0);
    setBusy(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-1">Reset Demo Data</h3>
        <p className="text-sm text-muted-foreground mb-4">Clear all students, classrooms, and allocations, then restore the original sample data.</p>
        <button onClick={resetDemo} disabled={busy === "demo"} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          <RotateCcw className="w-4 h-4" /> {busy === "demo" ? "Resetting..." : "Reset to Demo Data"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-1">Clear Individual Tables</h3>
        <p className="text-sm text-muted-foreground mb-4">Remove data from a single table.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => resetTable("students", "students")} disabled={busy === "students"} className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-accent disabled:opacity-50">Clear Students</button>
          <button onClick={() => resetTable("classrooms", "classrooms")} disabled={busy === "classrooms"} className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-accent disabled:opacity-50">Clear Classrooms</button>
          <button onClick={() => resetTable("allocations", "allocations")} disabled={busy === "allocations"} className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-accent disabled:opacity-50">Clear Allocations</button>
          <button onClick={() => resetTable("allocation_history", "history")} disabled={busy === "history"} className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-accent disabled:opacity-50">Clear History</button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-1">About</h3>
        <p className="text-sm text-muted-foreground">Seat Allocation System v1.0 · Data persists across page refreshes via cloud storage.</p>
      </div>
    </div>
  );
}

/* ====================== SHARED UI ====================== */
function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className={`bg-card border border-border rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }: any) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        {placeholder && <option value="">{placeholder}</option>}
        {options.filter((o: string) => o !== "").map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}