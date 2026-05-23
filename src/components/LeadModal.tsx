import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Tag, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Save, 
  Trash2, 
  Plus, 
  Loader2,
  Lock,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { CRMLead, CRMActivity } from '../types/crm';
import { CRMService } from '../services/crmService';
import { ChatService } from '../services/chatService';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null; // Null means create mode
  businessId: string | null;
  currency: string;
  onSaveSuccess: () => void;
}

export default function LeadModal({
  isOpen,
  onClose,
  leadId,
  businessId,
  currency,
  onSaveSuccess
}: LeadModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'ai_assistant'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [leadName, setLeadName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [pipelineStage, setPipelineStage] = useState<'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost'>('New Lead');
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [interestLevel, setInterestLevel] = useState<'Cold' | 'Warm' | 'Hot'>('Warm');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [nextFollowUp, setNextFollowUp] = useState('');
  
  // Activities logs state
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [newLogText, setNewLogText] = useState('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  // AI assistant states
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset fields
  const resetForm = () => {
    setLeadName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setSource('');
    setNotes('');
    setPipelineStage('New Lead');
    setEstimatedValue(0);
    setInterestLevel('Warm');
    setTagsInput('');
    setTags([]);
    setNextFollowUp('');
    setActivities([]);
    setNewLogText('');
    setAiResponse(null);
    setErrors({});
    setActiveTab('details');
  };

  useEffect(() => {
    if (isOpen) {
      if (leadId) {
        loadLeadDetails();
      } else {
        resetForm();
      }
    }
  }, [isOpen, leadId]);

  const loadLeadDetails = async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const res = await CRMService.getLeadById(leadId);
      if (res) {
        const { lead, activities: actLogs } = res;
        setLeadName(lead.lead_name);
        setCompanyName(lead.company_name || '');
        setPhone(lead.phone || '');
        setEmail(lead.email || '');
        setSource(lead.source || '');
        setNotes(lead.notes || '');
        setPipelineStage(lead.pipeline_stage);
        setEstimatedValue(Number(lead.estimated_value || 0));
        setInterestLevel(lead.interest_level);
        setTags(lead.tags || []);
        setTagsInput((lead.tags || []).join(', '));
        setActivities(actLogs || []);
        
        // Format next_follow_up date for datetime-local input
        if (lead.next_follow_up) {
          const d = new Date(lead.next_follow_up);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          setNextFollowUp(`${year}-${month}-${day}T${hours}:${mins}`);
        } else {
          setNextFollowUp('');
        }
      }
    } catch (err: any) {
      console.error('Error loading lead detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!tagsInput.trim()) return;
    const items = tagsInput.split(',').map(t => t.trim()).filter(t => t && !tags.includes(t));
    if (items.length > 0) {
      setTags([...tags, ...items]);
    }
    setTagsInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!leadName.trim()) {
      newErrors.lead_name = 'Nama prospek / lead name wajib diisi.';
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Format email tidak valid.';
      }
    }
    if (estimatedValue < 0) {
      newErrors.estimated_value = 'Nilai estimasi (value) tidak boleh kurang dari 0.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    
    // Auto sync from tags input field if not committed with button
    let finalTags = [...tags];
    if (tagsInput.trim()) {
      const items = tagsInput.split(',').map(t => t.trim()).filter(t => t);
      items.forEach(item => {
        if (!finalTags.includes(item)) finalTags.push(item);
      });
    }

    const payload = {
      business_id: businessId,
      lead_name: leadName.trim(),
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      source: source.trim() || null,
      notes: notes.trim() || null,
      pipeline_stage: pipelineStage,
      estimated_value: Number(estimatedValue || 0),
      interest_level: interestLevel,
      tags: finalTags,
      next_follow_up: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      status: 'active'
    };

    try {
      if (leadId) {
        await CRMService.updateLead(leadId, payload);
      } else {
        await CRMService.createLead(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ api: err.message || 'Gagal menyimpan prospek.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActivityLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !newLogText.trim() || isLoggingActivity) return;

    setIsLoggingActivity(true);
    try {
      const res = await CRMService.addActivity(leadId, 'note', newLogText.trim());
      if (res) {
        setActivities([res, ...activities]);
        setNewLogText('');
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleAskAIRecommendedClosing = async (actionType: 'close_strategy' | 'followup_strategy' | 'wa_draft' | 'sales_pitch') => {
    if (!leadId) return;
    setAiResponse(null);
    setIsAiThinking(true);
    
    let userPromptText = '';
    const leadMetaSummary = `Data Lead Prospek:\n- Nama: ${leadName}\n- Perusahaan: ${companyName || 'Personal'}\n- Tahap Pipeline: ${pipelineStage}\n- Nilai Estimasi Kesepakatan: ${currency} ${estimatedValue.toLocaleString('id-ID')}\n- Tingkat Ketertarikan: ${interestLevel}\n- Catatan Opsional Kebutuhan: ${notes || 'Tidak ada catatan khusus'}\n- Hubungan Terakhir: ${activities.length > 0 ? activities[0].notes : 'Belum ada aktivitas terekam.'}`;

    switch (actionType) {
      case 'close_strategy':
        userPromptText = `Bantu saya menganalisis prospek penjualan ini dan berikan rekomendasi strategi otonom taktis untuk melakukan CLOSING penjualan.\n\n${leadMetaSummary}`;
        break;
      case 'followup_strategy':
        userPromptText = `Tolong buatkan taktik follow-up jangka pendek (Langkah 3 hari ke depan) yang ideal untuk melunakkan keraguan prospek ini berdasarkan data yang tercantum.\n\n${leadMetaSummary}`;
        break;
      case 'wa_draft':
        userPromptText = `Buatkan draf template pesan sapaan WhatsApp follow-up yang sopan, bersahabat, tanpa terkesan memaksa (non-pushy), khusus disesuaikan dengan profil pelanggan UMKM saya ini.\n\n${leadMetaSummary}`;
        break;
      case 'sales_pitch':
        userPromptText = `Tolong formulasikan naskah elevator sales pitch (argumen bernilai tinggi) durasi 60 detik untuk membujuk prospek ini agar melakukan pembelian grosir/pemesanan segera.\n\n${leadMetaSummary}`;
        break;
    }

    try {
      // Trigger AI consultation proxy directly via send message
      const res = await ChatService.sendMessage({
        message: userPromptText,
        include_history: false // Single-shot transactional analytical prompt
      });

      if (res.success) {
        setAiResponse(res.reply);
      } else {
        setAiResponse(`⚠️ Gagal memanggil BizPilot AI: ${res.error}`);
      }
    } catch (err: any) {
      setAiResponse(`⚠️ Terjadi gangguan koneksi internet: ${err.message}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleCopyAiResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-[#0b0e17] border border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left"
        id="crm-lead-modal"
      >
        
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-slate-900/60 border-b border-slate-850 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-indigo-400 font-bold">
                {leadId ? `Rincian Prospek # ${leadId.substring(0, 8)}` : 'Tambah Calon Pelanggan Baru (Lead)'}
              </span>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                {leadId ? leadName : 'Form Registrasi Prospek MSME'}
              </h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Tab Section (Only for view/edit mode) */}
        {leadId && (
          <div className="px-6 bg-slate-950/40 border-b border-slate-900 flex gap-4 no-print text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3.5 border-b-2 font-bold px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Detail & Parameter
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3.5 border-b-2 font-bold px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Log Aktivitas ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`py-3.5 border-b-2 font-bold px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ai_assistant' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" />
              Penasihat AI Closing (Co-Pilot)
            </button>
          </div>
        )}

        {/* Modal Body Container with customized scrolling */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs font-mono">Mengunduh portofolio kontak pelanggan...</p>
            </div>
          ) : activeTab === 'details' ? (
            
            <form onSubmit={handleSave} className="space-y-5">
              
              {errors.api && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-medium">
                  {errors.api}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Field 1: Lead Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    Nama Calon Pelanggan <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Contoh: Budi Sudarsono"
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  {errors.lead_name && <p className="text-[10px] text-rose-400 font-mono">{errors.lead_name}</p>}
                </div>

                {/* Field 2: Company / Business name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    Nama Usaha / Instansi / Afiliasi
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: Catering Cempaka Putih (Kosong jika personal)"
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Field 3: Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Nomor WhatsApp / Kontak
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 0812XXXXXXXX"
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Field 4: Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Contoh: budi@gmail.com"
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-rose-400 font-mono">{errors.email}</p>}
                </div>

                {/* Field 5: Estimated deal value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Estimasi Pendapatan Penjualan (Deal Value - Rupiah)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="number"
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(Number(e.target.value))}
                      placeholder="Contoh: 500000"
                      min="0"
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  {errors.estimated_value && <p className="text-[10px] text-rose-400 font-mono">{errors.estimated_value}</p>}
                </div>

                {/* Field 6: Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Sumber Kedatangan Prospek (Source)
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                  >
                    <option value="">-- Isikan Sumber Prospek --</option>
                    <option value="WhatsApp">WhatsApp Chat</option>
                    <option value="Instagram Ads">Instagram / Sosmed Ads</option>
                    <option value="TikTok">TikTok Shop / Video</option>
                    <option value="Google Maps">Pencarian Google Maps</option>
                    <option value="Website Walk-in">Website Hubungi Kami</option>
                    <option value="Referal Partners">Rekomendasi Rekan Kerja</option>
                    <option value="Walk-in Store">Kunjungan Langsung Toko</option>
                  </select>
                </div>

                {/* Field 7: Pipeline Stage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Tahapan Kontak (Pipeline Stage)
                  </label>
                  <select
                    value={pipelineStage}
                    onChange={(e) => setPipelineStage(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition font-extrabold text-indigo-300"
                  >
                    <option value="New Lead">1. New Lead (Sapaan Baru)</option>
                    <option value="Contacted">2. Contacted (Telah Dihubungi)</option>
                    <option value="Qualified">3. Qualified (Kebutuhan Valid)</option>
                    <option value="Negotiation">4. Negotiation (Proses Penawaran)</option>
                    <option value="Won">5. Won (Selesai Deal Closing! 🎉)</option>
                    <option value="Lost">6. Lost (Gagal / Batal 💔)</option>
                  </select>
                </div>

                {/* Field 8: Interest level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Tingkat Ketertarikan (Interest Level / Suhu Prospek)
                  </label>
                  <select
                    value={interestLevel}
                    onChange={(e) => setInterestLevel(e.target.value as any)}
                    className={`w-full px-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-xs focus:border-indigo-500 outline-none transition font-bold ${
                      interestLevel === 'Hot' ? 'text-rose-400' : interestLevel === 'Warm' ? 'text-amber-300' : 'text-cyan-400'
                    }`}
                  >
                    <option value="Cold">❄️ Cold (Respons Rendah / Tanya-tanya)</option>
                    <option value="Warm">🔥 Warm (Potensial / Mempertimbangkan)</option>
                    <option value="Hot">⚡ Hot (Mendesak / Siap Bayar)</option>
                  </select>
                </div>

                {/* Field 9: Next follow up date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Jadwal Follow-Up Berikutnya
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-550" />
                    <input
                      type="datetime-local"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition text-slate-300"
                    />
                  </div>
                </div>

                {/* Field 10: Tags input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Tagifikasi Kategori (Pisahkan dengan koma)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Contoh: B2B, Grosir, Event"
                      className="flex-1 px-4 py-3 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs transition"
                    >
                      Tambah
                    </button>
                  </div>

                  {/* Rendered Tags List */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1 select-none font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-500 hover:text-rose-400 text-[11px] font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Field 11: General notes requirements details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 text-left block">
                  Catatan Kebutuhan Pelanggan / Spesifikasi Detail Pesanan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Isikan rincian permintaan pelanggan, penawaran harga yang ditawar, kuantitas produk, detail pengiriman, dll."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-[#111421] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-900/60 flex justify-end gap-3 no-print">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4.5 py-2.5 bg-slate-900 text-slate-300 border border-slate-850 hover:bg-slate-800/80 rounded-xl transition text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white font-bold rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-indigo-950/20 shadow"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan Prospek
                    </>
                  )}
                </button>
              </div>

            </form>

          ) : activeTab === 'logs' ? (
            
            // Interaction journal log interface
            <div className="space-y-6">
              
              {/* Journal append tool layout */}
              <form onSubmit={handleAddActivityLog} className="bg-[#121622]/90 border border-slate-850 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Catat Memo Interaksi Baru (Call/WhatsApp/Kunjungan)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Mencatat update lisan: Contoh 'Dihubungi via WA, tertarik diskon 10%, minta dikirim sampel besok.'"
                    disabled={isLoggingActivity}
                    className="flex-1 px-4 py-3 bg-[#0a0c13] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:border-indigo-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!newLogText.trim() || isLoggingActivity}
                    className="px-4 bg-indigo-600 hover:bg-indigo-505 bg-indigo-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {isLoggingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Tambah Catatan
                  </button>
                </div>
              </form>

              {/* Historic Journal List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold tracking-wider font-mono text-slate-400 uppercase">
                  Riwayat Catatan Log Aktivitas
                </h4>
                {activities.length === 0 ? (
                  <div className="py-12 border border-dashed border-slate-900 rounded-2xl text-center text-slate-500 text-xs">
                    Belum ada riwayat aktivitas yang dicatat untuk prospek ini. Mulailah mencatat di atas.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 text-xs">
                    {activities.map((act) => {
                      const dateTag = new Date(act.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      // Color tag based on activity context
                      let tagColor = 'bg-slate-800 text-slate-300 border-slate-700';
                      if (act.activity_type === 'status_change') tagColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                      else if (act.activity_type === 'score_update') tagColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                      return (
                        <div key={act.id} className="relative group text-left">
                          
                          {/* Circle dot timeline tag */}
                          <div className={`absolute -left-[22.5px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                            act.activity_type === 'status_change' ? 'bg-indigo-400 border-indigo-500' : 'bg-slate-700 border-[#0b0e17]'
                          }`} />

                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-450 font-mono">
                              {dateTag}
                            </span>
                            <span className={`px-2 py-0.5 text-[8.5px] rounded border font-mono uppercase font-bold shrink-0 ${tagColor}`}>
                              {act.activity_type === 'note' ? 'Memo UMKM' : act.activity_type}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11.5px] leading-relaxed select-text bg-[#121622]/40 p-2.5 rounded-xl border border-slate-900/60 max-w-full">
                            {act.notes}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          ) : (
            
            // AI Assistant Sales Closing Tools tab!
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-900/30 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/15 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                    Penasihat Closing BizPilot AI
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pilih taktik instan di bawah ini untuk menginstruksikan model AI menganalisis kebutuhan prospek <strong className="text-indigo-300 font-extrabold">{leadName}</strong>, lalu merumuskan respon negosiasi terbaik Anda.
                  </p>
                </div>
              </div>

              {/* Action shortcut panel grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
                <button
                  type="button"
                  onClick={() => handleAskAIRecommendedClosing('close_strategy')}
                  className="p-3 bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-900/35 hover:border-indigo-500/25 rounded-xl text-xs text-indigo-300 hover:text-white flex flex-col items-center justify-center text-center gap-2 transition duration-200 cursor-pointer min-h-[90px] font-semibold"
                >
                  <TrendingUp className="w-4.5 h-4.5 animate-pulse text-indigo-400" />
                  <span>Strategi Closing</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAskAIRecommendedClosing('followup_strategy')}
                  className="p-3 bg-violet-950/20 hover:bg-violet-950/40 border border-violet-900/35 hover:border-violet-500/25 rounded-xl text-xs text-violet-300 hover:text-white flex flex-col items-center justify-center text-center gap-2 transition duration-200 cursor-pointer min-h-[90px] font-semibold"
                >
                  <Calendar className="w-4.5 h-4.5 text-violet-400" />
                  <span>Jadwal Follow-Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAskAIRecommendedClosing('wa_draft')}
                  className="p-3 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/35 hover:border-emerald-500/25 rounded-xl text-xs text-emerald-300 hover:text-white flex flex-col items-center justify-center text-center gap-2 transition duration-200 cursor-pointer min-h-[90px] font-semibold"
                >
                  <MessageCircle className="w-4.5 h-4.5 text-emerald-405 text-emerald-400" />
                  <span>Template WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAskAIRecommendedClosing('sales_pitch')}
                  className="p-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/35 hover:border-amber-500/25 rounded-xl text-xs text-amber-300 hover:text-white flex flex-col items-center justify-center text-center gap-2 transition duration-200 cursor-pointer min-h-[90px] font-semibold"
                >
                  <MessageSquare className="w-4.5 h-4.5 text-amber-400" />
                  <span>Naskah Sales Pitch</span>
                </button>
              </div>

              {/* Display response block */}
              {isAiThinking ? (
                <div className="p-10 border border-slate-850 rounded-2xl bg-[#0e121d] flex flex-col items-center justify-center text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-violet-400 animate-spin" />
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-xs font-mono font-bold text-violet-300">Robot Konsultan Penasihat sedang berpikir...</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Menggabungkan deskripsi profil bisnis utama dan catatan riwayat interaksi guna menyusun proposal negosiasi custom.
                    </p>
                  </div>
                </div>
              ) : aiResponse ? (
                <div className="p-5 border border-violet-950/40 rounded-2xl bg-[#0d101a] space-y-3 relative text-left group">
                  
                  {/* Floating helper copy to clipboard */}
                  <div className="absolute right-4 top-4 no-print">
                    <button
                      onClick={handleCopyAiResponse}
                      className="p-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-450 hover:text-white text-xs rounded-xl flex items-center gap-1 transition-colors font-mono cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Salin Teks
                        </>
                      )}
                    </button>
                  </div>

                  <span className="text-[9px] font-mono uppercase bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded text-violet-300 font-bold">
                    Rencana Rekomendasi Otonom BizPilot
                  </span>

                  <div className="text-slate-200 text-xs leading-relaxed space-y-2.5 pt-2.5 font-sans whitespace-pre-line border-t border-slate-900/60 break-words select-text">
                    {/* Render AI text formatting lists simple fallback */}
                    {aiResponse}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-900/65 flex flex-wrap items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>Target Analitik: Close conversion</span>
                    <span>Saran bersifat otonom dan mematuhi kaidah guardrail bisnis Indonesia</span>
                  </div>

                </div>
              ) : (
                <div className="py-14 border border-dashed border-slate-850 rounded-2xl text-center text-slate-550 text-xs max-w-md mx-auto">
                  Belum ada usulan taktik dimuat. Klik pintasan bernuansa ungu di atas untuk mulai memformulasikan draf closing yang mutakhir bagi kesepakatan dagang Anda.
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
