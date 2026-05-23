import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  MapPin, 
  Coins, 
  Server, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  HelpCircle,
  User,
  Phone,
  Mail,
  FileText,
  Database,
  Undo2,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { BusinessProfileService } from '../services/businessProfileService';
import { BusinessProfile, StorageMode } from '../types/analysis';
import { fetchSecurityStatus, SecurityStatus } from '../utils/securityStatus';
import { getClientEvents } from '../utils/errorHandler';

interface SettingsTabProps {
  onProfileUpdated: (profile: BusinessProfile) => void;
  isBackendHealthy: boolean;
  onCheckHealth: () => Promise<void>;
}

export default function SettingsTab({
  onProfileUpdated,
  isBackendHealthy,
  onCheckHealth
}: SettingsTabProps) {
  
  // Base states for profile fields
  const [profileId, setProfileId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('F&B Cafe');
  const [ownerName, setOwnerName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [currency, setCurrency] = useState<string>('IDR');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Diagnostic states
  const [storageMode, setStorageMode] = useState<StorageMode>('Local JSON');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);
  const [isSchemaMissing, setIsSchemaMissing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [checkingApi, setCheckingApi] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [clientEventsCount, setClientEventsCount] = useState<number>(0);

  // Keep a copy of original database state for "Reset Form" functionality
  const [originalRecord, setOriginalRecord] = useState<BusinessProfile | null>(null);
  const [isCopyingSql, setIsCopyingSql] = useState<boolean>(false);

  const handleCopyCombinedSqlSchema = async () => {
    setIsCopyingSql(true);
    try {
      const res = await BusinessProfileService.getCombinedSchema();
      if (res.success && res.sql) {
        await navigator.clipboard.writeText(res.sql);
        alert('Sukses! Gabungan seluruh skema migrasi SQL (001-004) berhasil disalin ke clipboard Anda.\n\nSilakan buka SQL Editor di dashboard Supabase Anda, tempel (pasted) kodenya di sana, lalu klik tombol RUN.');
      } else {
        alert('Gagal mengambil gabungan SQL schema.');
      }
    } catch (err: any) {
      alert('Gagal menyalin DDL skema: ' + err.message);
    } finally {
      setIsCopyingSql(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await BusinessProfileService.getActiveProfile();
      setStorageMode(response.storageMode);
      setIsSupabaseConfigured(response.isSupabaseConfigured);
      setIsSchemaMissing(!!response.isSchemaMissing);
      
      if (response.data) {
        setOriginalRecord(response.data);
        applyProfileToState(response.data);
      } else {
        // No profile exists yet
        setOriginalRecord(null);
        setBusinessName('');
        setBusinessType('F&B Cafe');
        setOwnerName('');
        setLocation('');
        setCurrency('IDR');
        setPhone('');
        setEmail('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to load profile settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyProfileToState = (profile: BusinessProfile) => {
    setProfileId(profile.id);
    setBusinessName(profile.business_name || '');
    setBusinessType(profile.business_type || 'F&B Cafe');
    setOwnerName(profile.owner_name || '');
    setLocation(profile.location || '');
    setCurrency(profile.currency || 'IDR');
    setPhone(profile.phone || '');
    setEmail(profile.email || '');
    setDescription(profile.description || '');
  };

  useEffect(() => {
    fetchProfile();
    fetchSecurityStatus()
      .then((status) => setSecurityStatus(status))
      .catch((err) => console.warn('Failed to load security status:', err));
    setClientEventsCount(getClientEvents().length);
  }, []);

  const handleResetForm = () => {
    if (originalRecord) {
      applyProfileToState(originalRecord);
      triggerSuccessMessage('Formulir berhasil dikembalikan ke data tersimpan.');
    } else {
      setBusinessName('');
      setBusinessType('F&B Cafe');
      setOwnerName('');
      setLocation('');
      setCurrency('IDR');
      setPhone('');
      setEmail('');
      setDescription('');
      triggerSuccessMessage('Formulir berhasil dikosongkan.');
    }
  };

  const triggerSuccessMessage = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      alert('Nama Usaha wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        business_name: businessName,
        business_type: businessType,
        owner_name: ownerName || undefined,
        location: location || undefined,
        currency,
        phone: phone || undefined,
        email: email || undefined,
        description: description || undefined
      };

      let result;
      if (profileId) {
        result = await BusinessProfileService.updateProfile(profileId, payload);
      } else {
        result = await BusinessProfileService.createProfile(payload);
      }

      if (result.success && result.data) {
        setProfileId(result.data.id);
        setOriginalRecord(result.data);
        applyProfileToState(result.data);
        onProfileUpdated(result.data);
        triggerSuccessMessage('✓ Profil bisnis berhasil diperbarui secara permanen di database!');
      } else {
        throw new Error(result.error || 'Server error saving profile.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan profil: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHealthCheck = async () => {
    setCheckingApi(true);
    await onCheckHealth();
    setTimeout(() => {
      setCheckingApi(false);
    }, 500);
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-5.5 h-5.5 text-indigo-400" />
          Konfigurasi & Pengaturan Profil Bisnis
        </h2>
        <p className="text-xs text-slate-400 mt-1 pb-2 border-b border-slate-900">
          Kelola parameter otonom, data identitas, dan sistem integrasi penyimpanan MSME BizPilot AI Anda.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Memuat profil bisnis & status database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Profile Editor (7 columns) */}
          <div className="lg:col-span-7 bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 relative">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Kelola Identitas Usaha Permanen
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-sans">
              
              {/* Input Name & Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Nama Usaha / Tenant <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Selaras Cilandak"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Nama Pemilik (Owner)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Selector Type & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono">Tipe Bidang Industri</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-2.5 py-2.5 text-slate-355 text-xs cursor-pointer focus:outline-none text-slate-200"
                  >
                    <option value="F&B Cafe">☕ F&B Cafe / Kedai Kopi</option>
                    <option value="Retail Fashion">👚 Retail Fashion / Butik</option>
                    <option value="Laundry Services">🧺 Laundry Kiloan / Jasa Cuci</option>
                    <option value="Grocery Store">🛒 Toko Kelontong / Sembako</option>
                    <option value="Culiner Local">🥗 Kuliner / Warung Makan</option>
                    <option value="General Service">⚡ Jasa Lainnya / Umum</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    Domisili Wilayah / Kota
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta Selatan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Contact Information (Phone & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: +62 812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Alamat Email Bisnis
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: kontak@bisnisanda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5 text-left">
                <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-indigo-400" />
                  Mata Uang Finansial
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-2.5 py-2.5 text-slate-355 text-xs cursor-pointer focus:outline-none text-slate-200"
                >
                  <option value="IDR">Rupiah Indonesia (Rp / IDR)</option>
                  <option value="USD">Dolar Amerika Serikat ($ / USD)</option>
                  <option value="SGD">Dolar Singapura (S$ / SGD)</option>
                </select>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5 text-left">
                <label className="block font-semibold text-slate-400 font-mono flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Deskripsi / Profil Usaha Singkat
                </label>
                <textarea
                  rows={3}
                  placeholder="Gambarkan model usaha Anda agar AI memberikan saran taktis yang lebih terkalibrasi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Form Actions and Success Notifications */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-850">
                <div className="flex-grow text-left">
                  {saveSuccess && (
                    <span className="text-emerald-400 font-semibold block text-xs animate-fadeIn">
                      {saveSuccess}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2.5 self-end">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-400 hover:text-white font-semibold transition flex items-center justify-center gap-1.5"
                    title="Batalkan perubahan formulir"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 border border-indigo-550 text-white font-bold transition flex items-center justify-center gap-1.5 shadow"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Profil Usaha'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Diagnostic Safeguard Panel (5 columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#121622]/90 border border-slate-850 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-550/5 rounded-full filter blur-[32px] pointer-events-none" />
            
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Integrasi Database & Node
              </h3>

              {/* Status 1: Storage Mode Indicator Table */}
              <div className="space-y-3">
                
                <div className="p-4 rounded-2xl bg-[#0a0d16] border border-slate-800 text-left space-y-2.5">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">Mode Penyimpanan Aktif</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {storageMode}
                    </span>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 block leading-relaxed pt-1.5 border-t border-slate-900 leading-relaxed font-sans">
                    {isSupabaseConfigured 
                      ? '✓ Database Cloud PostgreSQL terpasang penuh. Informasi profil, log data analisis, dan relasi multi-tabel disimpan aman di Supabase.'
                      : 'ℹ Berjalan dalam mode local fallback. Semua profil serta tumpukan riwayat analisis disimpan ke memory file lokal serverside (history.json).'}
                  </span>
                   {/* Status 2: Supabase Connection Badge */}
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-900 flex justify-between items-center gap-3">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Konektivitas Supabase</span>
                    <span className="text-xs font-bold text-slate-300 block">
                      {isSupabaseConfigured ? (isSchemaMissing ? 'MISSING SCHEMA' : 'CONNECTED') : 'UNCONFIGURED'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg ${
                    isSupabaseConfigured 
                      ? (isSchemaMissing ? 'bg-amber-500/10 border border-amber-500/30 text-amber-450 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-emerald-400')
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-450 text-amber-400'
                  }`}>
                    {isSupabaseConfigured ? (isSchemaMissing ? 'MIGRATE SQL' : 'SUPABASE') : 'LOCAL CACHE'}
                  </span>
                </div>

                {isSupabaseConfigured && isSchemaMissing && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-550/40 text-amber-300 space-y-2.5 text-left">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider font-mono">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      Tabel Belum Terbentuk di Supabase
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                      Kredensial Supabase Anda sudah terkonfigurasi, namun tabel 
                      <code className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded font-mono ml-1">business_profiles</code>,
                      <code className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded font-mono ml-1">analysis_histories</code>, dll. belum terbentuk di database.
                    </p>
                    <div className="text-[10.5px] bg-[#0a0d16]/70 p-3.5 rounded-xl text-slate-400 space-y-2.5 font-mono">
                      <div className="text-slate-300 font-bold font-sans">Cara Mengatasi Instan:</div>
                      <div>
                        1. Klik tombol di bawah ini untuk menyalin seluruh kode SQL skema BizPilot (001 s.d. 004) sekaligus:
                        <button
                          type="button"
                          onClick={handleCopyCombinedSqlSchema}
                          disabled={isCopyingSql}
                          className="mt-2 w-full py-2 px-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/30 border-none"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                          {isCopyingSql ? 'Menyalin...' : 'Salin Gabungan SQL Skema (Combined DDL)'}
                        </button>
                      </div>
                      <div className="pt-1">
                        2. Buka dashboard proyek Supabase Anda, lalu pilih menu <span className="text-indigo-400 font-bold font-sans">SQL Editor</span>.
                      </div>
                      <div>
                        3. Buat Query baru (<span className="text-indigo-400 font-semibold font-sans">New Query</span>), lalu tempel (<span className="text-indigo-400 font-bold font-mono">Paste / Ctrl+V</span>) kode SQL yang baru saja Anda salin.
                      </div>
                      <div>
                        4. Klik tombol <span className="text-emerald-400 font-bold font-sans">Run</span> (atau tekan Cmd/Ctrl + Enter) untuk membuat seluruh tabel.
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        setCheckingApi(true);
                        try {
                          const res = await BusinessProfileService.recheckSchema();
                          setStorageMode(res.storageMode);
                          setIsSupabaseConfigured(res.isSupabaseConfigured);
                          setIsSchemaMissing(!!res.isSchemaMissing);
                          if (!res.isSchemaMissing && res.storageMode === 'Supabase PostgreSQL') {
                            alert('Sukses! Skema database Supabase terdeteksi. Sistem telah beralih ke cloud sync secara otomatis.');
                          } else {
                            alert('Tabel database masih belum ditemukan. Harap pastikan script DDL migrasi di SQL Editor Supabase Anda sudah selesai di-execute.');
                          }
                        } catch (err: any) {
                          alert('Gagal memproses verifikasi skema: ' + err.message);
                        } finally {
                          setCheckingApi(false);
                        }
                      }}
                      className="w-full mt-1.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-emerald-500/15 border border-amber-550/30 hover:border-emerald-500/30 text-amber-200 hover:text-emerald-400 font-black transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingApi ? 'animate-spin' : ''}`} />
                      Pindai Ulang Skema Database
                    </button>
                  </div>
                )}                </div>

                {/* API Health panel */}
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  isBackendHealthy 
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-950/10 border-rose-500/20 text-rose-300'
                }`}>
                  {isBackendHealthy ? (
                    <CheckCircle className="w-5 h-5 text-emerald-450 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-left">
                    <span className="font-bold block">
                      {isBackendHealthy ? 'Gemini AI API Status: Hub Terkoneksi' : 'Kunci API Gemini Belum Dikonfigurasi'}
                    </span>
                    <p className="text-[11px] leading-relaxed opacity-85">
                      {isBackendHealthy 
                        ? 'Robot asisten Gemini 3.5 siap memproses data visual / teks dalam hitungan detik.'
                        : 'Backend belum mendeteksi kunci API privat GEMINI_API_KEY. Mohon konfigurasikan kunci rahasia Anda di secrets panel.'}
                    </p>
                  </div>
                </div>

                {securityStatus && (
                  <div className="p-4 rounded-2xl bg-[#0a0d16] border border-slate-800 text-left space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                          Security & Runtime Mode
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg border ${
                        securityStatus.valid
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        {securityStatus.valid ? 'READY' : 'LIMITED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">AI</span>
                        <p className="text-xs font-bold text-slate-200 mt-1">
                          {securityStatus.modes.ai === 'enabled' ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">WhatsApp</span>
                        <p className="text-xs font-bold text-slate-200 mt-1">
                          {securityStatus.modes.whatsapp === 'live' ? 'Live' : 'Simulation'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-3">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Storage</span>
                        <p className="text-xs font-bold text-slate-200 mt-1">
                          {securityStatus.modes.storage === 'supabase-postgres' ? 'Supabase' : 'Local JSON'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{clientEventsCount} client-side event tersimpan untuk observability lokal.</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Test connection trigger */}
              <button
                onClick={handleHealthCheck}
                disabled={checkingApi}
                className="px-4 py-2.5 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-350 hover:text-white transition font-bold text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingApi ? 'animate-spin' : ''}`} />
                {checkingApi ? 'Melakukan Verifikasi...' : 'Uji Konektivitas Port API'}
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-850 space-y-3.5">
              <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5 leading-none">
                <HelpCircle className="w-4 h-4 text-indigo-400" /> Mengaktifkan Supabase Database
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-450 font-sans text-left">
                Untuk beralih ke database PostgreSQL, konfigurasikan variabel rahasia <span className="font-mono text-indigo-300">SUPABASE_URL</span> dan <span className="font-mono text-indigo-300">SUPABASE_SERVICE_ROLE_KEY</span> di Settings / panel rahasia lingkungan Anda.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
