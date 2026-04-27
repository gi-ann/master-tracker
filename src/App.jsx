import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Wallet, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp,
  Clock,
  Sparkles,
  Bot,
  User,
  LogOut,
  Sun,
  Moon,
  CalendarCheck,
  CalendarRange,
  Trash2
} from 'lucide-react';

// --- FIREBASE BACKEND IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- INISIALISASI FIREBASE MILIKMU ---
const userFirebaseConfig = {
  apiKey: "AIzaSyBHzydrByq3nakZdN4qJcnD5wqMbu3rikI",
  authDomain: "master-tracker-af670.firebaseapp.com",
  projectId: "master-tracker-af670",
  storageBucket: "master-tracker-af670.firebasestorage.app",
  messagingSenderId: "696478071577",
  appId: "1:696478071577:web:02da2a121ae3708f482388",
  measurementId: "G-48669S8NPW"
};

// Deteksi cerdas: Pakai config Naskah Pro saat di preview, pakai config kamu saat di VS Code
const isPreview = typeof __firebase_config !== 'undefined';
const firebaseConfig = isPreview ? JSON.parse(__firebase_config) : userFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = isPreview && typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;

// --- KONFIGURASI KATEGORI TRACKER ---
const CATEGORIES = {
  0: { name: 'Tidur', hex: '#6366f1', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' },
  1: { name: 'Kerja', hex: '#ef4444', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  2: { name: 'Hobi / Proyek', hex: '#f97316', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  3: { name: 'Freelance', hex: '#f59e0b', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  4: { name: 'Olahraga', hex: '#22c55e', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  5: { name: 'Teman', hex: '#10b981', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
  6: { name: 'Santai & Rekreasi', hex: '#06b6d4', color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' },
  7: { name: 'Dating / Pasangan', hex: '#ec4899', color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800' },
  8: { name: 'Keluarga', hex: '#f43f5e', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
  9: { name: 'Produktif / Tugas', hex: '#a855f7', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  10: { name: 'Perjalanan', hex: '#3b82f6', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  11: { name: 'Lain-lain / Bersiap', hex: '#6b7280', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700' },
};

// --- KONFIGURASI KATEGORI KEUANGAN ---
const FINANCE_TAGS = {
  FOOD: { label: 'Makanan & Minuman', icon: '🍔', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
  TRANSPORT: { label: 'Transportasi', icon: '🚗', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  SHOPPING: { label: 'Belanja', icon: '🛍️', color: 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400' },
  BILLS: { label: 'Tagihan & Utilitas', icon: '📄', color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
  ENTERTAINMENT: { label: 'Hiburan', icon: '🎬', color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
  HEALTH: { label: 'Kesehatan', icon: '💊', color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
  OTHER: { label: 'Lainnya', icon: '📦', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' }
};

// --- GEMINI API HELPER ---
const callGeminiAPI = async (prompt) => {
  const apiKey = ""; // Opsional: Isi dengan API Key Gemini milikmu jika ingin fitur AI aktif di hosting
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    if (!apiKey) return "Untuk menggunakan fitur ini, harap isi API Key Gemini di kode Anda terlebih dahulu.";
    let response;
    for (let i = 0; i < 5; i++) {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (response.ok) break;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
    if (!response.ok) throw new Error("Gagal mengambil data dari API.");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak dapat menghasilkan analisis saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan sistem saat mencoba menghubungi asisten AI ✨.";
  }
};

// --- KOMPONEN UTAMA ---
export default function App() {
  const [activeTab, setActiveTab] = useState('tracker'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [dailyLogs, setDailyLogs] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [notableThings, setNotableThings] = useState({ events: [], food: [], movies: [], games: [], purchases: [] });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error Terdeteksi:", error);
        // Jika Firebase belum disetting, kita berikan user sementara agar tidak error
        setUser({ uid: "local-user-id" }); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.uid === "local-user-id") return; // Cegah error baca database jika auth gagal
    
    const userId = user.uid;
    const unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'dailyLogs'), (snapshot) => {
      const logs = {}; snapshot.forEach(doc => { logs[doc.id] = doc.data(); });
      setDailyLogs(logs);
    });
    const unsubExp = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'expenses'), (snapshot) => {
      const exps = []; snapshot.forEach(doc => { exps.push(doc.data()); });
      setExpenses(exps.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });
    const unsubNot = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'notableThings', 'masterData'), (snapshot) => {
      if(snapshot.exists()) setNotableThings(snapshot.data());
    });
    return () => { unsubLogs(); unsubExp(); unsubNot(); };
  }, [user]);

  // --- DATABASE UPDATE FUNCTIONS ---
  const updateDayData = useCallback(async (dateStr, updates) => {
    if (!user || user.uid === "local-user-id") return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'dailyLogs', dateStr);
    await setDoc(docRef, updates, { merge: true });
  }, [user]);

  const updateNotableToDB = useCallback(async (newData) => {
    if (!user || user.uid === "local-user-id") return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notableThings', 'masterData');
    await setDoc(docRef, newData);
  }, [user]);

  const addExpenseToDB = useCallback(async (expenseData) => {
    if (!user || user.uid === "local-user-id") return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', expenseData.id);
    await setDoc(docRef, expenseData);
  }, [user]);

  const deleteExpenseFromDB = useCallback(async (id) => {
    if (!user || user.uid === "local-user-id") return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id);
    await deleteDoc(docRef);
  }, [user]);

  // --- UI FUNCTIONS ---
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today); 
    if (activeTab === 'tracker') {
      setTimeout(() => {
        const todayStr = today.toISOString().split('T')[0];
        const el = document.getElementById(`day-${todayStr}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
      }, 100);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (user && user.uid !== "local-user-id") {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'theme'), { isDark: newTheme });
    }
  };

  const dateStr = currentDate.toISOString().split('T')[0];

  return (
    <div className={`h-screen w-screen overflow-hidden transition-colors duration-500 font-sans ${isDarkMode ? 'dark bg-[#0A0A0A] text-gray-100' : 'bg-[#F5F5F7] text-gray-900'} relative`}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] z-0" style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      <header className={`fixed top-0 w-full z-50 flex items-center justify-between px-6 py-5 ${isDarkMode ? 'bg-[#0A0A0A]/80 border-b border-white/5 backdrop-blur-md' : 'bg-[#F5F5F7]/80 border-b border-gray-200 backdrop-blur-md'}`}>
        <div className="relative">
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-[#1C1C1E] border border-white/10 hover:bg-[#2C2C2E]' : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'}`}>
            <span className="text-xl">🦩</span>
          </button>
          {isProfileMenuOpen && (
            <div className={`absolute top-14 left-0 w-64 rounded-2xl p-2 shadow-2xl border ${isDarkMode ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="px-3 py-3 mb-2 border-b border-gray-500/20">
                <p className="font-semibold text-sm flex items-center">
                  Pengguna Naskah Pro 
                  <span className="text-[10px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full ml-2">Beta V.02</span>
                </p>
                {user && <p className="text-[10px] text-gray-500 mt-1 truncate">ID: {user.uid}</p>}
              </div>
              <button onClick={toggleTheme} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-500/10 transition-colors">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>Tema {isDarkMode ? 'Terang' : 'Gelap'}</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 mt-1 transition-colors">
                <LogOut size={16} /><span>Keluar</span>
              </button>
            </div>
          )}
        </div>

        <button onClick={handleGoToToday} className={`flex items-center space-x-2 px-5 py-2 rounded-full border ${isDarkMode ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200'}`}>
          <CalendarDays size={16} className="text-[#409CFF]" />
          <span className="text-sm font-medium">Hari Ini: {currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
        </button>

        <div className="flex items-center space-x-3">
          {[
            { id: 'tracker', icon: <CalendarRange size={20} />, title: "Master Tracker" },
            { id: 'habbit', icon: <CalendarCheck size={20} />, title: "Harian" },
            { id: 'spend', icon: <Wallet size={20} />, title: "Keuangan" },
            { id: 'dashboard', icon: <LayoutDashboard size={20} />, title: "Dashboard" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.title} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-[#409CFF] text-white shadow-lg' : isDarkMode ? 'bg-[#1C1C1E] text-[#409CFF]' : 'bg-white text-blue-600 border'}`}>
              {tab.icon}
            </button>
          ))}
        </div>
      </header>

      <main className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <style dangerouslySetInnerHTML={{__html: `
          html { scroll-behavior: smooth; }
          .scroll-container::-webkit-scrollbar { width: 6px; height: 6px; }
          .scroll-container::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
          .scroll-container:hover::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.3); }
        `}} />

        <div className="relative w-full h-full pointer-events-none">
          <TabContainer active={activeTab === 'habbit'}>
            <DailyTrackerView currentDate={currentDate} setCurrentDate={setCurrentDate} dailyLogs={dailyLogs} updateDayData={updateDayData} dateStr={dateStr} />
          </TabContainer>
          <TabContainer active={activeTab === 'spend'}>
            <FinanceTrackerView expenses={expenses} addExpenseToDB={addExpenseToDB} deleteExpenseFromDB={deleteExpenseFromDB} />
          </TabContainer>
          <TabContainer active={activeTab === 'dashboard'}>
            <DashboardView dailyLogs={dailyLogs} notableThings={notableThings} updateNotableToDB={updateNotableToDB} />
          </TabContainer>
          <TabContainer active={activeTab === 'tracker'}>
            <MasterYearlyView dailyLogs={dailyLogs} updateDayData={updateDayData} />
          </TabContainer>
        </div>
      </main>
    </div>
  );
}

function TabContainer({ active, children }) {
  return (
    <div className={`absolute inset-0 overflow-y-auto scroll-container transform-gpu transition-all duration-300 ease-out ${active ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-[0.98] z-0 pointer-events-none translate-y-2'}`}>
      <div className="max-w-6xl mx-auto pt-28 pb-24 px-4 md:px-6 w-full">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// VIEW 1: HABIT TRACKER (MODUL HARIAN)
// ==========================================
function DailyTrackerView({ currentDate, setCurrentDate, dailyLogs, updateDayData, dateStr }) {
  const [selectedHour, setSelectedHour] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const todayLog = dailyLogs[dateStr] || { hours: {}, notes: '', weight: '' };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
    setSelectedHour(null);
  };

  const setHourCategory = (hour, catId) => {
    const newHours = { ...todayLog.hours, [hour]: catId };
    if (catId === undefined) delete newHours[hour];
    updateDayData(dateStr, { hours: newHours });
    setSelectedHour(null);
  };

  const updateAdditionalInfo = (field, value) => {
    updateDayData(dateStr, { [field]: value });
  };

  const generateDailyInsight = async () => {
    setIsAiLoading(true); setAiInsight("");
    const hoursCount = Object.values(todayLog.hours).reduce((acc, catId) => {
      const catName = CATEGORIES[catId]?.name || 'Lainnya'; 
      acc[catName] = (acc[catName] || 0) + 0.5; // 30 menit per blok
      return acc;
    }, {});
    const summaryText = Object.entries(hoursCount).map(([name, count]) => `- ${name}: ${count} jam`).join('\n');
    const prompt = `Sebagai penasihat produktivitas pribadi, berikan evaluasi singkat, ramah, dan memotivasi untuk ringkasan hari ini:\n\nCatatan: ${todayLog.notes || 'Tidak ada catatan'}\nBerat Badan: ${todayLog.weight || '-'}\n\nPembagian Waktu:\n${summaryText || 'Belum ada data'}\n\nBerikan 1 paragraf komentar mengenai keseimbangan waktu saya hari ini, pujian ringan, dan 1-2 saran praktis untuk besok. Gunakan bahasa Indonesia yang santai tapi profesional. Jangan gunakan format markdown yang berlebihan.`;
    
    const result = await callGeminiAPI(prompt);
    setAiInsight(result); setIsAiLoading(false);
  };

  const displayDate = currentDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white dark:bg-[#1C1C1E] p-4 rounded-full border border-gray-200 dark:border-white/5 shadow-sm">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"><ChevronLeft size={20}/></button>
        <h2 className="text-lg font-semibold">{displayDate}</h2>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"><ChevronRight size={20}/></button>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 48 }).map((_, slotIndex) => {
            const catId = todayLog.hours[slotIndex];
            const cat = catId !== undefined ? CATEGORIES[catId] : null;
            
            // Format 24 Jam
            const hour = Math.floor(slotIndex / 2);
            const mins = slotIndex % 2 === 0 ? '00' : '30';
            const displayTime = `${String(hour).padStart(2, '0')}:${mins}`;
            
            return (
              <div key={slotIndex} className="relative">
                <button
                  onClick={() => setSelectedHour(slotIndex === selectedHour ? null : slotIndex)}
                  className={`w-full h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    cat ? `${cat.color} shadow-sm border-transparent` : 'bg-gray-50 dark:bg-[#252528] border-gray-200 dark:border-white/5 opacity-60 hover:opacity-100'
                  } ${selectedHour === slotIndex ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#1C1C1E]' : ''}`}
                >
                  <span className="text-xs font-semibold mb-1 opacity-70">{displayTime}</span>
                  {cat && <span className="text-xs text-center px-1 font-medium leading-tight">{cat.name}</span>}
                </button>

                {selectedHour === slotIndex && (
                  <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-[#2C2C2E] p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 grid grid-cols-2 gap-2" style={{ left: '50%', transform: 'translateX(-50%)'}}>
                    {Object.entries(CATEGORIES).map(([id, category]) => (
                      <button key={id} onClick={() => setHourCategory(slotIndex, parseInt(id))} className={`text-xs p-2 rounded-xl border text-left ${category.color} hover:opacity-80 transition-opacity`}>
                        {category.name}
                      </button>
                    ))}
                    <button onClick={() => setHourCategory(slotIndex, undefined)} className="text-xs p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] opacity-70 text-center col-span-2 hover:opacity-100">
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm md:col-span-2">
          <label className="block text-sm font-semibold opacity-70 mb-2">Komentar / Sorotan Hari Ini</label>
          <textarea 
            value={todayLog.notes || ''} onChange={(e) => updateAdditionalInfo('notes', e.target.value)}
            className="w-full h-24 p-3 bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Apa yang menarik hari ini?"
          />
        </div>
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-center">
          <label className="block text-sm font-semibold opacity-70 mb-2">Berat Badan (kg)</label>
          <input 
            type="number" value={todayLog.weight || ''} onChange={(e) => updateAdditionalInfo('weight', e.target.value)}
            className="w-full p-3 text-2xl font-bold bg-gray-50 dark:bg-[#252528] border border-gray-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-center"
            placeholder="0.0"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-500/20 p-6 rounded-3xl shadow-sm mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-300">
            <Sparkles size={20} />
            <h3 className="font-bold text-lg">Wawasan Harian AI</h3>
          </div>
          <button onClick={generateDailyInsight} disabled={isAiLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2">
            {isAiLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Menganalisis...</span></> : <><Bot size={18} /><span>✨ Analisis Hari Ini ✨</span></>}
          </button>
        </div>
        {aiInsight ? (
          <div className="bg-white/70 dark:bg-black/20 p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border border-white/50 dark:border-white/5">
            {aiInsight}
          </div>
        ) : (
          <p className="text-sm opacity-60 italic">Klik tombol di atas untuk mendapatkan ringkasan dan evaluasi cerdas tentang hari Anda dari AI.</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VIEW 2: FINANCE TRACKER (MODUL KEUANGAN)
// ==========================================
function FinanceTrackerView({ expenses, addExpenseToDB, deleteExpenseFromDB }) {
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], tag: 'FOOD', item: '', amount: '' });

  const totalSpent = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.amount || !formData.date) return;
    
    const newExpense = {
      id: Date.now().toString(),
      date: formData.date,
      tag: formData.tag,
      item: formData.item,
      amount: parseFloat(formData.amount)
    };
    
    addExpenseToDB(newExpense);
    setFormData({ ...formData, item: '', amount: '' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-center">
          <p className="text-sm font-medium opacity-80 mb-1">Total Pengeluaran Keseluruhan</p>
          <h2 className="text-4xl font-bold tracking-tight">
            <span className="opacity-60 text-2xl mr-1">Rp</span> 
            {totalSpent.toLocaleString('id-ID')}
          </h2>
        </div>
        
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm col-span-1 md:col-span-2 flex items-center">
          <div className="w-full flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold opacity-60 mb-2">Total Transaksi</p>
              <p className="text-2xl font-bold">{expenses.length} <span className="text-base font-normal opacity-50">Catatan</span></p>
            </div>
            <div className="h-12 w-px bg-gray-200 dark:bg-white/10 mx-4"></div>
            <div>
              <p className="text-sm font-semibold opacity-60 mb-2">Rata-rata Transaksi</p>
              <p className="text-2xl font-bold text-orange-500">
                <span className="text-sm font-normal opacity-70 mr-1">Rp</span>
                {expenses.length > 0 ? Math.round(totalSpent / expenses.length).toLocaleString('id-ID') : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-6 flex items-center"><Wallet className="mr-2 opacity-70" size={20}/> Catat Pengeluaran</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold opacity-60 uppercase mb-1.5 ml-1">Tanggal</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl border border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-60 uppercase mb-1.5 ml-1">Kategori</label>
                <select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl border border-transparent outline-none transition-all appearance-none">
                  {Object.entries(FINANCE_TAGS).map(([key, data]) => (
                    <option key={key} value={key}>{data.icon} {data.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-60 uppercase mb-1.5 ml-1">Nama Barang / Keperluan</label>
                <input type="text" required placeholder="Cth: Makan Siang Kfc..." value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl border border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-60 uppercase mb-1.5 ml-1">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-50">Rp</span>
                  <input type="number" required placeholder="50000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 pl-10 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl border border-transparent outline-none transition-all font-semibold" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-md transition-transform active:scale-[0.98] mt-2">
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm min-h-[500px]">
            <h3 className="font-bold text-lg mb-6 opacity-80">Riwayat Transaksi Terbaru</h3>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-40 text-center">
                <Wallet size={48} className="mb-4" />
                <p>Belum ada pengeluaran yang dicatat.<br/>Ayo mulai kelola keuanganmu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => {
                  const tagData = FINANCE_TAGS[exp.tag] || FINANCE_TAGS['OTHER'];
                  const expDate = new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <div key={exp.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${tagData.color}`}>
                          {tagData.icon}
                        </div>
                        <div>
                          <p className="font-bold text-sm md:text-base leading-tight mb-1">{exp.item}</p>
                          <div className="flex items-center text-[11px] font-semibold opacity-60 space-x-2">
                            <span>{expDate}</span><span>•</span><span className="uppercase tracking-wider">{tagData.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-bold text-red-500 dark:text-red-400">
                          - Rp {parseFloat(exp.amount).toLocaleString('id-ID')}
                        </p>
                        <button onClick={() => deleteExpenseFromDB(exp.id)} className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-500/20" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW 3: DASHBOARD (STATISTIK & NOTABLE THINGS SPREADSHEET)
// ==========================================
const NOTABLE_COLS = [
  { id: 'events', label: 'Events' },
  { id: 'food', label: 'Food' },
  { id: 'movies', label: 'Movies & TV Shows' },
  { id: 'games', label: 'Games' },
  { id: 'purchases', label: 'Major Purchases', hasPrice: true }
];

function DashboardView({ dailyLogs, notableThings, updateNotableToDB }) {
  const [newItem, setNewItem] = useState({ category: 'events', name: '', price: '' });

  const categoryStats = {};
  let totalHours = 0;
  
  Object.keys(CATEGORIES).forEach(id => categoryStats[id] = 0);

  Object.values(dailyLogs).forEach(log => {
    Object.values(log.hours || {}).forEach(catId => {
      if(categoryStats[catId] !== undefined) {
        categoryStats[catId] += 0.5;
        totalHours += 0.5;
      }
    });
  });

  let cumulativePercent = 0;
  const pieGradient = Object.entries(categoryStats).map(([id, hours]) => {
    if (hours === 0) return null;
    const percent = (hours / totalHours) * 100;
    const color = CATEGORIES[id].hex;
    const segment = `${color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return segment;
  }).filter(Boolean).join(', ');

  const handleAddNotable = (e) => {
    e.preventDefault();
    if(!newItem.name) return;
    const updated = { ...notableThings };
    if (!updated[newItem.category]) updated[newItem.category] = [];
    
    updated[newItem.category] = [...updated[newItem.category], { 
      id: Date.now().toString(), 
      name: newItem.name, 
      price: newItem.category === 'purchases' ? newItem.price : null 
    }];
    updateNotableToDB(updated);
    setNewItem({ ...newItem, name: '', price: '' });
  };

  const deleteNotable = (cat, id) => {
    const updated = { ...notableThings };
    updated[cat] = updated[cat].filter(item => item.id !== id);
    updateNotableToDB(updated);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* --- STATISTIK DISTRIBUSI WAKTU --- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm md:col-span-2 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <h3 className="text-lg font-bold mb-6 self-start w-full opacity-80 flex items-center space-x-2">
            <Clock size={18} /> <span>Distribusi Waktu</span>
          </h3>
          {totalHours > 0 ? (
            <div className="relative w-48 h-48 md:w-52 md:h-52 rounded-full shadow-lg border border-gray-100 dark:border-white/5" style={{ background: `conic-gradient(${pieGradient})` }}>
              <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-[#1C1C1E] rounded-full shadow-inner flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{totalHours}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-50 font-bold">Jam Terdata</span>
              </div>
            </div>
          ) : (
            <div className="opacity-40 flex flex-col items-center">
              <Clock size={40} className="mb-3" />
              <p className="text-sm">Belum ada jam yang dicatat</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm md:col-span-3">
          <h3 className="text-lg font-bold mb-4 opacity-80">Rincian Kategori</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold opacity-40 uppercase tracking-widest border-b dark:border-white/5 pb-2 mb-3">
              <span>Kategori</span><span>Total Jam</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto pr-2 space-y-3 scroll-container">
              {Object.entries(CATEGORIES)
                .sort((a, b) => categoryStats[b[0]] - categoryStats[a[0]])
                .map(([id, cat]) => {
                  const hours = categoryStats[id];
                  if (hours === 0) return null;
                  return (
                    <div key={id} className="flex justify-between items-center group">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.hex }}></div>
                        <span className="text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ backgroundColor: cat.hex, width: `${(hours / totalHours) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-bold w-12 text-right">{hours} <span className="text-[10px] opacity-50 font-normal">j</span></span>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- FORM TAMBAH CATATAN --- */}
      <form onSubmit={handleAddNotable} className="flex flex-wrap gap-3 mb-2 p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
        <h4 className="w-full text-sm font-bold opacity-80 mb-2 flex items-center"><Plus size={16} className="mr-2"/> Tambah Catatan Tabel</h4>
        <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="p-2.5 text-sm font-medium bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
          <option value="events">Events</option>
          <option value="food">Food</option>
          <option value="movies">Movies & TV Shows</option>
          <option value="games">Games</option>
          <option value="purchases">Major Purchases</option>
        </select>
        <input type="text" required placeholder="Judul / Nama..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="flex-1 min-w-[200px] p-2.5 text-sm bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
        {newItem.category === 'purchases' && (
          <input type="number" required placeholder="Harga ($)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-28 p-2.5 text-sm bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
        )}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform active:scale-95">Simpan</button>
      </form>

      {/* --- SPREADSHEET TABLE NOTABLE THINGS --- */}
      <div className="bg-white dark:bg-[#121417] rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-x-auto font-mono text-[11px] sm:text-xs">
        <div className="min-w-max">
          {/* Judul Tabel */}
          <div className="text-center font-bold py-3 border-b border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 uppercase tracking-widest opacity-80">
            Notable Things That Happened
          </div>
          
          {/* Header Tabel */}
          <div className="grid grid-cols-5 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50 dark:bg-[#1A1D20]">
            {NOTABLE_COLS.map(col => (
              <div key={col.id} className={`font-bold py-2 px-3 opacity-80 flex justify-between ${col.id === 'purchases' ? 'col-span-1' : ''}`}>
                <span>{col.label}</span>
                {col.hasPrice && <span>Price</span>}
              </div>
            ))}
          </div>
          
          {/* Isi Tabel (Lajur Independen) */}
          <div className="grid grid-cols-5 divide-x divide-gray-200 dark:divide-white/10 min-h-[400px]">
            {NOTABLE_COLS.map(col => (
              <div key={col.id} className="flex flex-col bg-white dark:bg-[#121417]">
                {(notableThings[col.id] || []).map(item => (
                  <div key={item.id} className="py-1.5 px-3 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 group flex justify-between items-start transition-colors">
                    <span className="opacity-90 pr-2 leading-relaxed">{item.name}</span>
                    <div className="flex items-center space-x-2 shrink-0">
                      {col.hasPrice && <span className="opacity-70 font-semibold">${item.price}</span>}
                      <button onClick={() => deleteNotable(col.id, item.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW 4: MASTER YEARLY TRACKER
// ==========================================
const DayRow = React.memo(({ dayData, log, isSelected, onDotClick, updateDayData, onCategorySelect, idx }) => {
  const isFirstDayOfMonth = dayData.dateNum === 1;
  const timeSlots = Array.from({ length: 48 });

  return (
    <React.Fragment>
      {isFirstDayOfMonth && <div id={`month-${dayData.monthStr}`} className={`${idx !== 0 ? 'h-4' : 'h-0'} scroll-mt-[85px]`} />}
      
      <div id={`day-${dayData.dateStr}`} className="flex items-center rounded-md px-1 py-0.5 group hover:bg-gray-500/5 scroll-mt-[85px]">
        <div className="w-[100px] shrink-0 flex items-center space-x-2 text-[10px] font-bold opacity-40 group-hover:opacity-100">
          <span className="w-4 text-right">{dayData.dateNum}</span>
          <span className="w-6 text-left">{dayData.monthStr}</span>
          <span className="w-6 text-left text-[#409CFF]">{dayData.dayStr}</span>
        </div>
        
        <div className="flex">
          {timeSlots.map((_, slotIdx) => {
            const catId = log.hours[slotIdx];
            const hexColor = catId !== undefined ? CATEGORIES[catId].hex : 'rgba(150, 150, 150, 0.1)';
            const isDotSelected = isSelected && isSelected.slotIdx === slotIdx;

            const hour = Math.floor(slotIdx / 2);
            const mins = slotIdx % 2 === 0 ? '00' : '30';
            const displayTime = `${String(hour).padStart(2, '0')}:${mins}`;
            const catName = catId !== undefined ? CATEGORIES[catId].name : 'Kosong';
            const hoverText = `${displayTime} - ${catName}`;

            return (
              <div key={slotIdx} className="relative w-3 h-3 mx-0.5 shrink-0">
                <div 
                  className={`w-full h-full rounded-full transition-transform hover:scale-125 cursor-pointer ${isDotSelected ? 'ring-2 ring-blue-500 scale-125 shadow-lg' : ''}`}
                  style={{ backgroundColor: hexColor }}
                  title={hoverText} 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.target.getBoundingClientRect();
                    const isTopHalf = rect.top < window.innerHeight / 2;
                    onDotClick(dayData.dateStr, slotIdx, isTopHalf, log.hours || {});
                  }}
                />
                
                {isDotSelected && (
                  <div 
                    className={`absolute z-50 left-1/2 transform -translate-x-1/2 w-56 bg-white dark:bg-[#2C2C2E] p-3 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 grid grid-cols-2 gap-1.5 animate-in zoom-in-95 duration-150 ${
                      isSelected.isTopHalf ? 'top-full mt-2' : 'bottom-full mb-2'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="col-span-2 text-[10px] font-bold opacity-50 uppercase text-center pb-2 border-b dark:border-white/10 mb-1">
                      {dayData.dateNum} {dayData.monthStr} • {displayTime}
                    </div>
                    {Object.entries(CATEGORIES).map(([id, category]) => (
                      <button 
                        key={id} 
                        onClick={() => {
                          const newHours = { ...log.hours, [slotIdx]: parseInt(id) };
                          updateDayData(dayData.dateStr, { hours: newHours });
                          onCategorySelect(dayData.dateStr, slotIdx, parseInt(id)); 
                          onDotClick(null);
                        }} 
                        className={`text-[10px] p-2 rounded-xl border text-left font-medium ${category.color} truncate`}
                      >
                        {category.name}
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        const newHours = { ...log.hours };
                        delete newHours[slotIdx];
                        updateDayData(dayData.dateStr, { hours: newHours });
                        onCategorySelect(null); 
                        onDotClick(null);
                      }} 
                      className="col-span-2 text-[10px] p-2 bg-red-500/10 text-red-500 rounded-xl font-bold mt-1"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
});

function MasterYearlyView({ dailyLogs, updateDayData }) {
  const [selectedDot, setSelectedDot] = useState(null);
  const lastActionRef = React.useRef(null);

  const handleCategorySelect = useCallback((dateStr, slotIdx, catId) => {
    if (catId === null) lastActionRef.current = null;
    else lastActionRef.current = { dateStr, slotIdx, catId };
  }, []);

  const year2026 = useMemo(() => {
    const data = [];
    const monthData = [
      { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 },
      { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 },
      { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 },
      { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
    ];
    const daysOfWeek = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    let currentDayIdx = 4; // 1 Jan 2026 is Thu
    monthData.forEach((m, mIdx) => {
      for (let d = 1; d <= m.days; d++) {
        data.push({ dateNum: d, monthStr: m.name, dayStr: daysOfWeek[currentDayIdx], dateStr: `2026-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
        currentDayIdx = (currentDayIdx + 1) % 7;
      }
    });
    return data;
  }, []);

  useEffect(() => {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const el = document.getElementById(`month-${monthNames[new Date().getMonth()]}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 100);
  }, []);

  const handleDotClick = useCallback((dateStr, slotIdx, isTopHalf, currentHours = {}) => {
    if (!dateStr) {
      setSelectedDot(null);
      return;
    }
    const lastAction = lastActionRef.current;
    if (lastAction && lastAction.dateStr === dateStr && lastAction.slotIdx !== slotIdx) {
      const start = Math.min(lastAction.slotIdx, slotIdx);
      const end = Math.max(lastAction.slotIdx, slotIdx);
      const newHours = { ...currentHours };
      for (let i = start; i <= end; i++) newHours[i] = lastAction.catId;
      updateDayData(dateStr, { hours: newHours });
      lastActionRef.current = null;
      setSelectedDot(null);
    } else {
      setSelectedDot(prev => prev?.dateStr === dateStr && prev?.slotIdx === slotIdx ? null : { dateStr, slotIdx, isTopHalf });
      lastActionRef.current = null;
    }
  }, [updateDayData]);

  return (
    <div className="flex justify-center w-full" onClick={() => setSelectedDot(null)}>
      <div className="bg-white dark:bg-[#1C1C1E] p-4 md:p-6 rounded-3xl border border-gray-200 dark:border-white/5 overflow-x-auto scroll-container shadow-sm w-fit max-w-full">
        <div className="min-w-max">
          <div className="flex mb-4 text-[10px] opacity-40 uppercase font-bold tracking-widest border-b dark:border-white/10 pb-2">
            <div className="w-[100px] shrink-0"></div>
            <div className="flex">{Array.from({length: 24}).map((_, h) => <div key={h} className="w-8 text-center shrink-0">{h === 0 ? 12 : h > 12 ? h - 12 : h}</div>)}</div>
          </div>
          <div className="space-y-[3px]">
            {year2026.map((day, idx) => (
              <DayRow 
                key={day.dateStr} 
                dayData={day} 
                log={dailyLogs[day.dateStr] || { hours: {} }} 
                isSelected={selectedDot?.dateStr === day.dateStr ? selectedDot : null} 
                onDotClick={handleDotClick} 
                updateDayData={updateDayData} 
                onCategorySelect={handleCategorySelect}
                idx={idx} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}