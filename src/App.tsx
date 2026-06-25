import React, { useState, useEffect } from "react";
import {
  Compass,
  Award,
  Map,
  Shield,
  Activity,
  Sparkles,
  Info,
  LogOut,
  TrendingUp,
  Brain,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle2,
  Filter,
  BookOpen,
  Database,
  Waves,
  Heart,
  Smile,
  ChevronRight,
  ArrowRight,
  Lock,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Map3D from "./components/simulations/Map3D";
import EarthquakeSimulation from "./components/simulations/EarthquakeSimulation";
import FloodSimulation from "./components/simulations/FloodSimulation";
import VolcanoSimulation from "./components/simulations/VolcanoSimulation";
import TsunamiSimulation from "./components/simulations/TsunamiSimulation";
import SiagaBot from "./components/SiagaBot";
import EmergencyBag from "./components/EmergencyBag";
import ReflectionPanel from "./components/ReflectionPanel";
import PBL from "./components/pbl";
import Certificator from "./components/Certificator";
import DisasterMaterials from "./components/DisasterMaterials";
import DisasterQuiz from "./components/DisasterQuiz";
import DisasterRefleksi from "./components/DisasterRefleksi";
import { UserProfile } from "./types";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    "intro" | "map" | "earthquake" | "flood" | "volcano" | "bag" | "twin" | "pbl" | "cert" | "juri" | "guru"
  >("intro");

  // New Linear Adventure Flow States
  const [adventureStep, setAdventureStep] = useState<
    "landing" | "tujuan" | "materi" | "pretest" | "game" | "posttest" | "hasil" | "refleksi" | "certificate"
  >("landing");
  const [activeMission, setActiveMission] = useState<"earthquake" | "flood" | "volcano" | "tsunami">("earthquake");
  const [preTestScore, setPreTestScore] = useState<number | null>(null);
  const [postTestScore, setPostTestScore] = useState<number | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<"adventure" | "teacher" | "juri">("adventure");

  // Registration credentials
  const [guestName, setGuestName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bimo");
  const [selectedGrade, setSelectedGrade] = useState<number>(5);

  // Reflection saved tracking flags to unlock certificates
  const [reflectionsSaved, setReflectionsSaved] = useState<string[]>([]);

  // Simulation scores/progress
  const [missionStates, setMissionStates] = useState({
    earthquake: false,
    flood: false,
    volcano: false,
    tsunami: false,
  });
  const [missionCompleteStats, setMissionCompleteStats] = useState({
    earthquake: false,
    flood: false,
    volcano: false,
  });

  // State for loading teacher dashboard users list
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentFilter, setStudentFilter] = useState<"all" | "5" | "6">("all");

  // Track Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Hydrate from Firestore if available, fallback to localStorage
        let cloudProfile: UserProfile | null = null;
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            cloudProfile = docSnap.data() as UserProfile;
          }
        } catch (err) {
          console.error("Error reading user profile from Cloud:", err);
        }

        const cached = localStorage.getItem(`profile_${user.uid}`);
        if (cloudProfile) {
          setProfile(cloudProfile);
          localStorage.setItem(`profile_${user.uid}`, JSON.stringify(cloudProfile));
        } else if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          // Sync to Firestore
          try {
            await setDoc(doc(db, "users", user.uid), parsed);
          } catch (e) {
            console.error("Failed to sync cache to firestore on restart:", e);
          }
        } else {
          // brand new
          const fresh: UserProfile = {
            uid: user.uid,
            name: user.displayName || "Siswa Tanggap",
            avatar: "bimo",
            level: 1,
            points: 100,
            badges: [],
            missionsCompleted: [],
            createdAt: new Date().toISOString(),
            grade: selectedGrade || 5, // fallback grade
          };
          setProfile(fresh);
          localStorage.setItem(`profile_${user.uid}`, JSON.stringify(fresh));
          try {
            await setDoc(doc(db, "users", user.uid), fresh);
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        // Guest mode fallback hydration
        const cachedGuest = localStorage.getItem("profile_guest");
        if (cachedGuest) {
          setProfile(JSON.parse(cachedGuest));
        }
      }
    });
    return () => unsub();
  }, [selectedGrade]);

  // Fetch student profiles for the Teacher Dashboard
  const fetchStudentsList = async () => {
    setIsLoadingStudents(true);
    try {
      const q = collection(db, "users");
      const snap = await getDocs(q);
      const docsList: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        docsList.push({
          uid: d.id,
          name: data.name || "N/A",
          avatar: data.avatar || "bimo",
          level: data.level || 1,
          points: data.points || 0,
          badges: data.badges || [],
          missionsCompleted: data.missionsCompleted || [],
          createdAt: data.createdAt || "",
          grade: data.grade || 5,
        });
      });
      setAllStudents(docsList);
    } catch (e) {
      console.error("Failed fetching students list for teacher:", e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "guru") {
      fetchStudentsList();
    }
  }, [activeTab]);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const guestProfile: UserProfile = {
      uid: "guest_" + Date.now(),
      name: "Sahabat Cilik",
      avatar: selectedAvatar,
      level: 1,
      points: 50,
      badges: [],
      missionsCompleted: [],
      createdAt: new Date().toISOString(),
      grade: selectedGrade,
    };

    setProfile(guestProfile);
    localStorage.setItem("profile_guest", JSON.stringify(guestProfile));
    setAdventureStep("tujuan");
    setCurrentViewMode("adventure");
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAdventureStep("tujuan");
      setCurrentViewMode("adventure");
    } catch (err) {
      console.error("Google Auth failed", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    localStorage.removeItem("profile_guest");
    setAdventureStep("landing");
    setCurrentViewMode("adventure");
    setMissionCompleteStats({ earthquake: false, flood: false, volcano: false });
    setReflectionsSaved([]);
    setPreTestScore(null);
    setPostTestScore(null);
  };

  // Profile save helper that syncs state to LocalStorage AND Cloud Firestore (Firestore only for cloud auth)
  const saveProfileState = async (updated: UserProfile) => {
    setProfile(updated);
    const storageKey = updated.uid.startsWith("guest") ? "profile_guest" : `profile_${updated.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (!updated.uid.startsWith("guest")) {
      try {
        await setDoc(doc(db, "users", updated.uid), updated);
      } catch (err) {
        console.error("Failed to sync profile to Cloud Firestore:", err);
      }
    }
  };

  const awardPoints = (points: number, badgeName?: string, completedMissionId?: string) => {
    if (!profile) return;
    const updated = { ...profile };
    updated.points += points;

    if (badgeName && !updated.badges.includes(badgeName)) {
      updated.badges.push(badgeName);
    }

    if (completedMissionId && !updated.missionsCompleted.includes(completedMissionId)) {
      updated.missionsCompleted.push(completedMissionId);
    }

    // Is fully complete trigger Duta badge
    const requiredMissions = ["Ahli Gempa", "Penjaga Lingkungan", "Pahlawan Evakuasi"];
    const finishedAll = requiredMissions.every((b) => updated.badges.includes(b));
    if (finishedAll && !updated.badges.includes("Duta Siaga Bencana")) {
      updated.badges.push("Duta Siaga Bencana");
    }

    saveProfileState(updated);
  };

  const currentThemeColor = () => {
    if (profile?.avatar === "bimo") return "border-blue-300 text-blue-700 bg-blue-50/70";
    if (profile?.avatar === "sinta") return "border-emerald-300 text-emerald-700 bg-emerald-50/70";
    if (profile?.avatar === "adi") return "border-red-300 text-red-700 bg-red-50/70";
    return "border-purple-300 text-purple-700 bg-purple-50/70";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans transition-all duration-300 antialiased selection:bg-[#4F46E5] selection:text-white">
      {/* Dynamic Top Header */}
      <header className="bg-white border-b-4 border-indigo-100/50 sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-650 via-indigo-550 to-emerald-450 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
            MXR
          </div>
          <div>
            <h1 className="text-base font-extrabold text-indigo-650 tracking-tight flex items-center gap-1.5 uppercase font-playful">
              MITIGA-XR
            </h1>
            <span className="text-[9px] text-slate-500 font-bold tracking-wider block font-sans">
              🎮 PORTAL SIAGA BENCANA ANAK INDONESIA
            </span>
          </div>
        </div>

        {/* Action Header Nav / User Profile metrics */}
        {profile ? (
          <div className="flex items-center gap-3 md:gap-4">
            {/* Class identifier */}
            <span className="bg-indigo-50 border-2 border-indigo-100 text-[10px] sm:text-xs font-extrabold py-1 px-3 rounded-full text-indigo-600 font-sans shadow-sm">
              ✨ KELAS {profile.grade || 5} SD
            </span>

            {/* XP Points Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border-2 border-amber-100 rounded-full px-3.5 py-1 font-sans text-xs font-extrabold text-amber-600 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{profile.points} XP</span>
            </div>

            {/* Badges Count */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border-2 border-emerald-100 rounded-full px-3.5 py-1 font-sans text-xs font-extrabold text-emerald-600 shadow-sm">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{profile.badges.length} PIN</span>
            </div>

            {/* Microavatar select */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1 pr-3">
              <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                {profile.avatar === "bimo" && "👦"}
                {profile.avatar === "sinta" && "👧"}
                {profile.avatar === "adi" && "🧑"}
                {profile.avatar === "lestari" && "👩"}
              </div>
              <div className="text-left leading-none">
                <span className="text-xs font-extrabold block text-slate-800 truncate max-w-[90px]">
                  {profile.name}
                </span>
                <span className="text-[9px] text-[#22C55E] font-bold block">Siswa Tangguh</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 border-2 border-slate-200 rounded-xl hover:border-red-400 text-slate-400 hover:text-red-500 hover:bg-red-50 transition duration-200 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab("intro")}
            className="text-xs font-black bg-indigo-50 text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-100 active:scale-95 px-3 py-1.5 rounded-full transition cursor-pointer font-playful"
          >
            Masuk Petualangan 👋
          </button>
        )}
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6" id="dashboard-core">
        {/* Onboarding View: Now with Adaptive Grade Selection */}
        {!profile && activeTab === "intro" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="max-w-xl mx-auto w-full bg-white border-4 border-indigo-100 p-6 md:p-8 rounded-3xl shadow-xl space-y-6 mt-4 relative overflow-hidden text-slate-800"
          >
            {/* Playful top adventure illustration */}
            <div className="w-full h-44 bg-gradient-to-b from-sky-100 to-indigo-50 rounded-2xl relative overflow-hidden border-2 border-indigo-100/40 shadow-inner">
              {/* Cute SVG Landscape Scene (Mountains, River, House, Clouds, Trees) */}
              <svg viewBox="0 0 500 200" className="w-full h-full object-cover">
                {/* Sun */}
                <circle cx="250" cy="50" r="18" fill="#FBBF24" className="animate-pulse" />
                
                {/* Mountain (Gunung) Left */}
                <polygon points="40,200 130,70 200,200" fill="#22C55E" opacity="0.85" className="animate-sway" style={{ animationDuration: '8s' }} />
                
                {/* Volcano Mountain (Gunung Berapi) Right with cute orange lava path */}
                <polygon points="260,200 370,55 460,200" fill="#15803D" opacity="0.9" />
                <polygon points="345,90 370,55 395,90" fill="#EF4444" /> {/* Red volcano peak */}
                <path d="M 370,55 Q 365,100 360,140 Q 365,170 368,200" stroke="#F59E0B" strokeWidth="4" fill="none" /> {/* Cute Lava river */}
                
                {/* River (Sungai) flowing from mountains to base */}
                <path d="M 160,195 Q 240,140 280,120 Q 330,95 370,55" stroke="#38BDF8" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M 160,195 Q 240,140 280,120 Q 330,95 370,55" stroke="#0284C7" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />

                {/* Nice Little Cozy School/House (Rumah) */}
                <rect x="180" y="140" width="35" height="25" fill="#FFFFFF" rx="2" stroke="#475569" strokeWidth="2" />
                <polygon points="175,140 197.5,122 220,140" fill="#EF4444" stroke="#475569" strokeWidth="2" />
                <rect x="195" y="152" width="10" height="13" fill="#D97706" />

                {/* Trees (Pohon) */}
                {/* Round Tree 1 */}
                <circle cx="110" cy="155" r="14" fill="#16A34A" />
                <rect x="107" y="165" width="6" height="15" fill="#78350F" />
                {/* Pine Tree 2 */}
                <polygon points="145,170 135,150 155,150" fill="#15803D" />
                <polygon points="145,155 138,138 152,138" fill="#166534" />
                <rect x="143" y="170" width="4" height="10" fill="#78350F" />
                
                {/* Background trees */}
                <circle cx="230" cy="150" r="10" fill="#15853E" />
                <rect x="228" y="155" width="4" height="10" fill="#78350F" />

                <circle cx="280" cy="160" r="12" fill="#22C55E" />
                <rect x="278" y="165" width="4" height="12" fill="#78350F" />

                {/* Clouds (Awan) - Floating */}
                <g className="animate-float" style={{ animationDuration: '6s' }}>
                  <circle cx="70" cy="45" r="12" fill="#FFFFFF" />
                  <circle cx="85" cy="45" r="15" fill="#FFFFFF" />
                  <circle cx="100" cy="45" r="12" fill="#FFFFFF" />
                </g>
                <g className="animate-float" style={{ animationDuration: '9s' }}>
                  <circle cx="410" cy="35" r="10" fill="#FFFFFF" />
                  <circle cx="423" cy="35" r="12" fill="#FFFFFF" />
                  <circle cx="433" cy="35" r="10" fill="#FFFFFF" />
                </g>
              </svg>

              <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/70 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm shadow-md rounded-full py-1 px-3 border border-indigo-100 flex items-center gap-1">
                <span className="animate-ping w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-indigo-700 tracking-wider">MAP PETUALANGAN</span>
              </div>
            </div>

            <div className="text-center space-y-1 mt-3">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-indigo-100">
                PRODUK UNGGULAN LIDM NASIONAL
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight font-playful mt-1">Mitigasi Seru MITIGA-XR</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Petualangan siaga bencana sekolah dasar interaktif dengan simulasi 3D dan teknologi <strong>Pikiran, Hati, Rasa, Raga (Deep Learning)</strong>.
              </p>
            </div>

            <form onSubmit={handleGuestLogin} className="space-y-4">
              {/* Onboarding Grade Selection */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <label className="text-xs font-black text-indigo-650 uppercase tracking-wider block mb-2 font-sans">
                  Pilih Tingkat Kelas Belajarmu:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedGrade(5)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedGrade === 5
                        ? "bg-white border-indigo-500 shadow-md ring-4 ring-indigo-50"
                        : "bg-white border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm font-black text-slate-800">Kelas 5 SD</span>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selectedGrade === 5 ? "border-indigo-500 bg-indigo-500" : "border-slate-300"}`}>
                        {selectedGrade === 5 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-extrabold">🚀 Materi Dasar</span>
                    <span className="text-[9px] text-slate-500 leading-tight">Bimbingan ramah, latihan raga & bantuan langsung.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGrade(6)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      selectedGrade === 6
                        ? "bg-white border-emerald-500 shadow-md ring-4 ring-emerald-50"
                        : "bg-white border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm font-black text-slate-800">Kelas 6 SD</span>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selectedGrade === 6 ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                        {selectedGrade === 6 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-extrabold">⚡ Tantangan Analitis</span>
                    <span className="text-[9px] text-slate-500 leading-tight">Analisis koefisien debit, sirene awan panas, audit risiko.</span>
                  </button>
                </div>
              </div>

              {/* Avatar selection (6 Avatars) */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <label className="text-xs font-black text-indigo-650 uppercase tracking-wider block mb-2.5 font-sans">
                  Pilih Sahabat Penjelajah (Avatar):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bimo", name: "Bimo", icon: "👦", bg: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
                    { id: "sinta", name: "Sinta", icon: "👧", bg: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100" },
                    { id: "adi", name: "Adi", icon: "🧑", bg: "bg-red-50 border-red-100 hover:bg-red-100" },
                    { id: "lestari", name: "Lestari", icon: "👩", bg: "bg-purple-50 border-purple-100 hover:bg-purple-100" },
                    { id: "dewi", name: "Dewi", icon: "👩‍🦰", bg: "bg-pink-50 border-pink-100 hover:bg-pink-100" },
                    { id: "raka", name: "Raka", icon: "🧒", bg: "bg-amber-50 border-amber-100 hover:bg-amber-100" },
                  ].map((av) => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        selectedAvatar === av.id
                          ? "bg-white border-indigo-500 shadow-md scale-105"
                          : `bg-white border-slate-200 text-slate-500 ${av.bg}`
                      }`}
                    >
                      <span className="text-3xl select-none animate-float" style={{ animationDuration: '3s' }}>{av.icon}</span>
                      <span className="text-[10px] font-black block">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-4 bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-[0.98] font-playful"
              >
                Mulai Petualangan Seru Mitigasi! 🗺️
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-1 border-t-2 border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[9px] font-black tracking-widest font-sans">ATAU MASUK CLOUD</span>
              <div className="flex-1 border-t-2 border-slate-100"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full p-3 bg-white hover:bg-slate-50 text-indigo-650 font-black rounded-2xl text-xs transition border-2 border-indigo-100/80 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>🔑 Masuk Akun Google Belajar</span>
            </button>
          </motion.div>
        )}

        {/* Dashboard Panels */}
        {profile && (
          <div className="flex flex-col gap-6 w-full text-slate-800">
            {/* Elegant Header / View Switcher for Teachers, Juries, and Students */}
            <div className="bg-white border-4 border-indigo-100 rounded-3xl p-4 md:p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center text-4xl shadow-sm select-none animate-bounce">
                  {profile.avatar === "bimo" && "👦"}
                  {profile.avatar === "sinta" && "👧"}
                  {profile.avatar === "adi" && "🧑"}
                  {profile.avatar === "lestari" && "👩"}
                  {profile.avatar === "dewi" && "👩‍🦰"}
                  {profile.avatar === "raka" && "🧒"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold font-playful tracking-tight text-slate-800">Hai, Pahlawan Siaga! 👋</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-250 font-black px-2.5 py-0.5 rounded-full uppercase">
                      Kelas {profile.grade || 5} SD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Mari selamatkan lingkungan dari berbagai bencana alam!</p>
                </div>
              </div>

              {/* View Switcher Controls (Perfect for LIDM Judges and Teachers!) */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setCurrentViewMode("adventure")}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    currentViewMode === "adventure"
                      ? "bg-indigo-600 text-white shadow-md border-b-4 border-indigo-800"
                      : "bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                  }`}
                >
                  🗺️ Petualangan Siswa
                </button>
                <button
                  onClick={() => {
                    setCurrentViewMode("teacher");
                    fetchStudentsList();
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    currentViewMode === "teacher"
                      ? "bg-teal-600 text-white shadow-md border-b-4 border-teal-850"
                      : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100"
                  }`}
                >
                  🧑‍🏫 Portal Guru
                </button>
                <button
                  onClick={() => setCurrentViewMode("juri")}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    currentViewMode === "juri"
                      ? "bg-amber-600 text-white shadow-md border-b-4 border-amber-850"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100"
                  }`}
                >
                  🌟 LIDM Juri Corner
                </button>
              </div>
            </div>

            {/* Main Action Content Area */}
            <div className="w-full flex flex-col gap-6" id="dashboard-viewer">
              {currentViewMode === "adventure" && (
                <>
                  {/* Step-by-Step Interactive Adventure Stepper */}
                  <div className="bg-white border-2 border-indigo-50 p-4 rounded-3xl shadow-sm overflow-x-auto flex items-center justify-between gap-2 scrollbar-none">
                    {[
                      { step: "tujuan", label: "Tujuan 🎯" },
                      { step: "materi", label: "Materi Bencana 📚" },
                      { step: "pretest", label: "Pre-Test 📝" },
                      { step: "game", label: "Game 3D 🎮" },
                      { step: "posttest", label: "Post-Test 📝" },
                      { step: "hasil", label: "Hasil 🏆" },
                      { step: "refleksi", label: "Refleksi ✍️" },
                      { step: "certificate", label: "Sertifikat 🎓" },
                    ].map((st, i) => {
                      const isActive = adventureStep === st.step;
                      const isCompleted = [
                        "tujuan", "materi", "pretest", "game", "posttest", "hasil", "refleksi", "certificate"
                      ].indexOf(adventureStep) > i;

                      return (
                        <div key={st.step} className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight ${
                              isActive
                                ? "bg-indigo-600 text-white border-2 border-indigo-700 scale-105"
                                : isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {i + 1}. {st.label}
                          </span>
                          {i < 7 && <span className="text-slate-300 font-bold text-xs select-none">➔</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* STEP 1 / 2: TUJUAN PEMBELAJARAN (4 Dimensi Deep Learning) */}
                  {adventureStep === "tujuan" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border-4 border-indigo-100 rounded-3xl p-6 md:p-8 shadow-md space-y-6 animate-sway"
                    >
                      <div className="text-center max-w-2xl mx-auto space-y-2">
                        <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                          Petualangan Dimulai! 🌟
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight font-playful mt-1">
                          Tujuan Pembelajaran (4 Dimensi Deep Learning)
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Petualangan MITIGA-XR membimbingmu memahami kesiapsiagaan bencana secara utuh melalui 4 pilar utama sains mitigasi modern:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { title: "Pikir (IQ)", desc: "Mempelajari tanda-tanda bencana, sebab-akibat, sains geologi, dan mitigasi dengan simulasi 3D.", color: "border-blue-150 bg-blue-50/50 text-blue-700", icon: "🧠" },
                          { title: "Hati (SQ)", desc: "Menghayati rasa syukur atas keselamatan diri dan mendoakan keselamatan seluruh makhluk.", color: "border-emerald-150 bg-emerald-50/50 text-emerald-700", icon: "💖" },
                          { title: "Rasa (EQ)", desc: "Membangun empati kemanusiaan terhadap korban bencana dan memahami arti tolong-menolong.", color: "border-amber-150 bg-amber-50/50 text-amber-700", icon: "🤝" },
                          { title: "Raga (AQ)", desc: "Melatih refleks tindakan penyelamatan fisik yang cepat, tangguh, dan merancang evakuasi.", color: "border-purple-150 bg-purple-50/50 text-purple-700", icon: "🏃" },
                        ].map((dim, idx) => (
                          <div key={idx} className={`p-5 rounded-2xl border-2 ${dim.color} flex flex-col gap-2.5 shadow-sm`}>
                            <span className="text-3xl">{dim.icon}</span>
                            <h4 className="text-sm font-black font-playful">{dim.title}</h4>
                            <p className="text-xs leading-relaxed text-slate-600 font-medium">{dim.desc}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center pt-3">
                        <button
                          onClick={() => setAdventureStep("materi")}
                          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-800 text-white font-black rounded-2xl text-sm transition uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-[0.98] font-playful"
                        >
                          Mulai Belajar Materi Bencana 📚
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: MATERI PEMBELAJARAN */}
                  {adventureStep === "materi" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <DisasterMaterials onContinue={() => setAdventureStep("pretest")} />
                    </motion.div>
                  )}

                  {/* STEP 4: PRE-TEST */}
                  {adventureStep === "pretest" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <DisasterQuiz
                        type="pre"
                        grade={profile?.grade || 5}
                        onQuizComplete={(score) => {
                          setPreTestScore(score);
                          setAdventureStep("game");
                          setActiveMission("earthquake");
                        }}
                      />
                    </motion.div>
                  )}
              
              {/* STEP 5: GAME / MISI 3D */}
              {adventureStep === "game" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Dynamic Mission Header Card */}
                  <div className="bg-white border-4 border-indigo-150 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        {activeMission === "earthquake" ? "Misi 1 dari 4 🌋" : activeMission === "flood" ? "Misi 2 dari 4 🌊" : activeMission === "volcano" ? "Misi 3 dari 4 🔥" : "Misi 4 dari 4 🌊"}
                      </span>
                      <h3 className="text-lg font-black text-slate-800 mt-2 font-playful uppercase tracking-tight">
                        {activeMission === "earthquake" && "LAB SIMULASI GEMPA BUMI SEISMIK 3D"}
                        {activeMission === "flood" && "DRAINASE SUNGAI & SIMULASI BANJIR KOTA"}
                        {activeMission === "volcano" && "EVAKUASI LAHAR AKTIF GUNUNG BERAPI"}
                        {activeMission === "tsunami" && "PANTAI & SIMULASI DATANGNYA GELOMBANG TSUNAMI"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                        {activeMission === "earthquake" && "Pelajari refleks perlindungan kepala. Berlutut di bawah meja kokoh saat gempa!"}
                        {activeMission === "flood" && "Bersihkan sumbatan sampah pada saluran air got untuk melancarkan aliran air sungai."}
                        {activeMission === "volcano" && "Ikuti arah rambu petunjuk darurat ke tenda medis penampungan yang aman!"}
                        {activeMission === "tsunami" && "Ketika air laut surut drastis, segera lari menjauh ke bukit yang tinggi!"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-slate-400 font-sans font-semibold">Hadiah Keberhasilan</span>
                      <div className="text-md font-black text-amber-500 font-playful">+150 XP & Badge 📌</div>
                    </div>
                  </div>

                  {/* Earthquake simulation */}
                  {activeMission === "earthquake" && !missionStates.earthquake && (
                    <EarthquakeSimulation
                      grade={profile.grade || 5}
                      onDecisionResult={(choice, isCorrect, feedbackText) => {
                        if (isCorrect) {
                          setMissionStates((prev) => ({ ...prev, earthquake: true }));
                          const updatedProfile = {
                            ...profile,
                            points: profile.points + 150,
                            badges: [...profile.badges, "Ahli Gempa 🌋"]
                          };
                          setProfile(updatedProfile);
                          localStorage.setItem("profile_guest", JSON.stringify(updatedProfile));
                        }
                      }}
                    />
                  )}

                  {/* Earthquake Success Card */}
                  {activeMission === "earthquake" && missionStates.earthquake && (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-50 border-4 border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm"
                    >
                      <div className="text-6xl animate-bounce">🏆</div>
                      <h4 className="text-xl font-black text-emerald-800 font-playful font-extrabold">Hebat! Misi Gempa Bumi Selesai!</h4>
                      <p className="text-xs text-slate-655 max-w-lg mx-auto leading-relaxed font-semibold">
                        Kamu berhasil menyelamatkan diri dengan berlindung di bawah meja yang kokoh. 
                        Ini melatih dimensi <strong className="text-emerald-700 font-extrabold">RAGA (refleks fisik tangguh)</strong> dan <strong className="text-indigo-700 font-extrabold">PIKIR (pengetahuan spasial)</strong>-mu!
                      </p>
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setActiveMission("flood")}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-550 border-b-4 border-emerald-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md cursor-pointer font-playful font-extrabold"
                        >
                          Lanjut ke Misi 2: Banjir Kota 🌊
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Flood simulation */}
                  {activeMission === "flood" && !missionStates.flood && (
                    <FloodSimulation
                      grade={profile.grade || 5}
                      onDecisionResult={(cleanedAll, feedbackText) => {
                        if (cleanedAll) {
                          setMissionStates((prev) => ({ ...prev, flood: true }));
                          const updatedProfile = {
                            ...profile,
                            points: profile.points + 150,
                            badges: [...profile.badges, "Penjaga Lingkungan 🌊"]
                          };
                          setProfile(updatedProfile);
                          localStorage.setItem("profile_guest", JSON.stringify(updatedProfile));
                        }
                      }}
                    />
                  )}

                  {/* Flood Success Card */}
                  {activeMission === "flood" && missionStates.flood && (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-50 border-4 border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm"
                    >
                      <div className="text-6xl animate-bounce">🏆</div>
                      <h4 className="text-xl font-black text-emerald-800 font-playful font-extrabold">Luar Biasa! Misi Banjir Selesai!</h4>
                      <p className="text-xs text-slate-655 max-w-lg mx-auto leading-relaxed font-semibold">
                        Kamu membersihkan botol plastik dari got sehingga aliran air lancar dan mencegah luapan air banjir masuk pemukiman. 
                        Kamu mengasah <strong className="text-emerald-700 font-extrabold">HATI (peduli lingkungan)</strong> dan <strong className="text-purple-700 font-extrabold">RAGA (aksi nyata fisik)</strong>!
                      </p>
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setActiveMission("volcano")}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-550 border-b-4 border-emerald-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md cursor-pointer font-playful font-extrabold"
                        >
                          Lanjut ke Misi 3: Gunung Berapi 🔥
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Volcano simulation */}
                  {activeMission === "volcano" && !missionStates.volcano && (
                    <VolcanoSimulation
                      grade={profile.grade || 5}
                      onDecisionResult={(secured, feedbackText) => {
                        if (secured) {
                          setMissionStates((prev) => ({ ...prev, volcano: true }));
                          const updatedProfile = {
                            ...profile,
                            points: profile.points + 150,
                            badges: [...profile.badges, "Pahlawan Evakuasi 🔥"]
                          };
                          setProfile(updatedProfile);
                          localStorage.setItem("profile_guest", JSON.stringify(updatedProfile));
                        }
                      }}
                    />
                  )}

                  {/* Volcano Success Card */}
                  {activeMission === "volcano" && missionStates.volcano && (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-50 border-4 border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm"
                    >
                      <div className="text-6xl animate-bounce">🏆</div>
                      <h4 className="text-xl font-black text-emerald-800 font-playful font-extrabold">Hebat Sekali! Misi Gunung Berapi Selesai!</h4>
                      <p className="text-xs text-slate-655 max-w-lg mx-auto leading-relaxed font-semibold">
                        Sebab kamu waspada terhadap guguran batu gunung berapi dan berhasil mengarahkan warga mengikuti rambu evakuasi yang tepat. 
                        Ini mencerminkan prinsip <strong className="text-indigo-700 font-extrabold">PIKIR (keputusan cerdas)</strong> dan <strong className="text-purple-700 font-extrabold">RAGA (penyelamatan cepat)</strong>!
                      </p>
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setActiveMission("tsunami")}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-550 border-b-4 border-emerald-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md cursor-pointer font-playful font-extrabold"
                        >
                          Lanjut ke Misi 4: Tsunami Pantai 🌊
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Tsunami simulation */}
                  {activeMission === "tsunami" && !missionStates.tsunami && (
                    <TsunamiSimulation
                      grade={profile.grade || 5}
                      onDecisionResult={(isCorrect, feedbackText) => {
                        if (isCorrect) {
                          setMissionStates((prev) => ({ ...prev, tsunami: true }));
                          const updatedProfile = {
                            ...profile,
                            points: profile.points + 150,
                            badges: [...profile.badges, "Penjaga Pantai Tangguh 🌊"]
                          };
                          setProfile(updatedProfile);
                          localStorage.setItem("profile_guest", JSON.stringify(updatedProfile));
                        }
                      }}
                    />
                  )}

                  {/* Tsunami Success Card */}
                  {activeMission === "tsunami" && missionStates.tsunami && (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-50 border-4 border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm"
                    >
                      <div className="text-6xl animate-bounce">🏆</div>
                      <h4 className="text-xl font-black text-emerald-800 font-playful font-extrabold">Fantastis! Misi Tsunami Selesai!</h4>
                      <p className="text-xs text-slate-655 max-w-lg mx-auto leading-relaxed font-semibold">
                        Tindakanmu segera lari menjauh dari pantai ke bukit tinggi menyelamatkan hidupmu! Kamu tidak tertipu fenomena air laut surut. 
                        Kamu menguasai <strong className="text-emerald-700 font-extrabold">PIKIR (analisis gejala alam)</strong> dan <strong className="text-purple-700 font-extrabold">RAGA (aksi penyelamatan instan)</strong>!
                      </p>
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setAdventureStep("posttest")}
                          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md cursor-pointer font-playful animate-pulse font-extrabold"
                        >
                          Maju ke Post-Test Akhir 📝
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* STEP 6: POST-TEST */}
              {adventureStep === "posttest" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <DisasterQuiz
                    type="post"
                    grade={profile?.grade || 5}
                    onQuizComplete={(score) => {
                      setPostTestScore(score);
                      setAdventureStep("hasil");
                    }}
                  />
                </motion.div>
              )}

              {/* STEP 7: HASIL EVALUASI */}
              {adventureStep === "hasil" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-4 border-indigo-150 rounded-3xl p-6 md:p-8 shadow-md text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-200 rounded-full flex items-center justify-center mx-auto animate-bounce text-4xl">
                    🏆
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight font-playful uppercase">
                    Hasil Evaluasi Belajarmu
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block uppercase">Skor Pre-Test</span>
                      <span className="text-2xl font-black text-slate-700 mt-1 block">
                        {preTestScore !== null ? `${preTestScore}/100` : "-"}
                      </span>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-150">
                      <span className="text-[10px] text-indigo-500 font-extrabold tracking-wider block uppercase">Skor Post-Test</span>
                      <span className="text-2xl font-black text-indigo-700 mt-1 block">
                        {postTestScore !== null ? `${postTestScore}/100` : "-"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
                    {postTestScore !== null && preTestScore !== null && postTestScore >= preTestScore ? (
                      <span className="text-emerald-700">
                        Luar biasa! Nilaimu mengalami peningkatan! Ini membuktikan pemahaman <strong className="font-black">Pikir, Hati, dan Rasa</strong>-mu mengenai kebencanaan semakin mantap setelah menjalankan misi penyelamatan 3D!
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Selamat! Kamu telah menyelesaikan seluruh rangkaian evaluasi. Mari tuangkan refleks pemikiranmu pada lembar refleksi selanjutnya.
                      </span>
                    )}
                  </p>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => {
                        awardPoints(100, "Pahlawan Evaluasi 📝");
                        setAdventureStep("refleksi");
                      }}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-550 border-b-4 border-indigo-800 text-white font-black rounded-2xl text-xs transition uppercase tracking-wider shadow-md cursor-pointer font-playful font-extrabold"
                    >
                      Lanjut ke Refleksi Belajar ✍️
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 8: REFLEKSI AKHIR */}
              {adventureStep === "refleksi" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <DisasterRefleksi
                    onRefleksiComplete={(name, feeling, reflectionData) => {
                      const updatedProfile = {
                        ...profile,
                        name: name,
                        points: profile.points + 150,
                        badges: [...profile.badges, "Duta Siaga Bencana 🎓"]
                      };
                      setProfile(updatedProfile);
                      localStorage.setItem("profile_guest", JSON.stringify(updatedProfile));
                      
                      // Save in Firestore if they are logged in via Google
                      if (!profile.uid.startsWith("guest")) {
                        setDoc(doc(db, "users", profile.uid), updatedProfile).catch((err) => {
                          console.error("Failed to sync updated profile to Firestore:", err);
                        });
                      }
                      setAdventureStep("certificate");
                    }}
                  />
                </motion.div>
              )}

              {/* STEP 9: SERTIFIKAT KELULUSAN */}
              {adventureStep === "certificate" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Certificator
                    profile={profile}
                    onReset={() => {
                      // Reset the full journey so they can play again!
                      setAdventureStep("tujuan");
                      setMissionStates({
                        earthquake: false,
                        flood: false,
                        volcano: false,
                        tsunami: false,
                      });
                      setPreTestScore(null);
                      setPostTestScore(null);
                    }}
                  />
                </motion.div>
              )}
            </>
          )}

          {/* NEW: DEDICATED TEACHER DASHBOARD VIEW (DASHBOARD GURU) */}
          {currentViewMode === "teacher" && (
                <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-[#1E293B]">
                  <div className="border-b-2 border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="bg-teal-50 text-teal-705 text-[10px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-teal-100">
                        MONITORING EVALUASI DAN SIKLUS BELAJAR
                      </span>
                      <h3 className="text-xl font-black text-slate-800 mt-1.5 flex items-center gap-2 font-playful">
                        <Users className="w-5 h-5 text-teal-500" /> Dashboard Guru Terintegrasi
                      </h3>
                    </div>
                    
                    <button
                      onClick={fetchStudentsList}
                      className="bg-teal-50 border-2 border-teal-150 text-teal-700 hover:bg-teal-100 font-extrabold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Database className="w-3.5 h-3.5" /> Segarkan Data Cloud
                    </button>
                  </div>

                  {/* High level Metrics cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block font-sans">TOTAL SISWA TERDAFTAR</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block font-playful">
                        {allStudents.length} <span className="text-xs text-slate-500 font-medium font-sans">Anak</span>
                      </span>
                    </div>

                    <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100/50">
                      <span className="text-[10px] text-teal-605 font-extrabold tracking-wider block font-sans">DISTRIBUSI KELAS</span>
                      <span className="text-sm font-black text-teal-700 mt-1.5 block leading-relaxed">
                        Kelas 5: {allStudents.filter((s) => s.grade === 5).length} Siswa | Kelas 6: {allStudents.filter((s) => s.grade === 6).length} Siswa
                      </span>
                    </div>

                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/50">
                      <span className="text-[10px] text-amber-605 font-extrabold tracking-wider block font-sans">RATA-RATA PRESTASI PORTAL</span>
                      <span className="text-md font-black text-amber-700 mt-1 block">
                        {allStudents.length > 0
                          ? Math.round(allStudents.reduce((acc, c) => acc + c.points, 0) / allStudents.length)
                          : 0}{" "}
                        <span className="text-xs font-bold text-amber-650">XP / Siswa</span>
                      </span>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-xs font-extrabold text-slate-555 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-teal-500" /> Saring Berdasarkan Tingkat:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setStudentFilter("all")}
                        className={`py-1 px-3.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          studentFilter === "all" ? "bg-teal-650 text-white shadow-sm" : "bg-white border text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        Semua Kelas
                      </button>
                      <button
                        onClick={() => setStudentFilter("5")}
                        className={`py-1 px-3.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          studentFilter === "5" ? "bg-blue-600 text-white shadow-sm" : "bg-white border text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        Kelas 5 SD
                      </button>
                      <button
                        onClick={() => setStudentFilter("6")}
                        className={`py-1 px-3.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          studentFilter === "6" ? "bg-purple-600 text-white shadow-sm" : "bg-white border text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        Kelas 6 SD
                      </button>
                    </div>
                  </div>

                  {/* Students progress grid list */}
                  {isLoadingStudents ? (
                    <div className="p-12 text-center text-xs text-slate-500 font-bold tracking-wider animate-pulse">
                      ⚙️ MEMUAT CATATAN DATA PORTOFOLIO DARI CLOUD FIRESTORE...
                    </div>
                  ) : allStudents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
                      ❌ Belum ada data siswa cloud yang terdeteksi. Hanya siswa yang masuk menggunakan Google Autentikasi yang catatannya terkirim ke Server Database Guru.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-755">
                        <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Nama Siswa</th>
                            <th className="py-3 px-4">Tingkat Kelas</th>
                            <th className="py-3 px-4">Poin Keaktifan</th>
                            <th className="py-3 px-4">Lencana Hasil Misi</th>
                            <th className="py-3 px-4">Status Progres</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allStudents
                            .filter((s) => {
                              if (studentFilter === "all") return true;
                              return s.grade === parseInt(studentFilter);
                            })
                            .map((st) => (
                              <tr key={st.uid} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-4 font-bold flex items-center gap-2 text-slate-800">
                                  <span className="text-lg">
                                    {st.avatar === "bimo" && "👦"}
                                    {st.avatar === "sinta" && "👧"}
                                    {st.avatar === "adi" && "🧑"}
                                    {st.avatar === "lestari" && "👩"}
                                  </span>
                                  <span>{st.name}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${st.grade === 6 ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                                    Kelas {st.grade || 5} SD
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold text-amber-600 font-sans">{st.points} XP</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {st.badges.map((b, idx) => (
                                      <span key={idx} className="bg-white border-2 border-slate-100 text-[9px] px-2 py-0.5 rounded-full text-slate-600 font-bold">
                                        📌 {b}
                                      </span>
                                    ))}
                                    {st.badges.length === 0 && <span className="text-slate-400">-</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[10px] text-teal-650 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active learning path
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-xs text-teal-700 leading-relaxed">
                    🎓 <strong className="text-teal-800">Petunjuk Pembelajaran Berkelanjutan:</strong> Dashboard Guru mengimplementasikan aturan ABAC terdesentralisasi di atas Firebase, membantu pihak dewan juri maupun guru mendistribusikan penugasan yang adaptif (Differentiated Learning) berdasarkan tingkat kemampuan raga siswa.
                  </div>
                </div>
              )}

              {/* NATIONAL JURY NOTES */}
              {currentViewMode === "juri" && (
                <div className="bg-white border-4 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-[#1E293B]">
                  <div className="border-b-2 border-slate-100 pb-4">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-indigo-100">
                      LEMBAR KONSULTASI DEWAN JURI LIDM
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mt-2 font-playful font-extrabold">
                      Dokumentasi Penilaian & Nilai Inovasi MITIGA-XR
                    </h3>
                  </div>

                  {/* Flowcharts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed font-sans">
                    <div className="bg-indigo-50/45 p-5 rounded-2xl border-2 border-indigo-100 flex flex-col gap-3">
                      <h5 className="font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-indigo-600" /> ALUR INSTRUKSI DEEP LEARNING (PHRR):
                      </h5>
                      <ol className="list-decimal pl-4.5 space-y-2">
                        <li>
                          <strong>PIKIR (IQ)</strong>: Siswa mempelajari konsep bencana menggunakan simulasi 3D dan penjelasan sains di SiagaBot AI.
                        </li>
                        <li>
                          <strong>HATI (SQ)</strong>: Menghayati nilai keselamatan, kebersyukuran atas kelangsungan hidup raga bersama sesama.
                        </li>
                        <li>
                          <strong>RASA (EQ)</strong>: Berempati pada korban bencana melalui penulisan refleksi moral sosial ditiap misi.
                        </li>
                        <li>
                          <strong>RAGA (AQ)</strong>: Beraksi nyata dengan menata tas siaga bencana dan merancang denah lari evakuasi sekolah/rumah.
                        </li>
                      </ol>
                    </div>

                    <div className="bg-emerald-50/45 p-5 rounded-2xl border-2 border-emerald-100 flex flex-col gap-3">
                      <h5 className="font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <Brain className="w-4 h-4" /> RELEVANSI KURIKULUM MERDEKA & METODOLOGI:
                      </h5>
                      <ul className="list-disc pl-4.5 space-y-2">
                        <li>
                          <strong>Project-Based Learning (PBL)</strong>: Melatih kognitif kontekstual menggambar denah sekolah digital twin rincian evakuasi.
                        </li>
                        <li>
                          <strong>Gamifikasi Adaptif (Jalur 5 & 6)</strong>: Differentiated Learning memberi target tantangan relevan sesuai operasional kognitif Piaget siswa.
                        </li>
                        <li>
                          <strong>AI Mentor Berkelanjutan</strong>: Integrasi Gemini API menjaga eksplorasi anak tetap informatif tanpa batas teori kaku.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-xs text-slate-500">
                    <strong>Pernyataan Kesiapan Pembelajar:</strong> Seluruh data layout model digital twin sekolah dasar, tugas coretan PBL rumahku, data respon lencana divalidasi dan disimpan di server Firestore secara real-time dengan ABAC security rules, memadukan modern cloud-fullstack ke dalam sains mitigasi SD.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Siagabot component linked to current context */}
      {profile && (
        <SiagaBot
          currentChoice=""
          currentMissionId={
            activeTab === "earthquake"
              ? "earthquake"
              : activeTab === "flood"
              ? "flood"
              : activeTab === "volcano"
              ? "volcano"
              : "general"
          }
        />
      )}

      {/* Footer credits links */}
      <footer className="bg-white py-6 border-t border-slate-100 text-center text-[10px] text-slate-500 font-sans font-bold tracking-wider">
        <span>© 2026 MITIGA-XR - Portal Mitigasi Bencana Berbasis Deep Learning SD Kelas 4-6. LIDM Nasional.</span>
      </footer>
    </div>
  );
}
