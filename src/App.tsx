import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Compass, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessHealthState, TopProduct, ActionItem } from './types';
import { DEFAULT_BUSINESS_STATE } from './utils/defaultData';

// Component imports
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewTab from './components/OverviewTab';
import SalesAnalyticsTab from './components/SalesAnalyticsTab';
import InventoryTab from './components/InventoryTab';
import CustomerInsightsTab from './components/CustomerInsightsTab';
import ActionPlanTab from './components/ActionPlanTab';
import AIAnalyzerTab from './components/AIAnalyzerTab';
import SettingsTab from './components/SettingsTab';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
import ReportsTab from './components/ReportsTab';
import ReportPreview from './components/ReportPreview';
import { AnalysisHistoryRecord, BusinessProfile } from './types/analysis';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // App-level state synchronization
  const [businessState, setBusinessState] = useState<BusinessHealthState>(DEFAULT_BUSINESS_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'info' | 'error'>('info');

  // Database tracking flags for demo versus live data persistence
  const [isDemoActive, setIsDemoActive] = useState<boolean>(true);
  const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
  const [isUnsavedAnalysis, setIsUnsavedAnalysis] = useState<boolean>(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState<boolean>(false);
  const [lastInputPayload, setLastInputPayload] = useState<{
    fileData?: string;
    fileName?: string;
    fileType?: string;
    textInput?: string;
    businessType: string;
  } | null>(null);

  // Interactive MSME profile parameters (customizable in Settings)
  const [activeProfile, setActiveProfile] = useState<BusinessProfile | null>(null);
  
  // Standalone public share link states
  const [sharedAnalysisId, setSharedAnalysisId] = useState<string | null>(null);
  const [sharedRecord, setSharedRecord] = useState<AnalysisHistoryRecord | null>(null);
  const [isSharedLoading, setIsSharedLoading] = useState<boolean>(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('Kopi Selaras Cilandak');
  const [businessType, setBusinessType] = useState<string>('F&B Cafe');
  const [location, setLocation] = useState<string>('Jakarta, Indonesia');
  const [currency, setCurrency] = useState<string>('IDR');

  // API connectivity status state
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);

  // Dynamic status checker helper
  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      if (response.ok && result.status === 'ok') {
        setIsBackendHealthy(true);
      } else {
        setIsBackendHealthy(false);
      }
    } catch (err) {
      console.warn('Backend connection check failed: Offline or server offline.');
      setIsBackendHealthy(false);
    }
  };

  // Queries profile and history logs on boot to populate latest analysis automatically
  const loadProfileAndLatestHistoryOnBoot = async () => {
    try {
      // 1. Fetch active business profile
      const profRes = await fetch('/api/business-profile');
      const profJson = await profRes.json();
      let hasProfile = false;
      if (profRes.ok && profJson.success && profJson.data) {
        setActiveProfile(profJson.data);
        setBusinessName(profJson.data.business_name);
        setBusinessType(profJson.data.business_type || 'F&B Cafe');
        setLocation(profJson.data.location || 'Indonesia');
        setCurrency(profJson.data.currency || 'IDR');
        hasProfile = true;
      } else {
        setActiveProfile(null);
      }

      // 2. Fetch analysis histories
      const response = await fetch('/api/analysis-history');
      const result = await response.json();
      if (response.ok && result.success && result.data && result.data.length > 0) {
        const latest = result.data[0]; // Descending, index 0 is newest
        setBusinessState(latest.ai_result);
        if (latest.business_name) {
          setBusinessName(latest.business_name);
        }
        if (latest.business_type) {
          setBusinessType(latest.business_type);
        }
        setIsDemoActive(false);
        setIsEmptyState(false);
      } else {
        // No saved audits found -> Overview renders "Belum ada analisis" empty state
        setIsEmptyState(true);
        setIsDemoActive(true);
      }
    } catch (err) {
      console.warn('Failed to load latest saved audit history. Falling back to empty state:', err);
      setIsEmptyState(true);
      setIsDemoActive(true);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    loadProfileAndLatestHistoryOnBoot();

    // Parse standalone public share link on boot
    const match = window.location.pathname.match(/^\/reports\/([a-zA-Z0-9-]+)/);
    if (match && match[1]) {
      const id = match[1];
      setSharedAnalysisId(id);
      setIsSharedLoading(true);
      fetch(`/api/reports/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Data laporan tidak ditemukan atau tidak valid.');
          return res.json();
        })
        .then(result => {
          if (result.success && result.data) {
            setSharedRecord(result.data);
          } else {
            setSharedError('Laporan tidak ditemukan.');
          }
        })
        .catch(err => {
          setSharedError(err.message || 'Gagal memuat laporan luar.');
        })
        .finally(() => {
          setIsSharedLoading(false);
        });
    }
  }, []);

  const handleResetDemo = () => {
    setBusinessState(DEFAULT_BUSINESS_STATE);
    setBusinessName('Kopi Selaras Cilandak');
    setBusinessType('F&B Cafe');
    setLocation('Jakarta, Indonesia');
    setIsDemoActive(true);
    setIsEmptyState(false);
    setIsUnsavedAnalysis(false);
    setErrorBanner(null);
    setBannerType('info');
    setActiveTab('overview');
    
    // Auto fade demo notification
    setErrorBanner('Demo Data Kopi Selaras Cilandak berhasil dipulihkan!');
    setBannerType('info');
    setTimeout(() => {
      setErrorBanner(null);
    }, 4000);
  };

  const handleUpdateProducts = (newProducts: TopProduct[]) => {
    setBusinessState(prev => ({
      ...prev,
      top_products: newProducts
    }));
  };

  const handleUpdateActionItems = (newActions: ActionItem[]) => {
    setBusinessState(prev => ({
      ...prev,
      action_plan: newActions
    }));
  };

  // Saves the currently displayed active analysis results to the backend
  const handleSaveAnalysis = async () => {
    setIsSavingAnalysis(true);
    try {
      const totalSales = businessState.sales_data.reduce((sum, item) => sum + item.sales, 0);
      const totalTransactions = businessState.sales_data.reduce((sum, item) => sum + item.transactions, 0);

      const hasProfile = !!activeProfile;

      const response = await fetch('/api/analysis-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: activeProfile?.id || null,
          business_name: businessName,
          business_type: businessType,
          input_source: lastInputPayload?.fileData ? 'file' : (lastInputPayload?.textInput ? 'text' : 'demo'),
          uploaded_file_name: lastInputPayload?.fileName || '',
          raw_input_summary: lastInputPayload?.textInput || 'Analisis Multimodal Gambar/Berkas',
          ai_result: businessState,
          health_score: businessState.health_score,
          total_sales: totalSales,
          total_transactions: totalTransactions,
          top_products: businessState.top_products,
          inventory_alerts: businessState.alerts,
          customer_sentiment: businessState.customer_reviews_summary?.[0]?.sentiment || 'neutral',
          customer_reviews_summary: businessState.customer_reviews_summary || [],
          action_plan: businessState.action_plan
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setIsUnsavedAnalysis(false);
        setIsDemoActive(false);
        setIsEmptyState(false);
        setBannerType('info');
        if (hasProfile) {
          setErrorBanner('✓ Sertifikasi Analisis Bisnis berhasil dipreservasi ke pangkalan Riwayat Analisis!');
        } else {
          setErrorBanner('✓ Analisis tersimpan! Lengkapi Business Profile di tab Settings agar riwayat analisis lebih terstruktur & terhubung.');
        }
        setTimeout(() => setErrorBanner(null), 8000);
      } else {
        throw new Error(result.error || 'Server rejected creation of history item.');
      }
    } catch (err: any) {
      console.error(err);
      setBannerType('error');
      setErrorBanner(err.message || 'Gagal tersambung ke penyimpanan database backend.');
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  // Applies an existing, chosen analysis log to the current live dashboard state
  const handleApplyHistoryRecord = (record: AnalysisHistoryRecord) => {
    setBusinessState(record.ai_result);
    setBusinessName(record.business_name);
    setBusinessType(record.business_type);
    setIsDemoActive(false);
    setIsEmptyState(false);
    setIsUnsavedAnalysis(false);
    setActiveTab('overview');

    setBannerType('info');
    setErrorBanner(`✓ Berhasil memuat data historis untuk: ${record.business_name}`);
    setTimeout(() => {
      setErrorBanner(null);
    }, 4500);
  };

  // Multimodal query poster
  const handleAnalyzeData = async (payload: {
    fileData?: string;
    fileName?: string;
    fileType?: string;
    textInput?: string;
    businessType: string;
  }) => {
    setIsLoading(true);
    setErrorBanner(null);
    
    // Auto shift to AI Analyzer tab so the user can see the animated Reasoning ThinkingFeed progress logs!
    setActiveTab('ai_analyzer');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setBusinessState(result.data);
        setIsUnsavedAnalysis(true); // Tag as unsaved so prompt to save appears on Overview tab
        setLastInputPayload(payload); // Preserve user input parameters
        setIsDemoActive(false);
        setIsEmptyState(false);
        setBannerType('info');
        setErrorBanner(`Co-Pilot sukses menganalisis data untuk bisnis ${payload.businessType}! Dasbor & Rencana Aksi Harian diperbarui secara otomatis. Silakan klik "Simpan Analisis" untuk menyimpannya permanen.`);
        
        // When analysis succeeds, navigate the user immediately to Overview to admire the regenerated Health Index, alerts, and graphs!
        setActiveTab('overview');

        setTimeout(() => {
          setErrorBanner(null);
        }, 8000);
      } else {
        setBannerType('error');
        setErrorBanner(result.error || 'Terjadi kesalahan analisis di server. Mohon periksa setup API key Anda.');
      }
    } catch (err: any) {
      console.error(err);
      setBannerType('error');
      setErrorBanner(
        err?.message || 'Gagal terhubung ke analatik backend. Pastikan server dev terhubung secara lokal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdated = (profile: BusinessProfile) => {
    setActiveProfile(profile);
    setBusinessName(profile.business_name);
    setBusinessType(profile.business_type || 'F&B Cafe');
    setLocation(profile.location || '');
    setCurrency(profile.currency || 'IDR');
    setIsEmptyState(false);
  };

  // Switch-tab router rendering logic
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab 
            businessState={businessState} 
            onReset={handleResetDemo}
            setActiveTab={setActiveTab}
            businessName={businessName}
            isUnsavedAnalysis={isUnsavedAnalysis}
            onSaveAnalysis={handleSaveAnalysis}
            isSavingAnalysis={isSavingAnalysis}
            isDemoActive={isDemoActive}
            isEmptyState={isEmptyState}
            hasProfile={!!activeProfile}
          />
        );
      case 'sales':
        return <SalesAnalyticsTab businessState={businessState} />;
      case 'inventory':
        return (
          <InventoryTab 
            businessState={businessState} 
            onUpdateProducts={handleUpdateProducts}
          />
        );
      case 'customer':
        return <CustomerInsightsTab businessState={businessState} />;
      case 'action_plan':
        return (
          <ActionPlanTab 
            businessState={businessState} 
            onUpdateActionItems={handleUpdateActionItems}
          />
        );
      case 'ai_analyzer':
        return <AIAnalyzerTab onAnalyze={handleAnalyzeData} isLoading={isLoading} />;
      case 'history':
        return (
          <AnalysisHistoryPage 
            onApplyToDashboard={handleApplyHistoryRecord}
            setActiveTab={setActiveTab}
          />
        );
      case 'reports':
        return <ReportsTab setActiveTab={setActiveTab} />;
      case 'settings':
        return (
          <SettingsTab 
            onProfileUpdated={handleProfileUpdated}
            isBackendHealthy={isBackendHealthy}
            onCheckHealth={checkBackendHealth}
          />
        );
      default:
        return (
          <OverviewTab 
            businessState={businessState} 
            onReset={handleResetDemo}
            setActiveTab={setActiveTab}
            businessName={businessName}
            isUnsavedAnalysis={isUnsavedAnalysis}
            onSaveAnalysis={handleSaveAnalysis}
            isSavingAnalysis={isSavingAnalysis}
            isDemoActive={isDemoActive}
            isEmptyState={isEmptyState}
          />
        );
    }
  };

  if (sharedAnalysisId) {
    if (isSharedLoading) {
      return (
        <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-10 h-10 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Memuat sertifikasi riset UMKM...</p>
        </div>
      );
    }

    if (sharedError || !sharedRecord) {
      return (
        <div className="min-h-screen bg-[#070913] text-slate-105 flex flex-col items-center justify-center p-6 space-y-6 text-center">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-2xl">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-base font-bold text-slate-100">Laporan Tidak Ditemukan</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Sertifikat Laporan Bisnis dengan ID "{sharedAnalysisId}" tidak ditemukan atau telah dideaktivasi oleh pemilik ritel. Silakan periksa kembali tautan rujukan Anda.
            </p>
          </div>
          <a
            href="/"
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Pusat Dasbor Utama &rarr;
          </a>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#070913] py-8 sm:py-12 p-4">
        <div className="max-w-[1010px] mx-auto space-y-4 no-print text-left">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs select-none">
              &larr; Beranda Utama BizPilot AI
            </a>
            <span className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2.5 py-1 rounded-full uppercase">
              Tautan Publik Laporan
            </span>
          </div>
        </div>
        <div className="mt-6">
          <ReportPreview record={sharedRecord} hideBackButton={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans selection:bg-indigo-550 selection:text-white">
      
      {/* Glow decorative graphics */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Sticky Header Topbar */}
      <Topbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        businessName={businessName}
        location={location}
        onResetDemo={handleResetDemo}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Main Layout wrapper: Sidebar Left + Content block Right */}
      <div className="max-w-7xl mx-auto flex z-10 relative">
        
        {/* Sidebar Nav */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          businessName={businessName}
          businessType={businessType}
        />

        {/* Content Panel Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Dynamic Toast Alerts Banner */}
          <AnimatePresence>
            {errorBanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`border p-4.5 rounded-3xl backdrop-blur-md shadow-lg flex items-start gap-3.5 text-left relative overflow-hidden ${
                  bannerType === 'error'
                    ? 'bg-rose-950/25 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-900/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {bannerType === 'error' ? (
                    <AlertCircle className="w-5.5 h-5.5 text-rose-450" />
                  ) : (
                    <CheckCircle className="w-5.5 h-5.5 text-emerald-405 text-emerald-400" />
                  )}
                </div>
                
                <div className="flex-grow space-y-1 pr-6">
                  <h4 className="font-semibold text-sm">
                    {bannerType === 'error' ? 'Sistem Terkendala' : 'Informasi Co-Pilot'}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {errorBanner}
                  </p>
                  {bannerType === 'error' && errorBanner.includes('GEMINI_API_KEY') && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-black/40 border border-slate-800 text-slate-400 text-[11px] font-mono leading-relaxed">
                      <span className="text-[#6366f1] font-bold">Langkah Pemulihan:</span> Buka panel <span className="font-semibold text-slate-100">Settings &gt; Secrets</span> di bagian pojok kanan atas layar AI Studio Anda. Tambahkan variabel dengan nama <span className="text-slate-100 bg-slate-800 px-1 py-0.5 rounded">GEMINI_API_KEY</span> lalu masukkan kunci API Gemini gratis Anda.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setErrorBanner(null)}
                  className="absolute top-4 right-4 text-xs font-mono opacity-60 hover:opacity-100 hover:text-indigo-400 transition"
                >
                  Tutup
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Tab Component Content */}
          <div className="min-h-[60vh] space-y-6">
            {isDemoActive && activeTab !== 'overview' && activeTab !== 'settings' && activeTab !== 'ai_analyzer' && activeTab !== 'history' && (
              <div className="p-4 rounded-3xl bg-[#121622]/50 border border-slate-850 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      Demo Data Terpasang
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Visualisasi halaman ini menampilkan data simulasi toko (Kopi Selaras). Mulai komputasi audit AI Anda sekarang!
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('ai_analyzer')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
                >
                  Unggah Data Riil &rarr;
                </button>
              </div>
            )}
            {renderTabContent()}
          </div>

        </main>
      </div>

      {/* Cohesive Footer */}
      <footer className="border-t border-slate-900 bg-[#04060e] py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 opacity-65">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="font-bold tracking-widest text-[#6366f1] text-[10px] uppercase">BizPilot AI Dashboard v1.2</span>
        </div>
        <p className="font-sans max-w-md opacity-80 leading-relaxed text-[11px]">
          The Autonomous Business Chief Operating Officer platform for Indonesian UMKM (Mikro, Kecil, dan Menengah).
        </p>
        <p className="font-mono mt-2 opacity-40 text-[10px]">
          © 2026 BizPilot AI. Precision-engineered for operational intelligence.
        </p>
      </footer>

    </div>
  );
}
