import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Building2, ChevronDown, Check, Plus, Landmark, MapPin, X, Loader2, Award } from 'lucide-react';

export const WorkspaceSwitcher: React.FC = () => {
  const { currentWorkspace, workspaces, switchWorkspace, createNewWorkspace } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Fashion Retail');
  const [location, setLocation] = useState('Jakarta, Indonesia');
  const [currency, setCurrency] = useState('IDR');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      setErrorText('Nama Bisnis wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorText(null);
    try {
      const added = await createNewWorkspace({
        businessName,
        businessType,
        location,
        currency
      });

      if (added) {
        setModalOpen(false);
        setBusinessName('');
      } else {
        setErrorText('Gagal membuat bisnis baru');
      }
    } catch (err: any) {
      setErrorText(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentWorkspace) return null;

  const roleLabel = (currentWorkspace.role || 'owner').toUpperCase();

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-1.5 px-3.5 rounded-xl text-slate-100 transition-all select-none cursor-pointer text-sm"
      >
        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold text-xs leading-none text-slate-100 max-w-[140px] truncate">
            {currentWorkspace.business_name}
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-[9px] px-1 bg-slate-800 text-slate-300 font-mono rounded tracking-wider uppercase border border-slate-700/50">
              {roleLabel}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
            Workspace Bisnis Anda
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 my-1">
            {workspaces.map(w => {
              const isActive = w.id === currentWorkspace.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    switchWorkspace(w.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors hover:bg-slate-800/80 ${isActive ? 'bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-medium' : 'text-slate-300'}`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate text-[13px]">{w.business_name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{w.business_type || 'Retail'}</div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-800 mt-2 pt-2">
            <button
              onClick={() => {
                setModalOpen(true);
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 p-2 rounded-xl text-xs bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 transition-colors font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Bisnis Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal - Tambah Bisnis Baru */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white">Buat Workspace Bisnis Baru</h3>
              <p className="text-xs text-slate-400 mt-1">Multi-tenant BizPilot memungkinkan Anda memantau bermacam-macam cabang atau bisnis lain terisolasi di satu akun.</p>
            </div>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {errorText}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Bisnis / Toko</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Selaras Kemang"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jenis Usaha</label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="F&B Cafe">F&B Cafe / Coffee Shop</option>
                  <option value="Toko Kelontong">Toko Kelontong</option>
                  <option value="Fashion Retail">Butik / Fashion Retail</option>
                  <option value="Klinik Kecantikan">Klinik Kecantikan</option>
                  <option value="Jasa Logistik">Jasa Logistik / Ekspedisi</option>
                  <option value="General Store">Usaha Tradisional / Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lokasi Utama</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mata Uang</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD ($)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 font-semibold transition-all shadow-lg text-xs mt-6 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>Buat Workspace Bisnis</span>
                    <Plus className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WorkspaceSwitcher;
