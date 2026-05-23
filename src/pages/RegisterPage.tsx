import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Mail, Lock, User, Building, Landmark, MapPin, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, error } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('F&B Cafe');
  const [location, setLocation] = useState('Jakarta, Indonesia');
  const [currency, setCurrency] = useState('IDR');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    if (!fullName || !email || !password) {
      setLocalErr('Harap lengkapi seluruh kolom akun pengguna.');
      return;
    }
    if (password.length < 6) {
      setLocalErr('Kata sandi harus minimal 6 karakter.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);

    if (!businessName) {
      setLocalErr('Nama Usaha/Bisnis harus diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await register({
        email,
        password,
        fullName,
        businessName,
        businessType,
        location,
        currency
      });

      if (success) {
        window.location.hash = '#/';
      }
    } catch (err: any) {
      setLocalErr(err.message || 'Pendaftaran gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 mb-3 border border-emerald-500/10 shadow-lg shadow-emerald-500/5">
            <Sparkles className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Daftar Akun BizPilot SaaS</h2>
          <p className="mt-2 text-sm text-slate-400">
            {step === 1 ? 'Langkah 1: Hubungkan Akun Pengguna Anda' : 'Langkah 2: Selesaikan Profil Onboarding Bisnis'}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className={`h-1.5 w-10 rounded-full transition-all ${step === 1 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          <div className={`h-1.5 w-10 rounded-full transition-all ${step === 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
        </div>

        {(error || localErr) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error || localErr}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Bisnis</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="budi@kopiselaras.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-all border border-slate-700 text-sm mt-6 cursor-pointer"
            >
              <span>Lanjutkan Setup Bisnis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Nama Usaha / Bisnis</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Kopi Selaras Cilandak"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Jenis Usaha</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">T</span>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all text-sm appearance-none"
                  >
                    <option value="F&B Cafe">F&B Cafe / Restoran</option>
                    <option value="Toko Kelontong">Toko Kelontong</option>
                    <option value="Fashion Retail">Fashion Retail</option>
                    <option value="Klinik Kecantikan">Klinik Kecantikan</option>
                    <option value="Jasa Logistik">Jasa Logistik</option>
                    <option value="General Store">Usaha Dagang Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Mata Uang</label>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all text-sm appearance-none"
                  >
                    <option value="IDR">Rupiah (IDR)</option>
                    <option value="USD">Dolar AS (USD)</option>
                    <option value="SGD">Dolar Sing (SGD)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Lokasi Utama</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Jakarta Selatan, Indonesia"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 flex items-center justify-center space-x-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-sm cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>Selesaikan Pendaftaran</span>
                    <Sparkles className="h-4 w-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs">
          <span className="text-slate-500">Sudah memiliki akun? </span>
          <a href="#/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Masuk ke Sistem
          </a>
        </div>
      </div>
    </div>
  );
};
