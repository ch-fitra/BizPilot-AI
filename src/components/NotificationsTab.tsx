import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Send, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  Filter, 
  CheckCheck,
  ToggleLeft,
  ToggleRight,
  Info,
  Loader2,
  Calendar,
  Layers,
  Phone,
  ArrowRight
} from 'lucide-react';
import { NotificationRecord, WhatsAppLog } from '../types/notification';
import { AutomationRule } from '../types/automation';
import { NotificationService } from '../services/notificationService';

interface NotificationsTabProps {
  businessState?: any;
  setActiveTab?: (tab: string) => void;
}

export default function NotificationsTab({ businessState, setActiveTab }: NotificationsTabProps) {
  const currency = businessState?.profile?.currency || 'IDR';
  const businessId = businessState?.profile?.id || null;
  const businessName = businessState?.profile?.name || 'UMKM Kita';

  // State Management
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'rules' | 'composer' | 'logs'>('inbox');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  
  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Filters
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'crm' | 'inventory' | 'action_plan'>('all');

  // WhatsApp Composer Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [msgType, setMsgType] = useState('follow_up');
  const [msgTone, setMsgTone] = useState('friendly');
  const [itemName, setItemName] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [composedMessage, setComposedMessage] = useState('');

  // Rules creation
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRuleType, setNewRuleType] = useState('lead_overdue');
  const [newRuleThreshold, setNewRuleThreshold] = useState(2);
  const [newRuleSendWA, setNewRuleSendWA] = useState(false);

  // Load all initial data
  useEffect(() => {
    fetchMainData();
  }, [businessId]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchMainData = async () => {
    setIsLoading(true);
    try {
      const allNotifs = await NotificationService.getNotifications(businessId);
      setNotifications(allNotifs);

      const allRules = await NotificationService.getAutomationRules(businessId);
      setRules(allRules);

      const allLogs = await NotificationService.getWhatsAppLogs(businessId);
      setLogs(allLogs);
    } catch (err: any) {
      console.error('Error fetching Phase 7 notifications systems:', err);
      showToast('Gagal memuat beberapa basis data CRM & Notifikasi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSweep = async () => {
    setIsActionLoading(true);
    try {
      const refreshedNotifs = await NotificationService.triggerSweep(businessId);
      setNotifications(refreshedNotifs);
      showToast('Sinkronisasi sales pipeline & stok kritis berhasil diselesaikan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan audit live sweep', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? updated : n));
    } catch (err: any) {
      showToast('Gagal menandai dibaca: ' + err.message, 'error');
    }
  };

  const handleMarkAllRead = async () => {
    setIsActionLoading(true);
    try {
      await NotificationService.markAllAsRead(businessId);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
      showToast('Semua notifikasi ditandai dibaca.', 'success');
    } catch (err: any) {
      showToast('Gagal menandai semua dibaca', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Peringatan dihapus.', 'info');
    } catch (err: any) {
      showToast('Gagal menghapus notifikasi', 'error');
    }
  };

  // Rule activation update
  const handleToggleRule = async (id: string, currentActive: boolean) => {
    try {
      const updated = await NotificationService.updateAutomationRule(id, { is_active: !currentActive });
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      showToast(`Rule otomatisasi berhasil ${!currentActive ? 'DIASYIKKAN (Aktif)' : 'DINONAKTIFKAN'}.`, 'info');
    } catch (err: any) {
      showToast('Gagal mutasi aturan otomatisasi', 'error');
    }
  };

  // Rule thresholds update
  const handleUpdateThresholdValue = async (id: string, val: number) => {
    try {
      const updated = await NotificationService.updateAutomationRule(id, {
        trigger_config: { threshold_value: val }
      });
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      showToast(`Batas ambang kriteria berhasil disesuaikan ke: ${val}`, 'success');
    } catch (err: any) {
      showToast('Gagal mengubah angka kriteria', 'error');
    }
  };

  // Create rule
  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rule = await NotificationService.createAutomationRule({
        business_id: businessId,
        rule_type: newRuleType,
        is_active: true,
        trigger_config: { threshold_value: Number(newRuleThreshold) },
        action_config: { send_whatsapp: newRuleSendWA, notify_dashboard: true }
      });
      setRules(prev => [...prev, rule]);
      setIsCreatingRule(false);
      showToast('Aturan otomatisasi operasional pintar baru berhasil ditambahkan.', 'success');
    } catch (err: any) {
      showToast('Gagal membuat aturan', 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus skema otomasi ini?')) {
      try {
        await NotificationService.deleteAutomationRule(id);
        setRules(prev => prev.filter(r => r.id !== id));
        showToast('Atuan otomasi dicabut.', 'info');
      } catch (err: any) {
        showToast('Gagal menghapus', 'error');
      }
    }
  };

  // Trigger quick composer preset from notification metadata
  const handleTriggerFollowUp = (notif: NotificationRecord) => {
    if (!notif.metadata) return;
    
    setRecipientName(notif.metadata.lead_name || '');
    setRecipientPhone(notif.metadata.phone || '');
    setMsgType('follow_up');
    setMsgTone('friendly');
    
    if (notif.metadata.estimated_value) {
      setDealAmount(notif.metadata.estimated_value.toString());
    }
    setExtraInstructions(`Lakukan re-followup karena jadwal terlambat ${notif.metadata.overdue_days || 1} hari.`);
    
    // Auto-generate instant draft template
    const draft = `Halo Kak ${notif.metadata.lead_name || ''}! 😊 Sapa hangat dari tim *${businessName}*.\n\nKak, mau nanya santai nih terkait rencana pesanan ${notif.metadata.product_name ? '*' + notif.metadata.product_name + '*' : 'kemarin'}. Hubungi kami lho Kak jika ada yang mengganjal agar bisa kami jadwalkan pengantaran cepat! Terima kasih banyak!`;
    setComposedMessage(draft);
    
    setActiveSubTab('composer');
    showToast('Formulir draf WhatsApp berhasil disiapkan otomatis.', 'info');
  };

  const handleTriggerInventoryAlertMsg = (notif: NotificationRecord) => {
    if (!notif.metadata) return;
    setRecipientName('Supplier ' + (notif.metadata.product_name || 'Bahan'));
    setRecipientPhone('');
    setMsgType('reorder_reminder');
    setMsgTone('formal');
    setItemName(notif.metadata.product_name || '');
    setExtraInstructions(`Kami butuh pengiriman cepat karena stok tersisa kritis ${notif.metadata.current_stock || 0} unit.`);

    const draft = `Selamat Siang Bapak/Ibu Supplier,\n\nKami dari *${businessName}* mengabarkan bahwa persediaan untuk produk *${notif.metadata.product_name || 'bahan'}* di gudang kami tersisa kritis (${notif.metadata.current_stock || 0} unit).\n\nMohon bantuannya untuk mengonfirmasi ketersediaan pasokan re-order dan menjadwalkan armada pengiriman secepat mungkin. Terima kasih banyak atas kerja samanya. 🙏`;
    setComposedMessage(draft);

    setActiveSubTab('composer');
    showToast('Form draf Supplier restock berhasil disiapkan otomatis.', 'info');
  };

  // AI draft message generation
  const handleGenerateAIMessage = async () => {
    if (!recipientName) {
      showToast('Mohon masukkan nama penerima terlebih dahulu', 'error');
      return;
    }
    setIsActionLoading(true);
    try {
      const generated = await NotificationService.generateAIMessage({
        type: msgType,
        tone: msgTone,
        customerName: recipientName,
        businessName: businessName,
        itemName: itemName,
        amount: dealAmount,
        extraDetails: extraInstructions
      });
      setComposedMessage(generated);
      showToast('Kecerdasan Buatan (AI) berhasil mendraf pesan profesional untuk Anda!', 'success');
    } catch (err: any) {
      showToast('AI gagal merancang draf, menggunakan draf standard', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // WhatsApp send dispatcher
  const handleSendFormattedWhatsApp = async () => {
    if (!recipientPhone) {
      showToast('Mohon isi nomor WhatsApp tujuan', 'error');
      return;
    }
    if (!composedMessage) {
      showToast('Silakan isi pesan yang akan dikirim', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const result = await NotificationService.sendWhatsApp({
        recipient: recipientPhone,
        message: composedMessage,
        business_id: businessId
      });

      if (result.success) {
        showToast('WhatsApp log tercatat! ' + result.message, 'success');
        
        // Reload logs list
        const refreshedLogs = await NotificationService.getWhatsAppLogs(businessId);
        setLogs(refreshedLogs);
        
        // Clear phone / msg
        setRecipientPhone('');
        setComposedMessage('');
        setRecipientName('');
        setItemName('');
        setDealAmount('');
        setExtraInstructions('');
      } else {
        showToast('Gagal memproses WA: ' + result.message, 'error');
      }
    } catch (err: any) {
      showToast('Exception mengirim WhatsApp: ' + err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyMessage = () => {
    if (!composedMessage) return;
    navigator.clipboard.writeText(composedMessage);
    showToast('Pesan berhasil disalin ke clipboard!', 'success');
  };

  // Filtering notifications logic
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'all') return true;
    if (notifFilter === 'unread') return n.status === 'unread';
    if (notifFilter === 'crm') return n.type === 'crm_followup';
    if (notifFilter === 'inventory') return n.type === 'inventory_alert';
    if (notifFilter === 'action_plan') return n.type === 'action_plan';
    return true;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && n.status === 'unread').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 select-none text-slate-100">
      
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
            Notification Center & WhatsApp Automation 
            <span className="px-2.5 py-1 text-[9px] bg-indigo-505/15 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono font-bold uppercase tracking-wider animate-pulse">
              Phase 7 Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem asisten otonom kelola follow-up pelanggan, mitigasi stok habis, pengingat action plan, serta broadcast promo instan dengan integrasi engine draf drafing WhatsApp ditenagai AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation mode indicator */}
          <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] sm:text-[11px] text-amber-300 font-mono font-bold flex items-center gap-2 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            Simulation Mode Active
          </div>

          <button
            onClick={handleRunSweep}
            disabled={isActionLoading}
            className="p-2 sm:px-3.5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Klik untuk men-scan data leads & stok kritis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Scaning Audit</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-2xl border transition z-50 text-xs shadow-xl flex items-center gap-2 max-w-xl mx-auto ${
          toast.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-350' :
          toast.type === 'error' ? 'bg-rose-950/40 border-rose-500/30 text-rose-350' :
          'bg-slate-950 border-slate-800 text-indigo-350'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 2. Top-Level Stats Summary Widget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Total Alerts */}
        <div className="p-4 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left h-[115px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold">Inbox Menunggu</span>
            <Bell className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-left">
            <h3 className="text-xl md:text-2xl font-bold">{notifications.length}</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">{unreadCount} pesan belum dibaca</p>
          </div>
        </div>

        {/* Card 2: Critical Alerts */}
        <div className="p-4 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left h-[115px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold">Kritis Alams</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-left">
            <h3 className={`text-xl md:text-2xl font-bold ${criticalCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>{criticalCount}</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Butuh keputusan operasional</p>
          </div>
        </div>

        {/* Card 3: Active Automations */}
        <div className="p-4 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left h-[115px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold">Otomasi Berjalan</span>
            <Settings className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-left">
            <h3 className="text-xl md:text-2xl font-bold">{rules.filter(r => r.is_active).length} Rules</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Berjalan di sistem harian</p>
          </div>
        </div>

        {/* Card 4: WhatsApp Log Count */}
        <div className="p-4 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left h-[115px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold">Terkirim logs</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-left">
            <h3 className="text-xl md:text-2xl font-bold">{logs.length} Log</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Transmisi sukses disimpan</p>
          </div>
        </div>

      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-slate-850 flex flex-wrap gap-2 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveSubTab('inbox')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeSubTab === 'inbox' ? 'border-indigo-500 text-indigo-400 bg-slate-950/30' : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-950/10'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notification Box ({unreadCount})
        </button>
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeSubTab === 'rules' ? 'border-indigo-500 text-indigo-400 bg-slate-950/30' : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-950/10'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Automation Rules
        </button>
        <button
          onClick={() => setActiveSubTab('composer')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeSubTab === 'composer' ? 'border-indigo-500 text-indigo-400 bg-slate-950/30' : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-950/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-455" />
          AI WhatsApp Composer
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeSubTab === 'logs' ? 'border-indigo-500 text-indigo-400 bg-slate-950/30' : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-950/10'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          WhatsApp Delivery Logs
        </button>
      </div>

      {/* Sub-Tab 1: INBOX */}
      {activeSubTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-start">
          
          {/* Notifications List Side (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter buttons toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#121622]/40 border border-slate-850 rounded-2xl text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 select-none">Filter Box:</span>
                <div className="flex gap-1">
                  {(['all', 'unread', 'crm', 'inventory', 'action_plan'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setNotifFilter(f)}
                      className={`px-2 py-1 rounded transition select-none cursor-pointer capitalize font-bold ${
                        notifFilter === f ? 'bg-indigo-600 border border-indigo-500/20 text-slate-50' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {f === 'crm' ? 'CRM Follow-up' : f === 'action_plan' ? 'Action Plan' : f}
                    </button>
                  ))}
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isActionLoading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition select-none border-none bg-transparent cursor-pointer"
                >
                  Mark All Read
                </button>
              )}
            </div>

            {/* Notifications Cards Loop */}
            {filteredNotifications.length === 0 ? (
              <div className="py-24 border border-dashed border-slate-850 rounded-2xl bg-[#0c0f18]/40 text-center max-w-xl mx-auto p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Tidak Ada Notifikasi Cocok</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                    Semua sistem berjalan lancar! Klik tombol 'Sinkronisasi Live Audit' di sudut kanan atas untuk mengecek perubahan status CRM atau stok ketersediaan terik.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const isUnread = notif.status === 'unread';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => isUnread && handleMarkRead(notif.id)}
                      className={`p-4.5 rounded-2xl border transition relative flex items-start gap-4 cursor-pointer text-left ${
                        isUnread 
                          ? 'bg-[#141a2d]/80 border-indigo-500/30 hover:border-indigo-500/50 shadow-md shadow-indigo-950/10' 
                          : 'bg-[#121622]/40 border-slate-850/60 hover:border-slate-800'
                      }`}
                    >
                      {/* Priority left dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                        notif.priority === 'critical' ? 'bg-rose-500 animate-ping' :
                        notif.priority === 'high' ? 'bg-amber-500' :
                        notif.priority === 'medium' ? 'bg-cyan-500' :
                        'bg-slate-600'
                      }`} title={`Prioritas: ${notif.priority}`} />

                      {/* Content column */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className={`text-xs font-black truncate ${isUnread ? 'text-slate-50' : 'text-slate-350'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[9.5px] font-mono font-medium text-slate-500">
                            {notif.created_at ? new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans select-text">
                          {notif.message}
                        </p>

                        {/* Custom actions embedded inside notification for CRM/Inventory */}
                        <div className="flex items-center gap-2 pt-2 text-[10.5px]">
                          {notif.type === 'crm_followup' && notif.metadata && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTriggerFollowUp(notif); }}
                              className="px-3 py-1 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/10 text-white font-black rounded-lg transition-all"
                            >
                              Buat Draf WhatsApp
                            </button>
                          )}

                          {notif.type === 'inventory_alert' && notif.metadata && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTriggerInventoryAlertMsg(notif); }}
                              className="px-3 py-1 bg-rose-650 hover:bg-rose-600 border border-rose-500/10 text-white font-black rounded-lg transition-all"
                            >
                              Hubungi Supplier
                            </button>
                          )}

                          {isUnread && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                              className="px-2.5 py-1 bg-[#1c243d] hover:bg-[#253051] text-slate-300 font-bold rounded-lg border border-slate-800 transition text-[10px]"
                            >
                              Selesai / Tandai Dibaca
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDeleteNotif(notif.id, e)}
                            className="p-1 px-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="Hapus permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Timeline / Activity Feed Sidebar on right (1 column) */}
          <div className="p-4 bg-[#121622] border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Sistem Alur Waktu (Logs Feed)
            </h3>

            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
              Urutan audit operasional otonom dari pemicu Rule Otomatisasi yang mendeteksi pipeline CRM harian.
            </p>

            <div className="relative border-l border-slate-800 pl-4 space-y-6 pt-2">
              {notifications.slice(0, 5).map((n) => (
                <div key={'timeline_' + n.id} className="relative text-xs">
                  {/* Circle dot marker */}
                  <span className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border bg-[#0b0e16] ${
                    n.status === 'unread' ? 'border-indigo-500 bg-indigo-505 bg-indigo-600' : 'border-slate-700 bg-slate-900'
                  }`} />
                  
                  <div className="space-y-1 text-left">
                    <span className="text-[8.5px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                    <span className="font-bold text-slate-300 block text-[11px] truncate">{n.title}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{n.message}</span>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="py-8 text-center text-[10px] text-slate-600 font-mono">
                  Belum ada data alur
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Sub-Tab 2: RULES CONFIGRATION */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6 text-left">
          
          <div className="flex justify-between items-center bg-[#121622]/40 border border-slate-850 p-4.5 rounded-2xl flex-col sm:flex-row gap-3">
            <div>
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-400" />
                Daftar Otomasi Operasional Aktif
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                BizPilot memonitor trigger logic di bawah secara terjadwal untuk mentransmisikan peringatan closing prospek atau restock bahan mentah.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingRule(true)}
              className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white font-black rounded-lg text-xs flex items-center gap-1.5 transition select-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Aturan Baru
            </button>
          </div>

          {/* Trigger rules creating form if toggled */}
          {isCreatingRule && (
            <form onSubmit={handleCreateRuleSubmit} className="p-5 border border-indigo-500/20 bg-[#121622]/80 rounded-2xl max-w-xl text-left space-y-4 font-sans animate-fadeIn">
              <h4 className="font-bold text-xs text-indigo-400 font-mono uppercase tracking-wider">Tambah Aturan Otomasi Pintar</h4>
              
              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Kategori Trigger Logic</label>
                <select 
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="lead_overdue">Lead Overdue (Keterlambatan Prospek)</option>
                  <option value="stock_critical">Stock Critical (Ketersediaan Stok Gudang)</option>
                  <option value="lead_score_high">High Lead Score Alert (Prospek Panas AI)</option>
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">
                  {newRuleType === 'lead_overdue' ? 'Batas Keterlambatan (Dalam Jumlah Hari)' : 
                   newRuleType === 'stock_critical' ? 'Batas Stok Minimum (Dalam Jumlah Unit)' : 
                   'Batas Minimum Skor AI (Skala 0-100)'}
                </label>
                <input 
                  type="number"
                  required
                  value={newRuleThreshold}
                  onChange={(e) => setNewRuleThreshold(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs">
                <input 
                  type="checkbox"
                  id="notifSendWACheck"
                  checked={newRuleSendWA}
                  onChange={(e) => setNewRuleSendWA(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 bg-[#0b0e16] border-slate-800 rounded cursor-pointer"
                />
                <label htmlFor="notifSendWACheck" className="text-slate-350 cursor-pointer font-medium">
                  Kirim draf WhatsApp otomatis ke simulator log saat terpicu
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/10 text-white font-black rounded-lg text-xs transition"
                >
                  Simpan Aturan
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingRule(false)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 hover:text-slate-200 rounded-lg text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Rules rendering list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rules.map((rule) => {
              const ruleTypeName = 
                rule.rule_type === 'lead_overdue' ? 'Overdue Lead Tracer' :
                rule.rule_type === 'stock_critical' ? 'Stok Gudang Kritis' :
                'High Deal AI Potential';

              const ruleDescription = 
                rule.rule_type === 'lead_overdue' ? `Buat alarm dashboard jika ada prospek CRM tidak disentuh selama >= ${rule.trigger_config.threshold_value || 1} hari.` :
                rule.rule_type === 'stock_critical' ? `Buat visual peringatan restock segera jika ada bahan murni di bawah <= ${rule.trigger_config.threshold_value ?? 10} unit.` :
                `Klasifikasikan menjadi prospek VIP/panas jika evaluasi closing-score AI >= ${rule.trigger_config.threshold_value || 80}%.`;

              const thresholdUnit = 
                rule.rule_type === 'lead_overdue' ? 'Hari' :
                rule.rule_type === 'stock_critical' ? 'Unit' :
                '%';

              return (
                <div 
                  key={rule.id}
                  className="p-5 rounded-2xl bg-[#121622] border border-slate-850/80 hover:border-slate-800 flex flex-col justify-between text-left h-[230px]"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 bg-indigo-505/10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono font-bold uppercase rounded">
                        {rule.rule_type}
                      </span>
                      
                      {/* Active switch slider */}
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                        className="text-slate-400 hover:text-indigo-400 transition"
                      >
                        {rule.is_active ? (
                          <ToggleRight className="w-8 h-8 text-indigo-400 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
                        )}
                      </button>
                    </div>

                    <h4 className="font-black text-xs text-slate-200 pt-1 leading-normal">
                      {ruleTypeName}
                    </h4>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                      {ruleDescription}
                    </p>
                  </div>

                  <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between mt-auto">
                    {/* Adjustable parameter field */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500 font-mono">Batas:</span>
                      <input 
                        type="number" 
                        value={rule.trigger_config.threshold_value ?? 0}
                        onChange={(e) => handleUpdateThresholdValue(rule.id, Math.max(1, Number(e.target.value)))}
                        className="w-11 px-1 py-0.5 bg-[#0b0e16] border border-slate-800 rounded text-center text-[10px] font-mono font-bold text-slate-200 focus:border-indigo-500 outline-none" 
                      />
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">{thresholdUnit}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 px-1.5 border border-slate-850 bg-slate-950/40 hover:bg-rose-500/10 hover:border-rose-550 hover:border-rose-500/20 text-slate-600 hover:text-rose-400 transition rounded-lg text-[10px] cursor-pointer"
                      title="Hapus Rule"
                    >
                      Cabut Rule
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Sub-Tab 3: AI WHATSAPP COMPOSER */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left items-start">
          
          {/* Form setup panel (3 columns) */}
          <div className="lg:col-span-3 p-5 bg-[#121622] border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              Asisten Pembuat Draf Pesan WA Pintar
            </h3>
            
            <p className="text-[10.5px] text-slate-500 leading-normal">
              Isi parameter di bawah, lalu klik 'Kancing Draf dengan AI' untuk merumuskan draf pesan instan siap kirim yang disesuaikan kultur Indonesia.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Nama Pelanggan / Prospek</label>
                <input 
                  type="text" 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Misal: Bapak Anto"
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-455 text-slate-400 block font-bold">Nomor WhatsApp Penerima</label>
                <input 
                  type="text" 
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Bermula 08... atau 62..."
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs font-mono outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Kategori Aktivitas</label>
                <select 
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
                >
                  <option value="follow_up">CRM Follow-Up (Kawal Penawaran)</option>
                  <option value="payment_reminder">Payment Reminder (Tagih Kiriman Uang)</option>
                  <option value="simple_promo">Simple Promo (Tawarkan Diskon Weekend)</option>
                  <option value="closing_negotiation">Closing Price (Negosiasi Closing)</option>
                  <option value="retention">Customer Retention (Sapa Kembali)</option>
                  <option value="reorder_reminder">Re-order Supply (Pesan kembali)</option>
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Gaya Tone Obrolan</label>
                <select 
                  value={msgTone}
                  onChange={(e) => setMsgTone(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
                >
                  <option value="friendly">Friendly Kakak/Agan (Sangat Ramah) 🥰</option>
                  <option value="formal">Formal Bapak/Ibu (Baku Profesional) 💼</option>
                  <option value="persuasive">Persuasive Urgensi (Menarik & Mendesak) 🔥</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Nama Item Detail Barang (Opsional)</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Misal: Paket Kopi Arabika Robusta"
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-450 block font-bold">Rencana Nilai Rupiah (Opsional)</label>
                <input 
                  type="number" 
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  placeholder="Misal: 4500000"
                  className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs font-mono outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-450 block font-bold">Instruksi Tambahan (Opsional)</label>
              <textarea 
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Misal: Katakan bahwa slot kiriman gokil hanya tersisa untuk besok pagi saja..."
                rows={2}
                className="w-full p-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateAIMessage}
                disabled={isActionLoading}
                className="px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-slate-50 font-black rounded-xl text-xs flex items-center gap-1.5 transition select-none cursor-pointer shadow-lg shadow-indigo-950/20"
              >
                <Sparkles className="w-4 h-4 animate-spin-pulse" />
                Rancang Pesan dengan AI
              </button>

              {composedMessage && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Teks
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExtraInstructions(prev => prev + ' Buat pesannya jauh lebih pendek dan santai.');
                      showToast('Instruksi pemangkasan pesan ditambahkan, silakan generate kembali', 'info');
                    }}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-[#181d2f] text-indigo-400 border border-slate-800 hover:border-indigo-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    Minta AI Persingkat
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Interactive Mobile Chat Preview Visual (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Visual Preview WhatsApp</span>

            {/* Mobile body structure */}
            <div className="border border-slate-800 bg-[#070b12] rounded-3xl overflow-hidden p-[11.5px] max-w-sm mx-auto shadow-2xl relative">
              
              {/* Top speaker header bar */}
              <div className="h-4 w-28 bg-[#070b12] border-b border-x border-slate-800 rounded-b-xl absolute top-0 left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2" />
                <div className="w-10 h-0.5 rounded bg-slate-850" />
              </div>

              {/* Chat App View Screen */}
              <div className="bg-[#0b1019] rounded-2xl overflow-hidden min-h-[380px] flex flex-col pt-4 relative bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(#075e54, #128c7e)' }}>
                
                {/* Visual Top Info bar */}
                <div className="p-3.5 bg-[#075e54]/90 border-b border-teal-900/40 flex items-center gap-2.5 text-left text-white">
                  <div className="w-8 h-8 rounded-full bg-teal-800 border border-teal-600/40 flex items-center justify-center font-bold text-xs">
                    {recipientName ? recipientName.substring(0,2).toUpperCase() : 'WA'}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs truncate max-w-[140px]">{recipientName || 'Masukkan Kontak'}</h5>
                    <span className="text-[9px] text-teal-200 block truncate">Online - BizPilot Chatbot</span>
                  </div>
                </div>

                {/* Chat Bubble Body Scroll */}
                <div className="flex-1 p-3 flex flex-col justify-end space-y-2.5">
                  
                  {composedMessage ? (
                    <div className="p-3 bg-emerald-900/90 border border-emerald-700/30 rounded-2xl text-left text-slate-100 max-w-[85%] self-end relative shadow-lg">
                      <p className="text-[10.5px] whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {composedMessage}
                      </p>
                      
                      {/* Double green double ticks representing deliver status */}
                      <div className="flex justify-end items-center gap-1 text-[8.5px] text-emerald-300 mt-1.5 font-mono">
                        <span>{new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[10px] text-teal-100/60 font-mono italic max-w-xs mx-auto">
                      Belum ada pesan dirancang... Silakan klik 'Rancang Pesan dengan AI'
                    </div>
                  )}

                </div>

                {/* Bottom interactive message inputs */}
                <div className="p-2.5 bg-teal-950/40 border-t border-teal-900/35 flex gap-2">
                  <div className="flex-1 bg-slate-950/80 border border-teal-900/30 rounded-xl px-2.5 py-1.5 text-[10.5px] text-teal-100 text-left select-text line-clamp-1 truncate select-none opacity-40">
                    {recipientPhone ? `Tujuan WA: ${recipientPhone}` : 'Ketik pesan Anda...'}
                  </div>
                  
                  <button
                    onClick={handleSendFormattedWhatsApp}
                    disabled={isActionLoading || !composedMessage || !recipientPhone}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-50 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Kirim pesan langsung ke WhatsApp simulator"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* Sub-Tab 4: DELIVERY LOGS HISTORY */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#0b0e16] border border-slate-850 rounded-2xl overflow-hidden text-left select-none">
          
          <div className="p-4 bg-[#121622] border-b border-slate-850">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Riwayat Pengiriman Pesan WhatsApp (Logs)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Catatan transmisi pesan otomatis atau manual yang dikirimkan melalui BizPilot AI.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-350 select-text">
              <thead className="bg-[#121622] border-b border-slate-850 text-slate-400 font-mono text-[10.5px]">
                <tr>
                  <th className="py-4 px-5">Waktu / Tanggal</th>
                  <th className="py-4 px-4">WhatsApp Tujuan</th>
                  <th className="py-4 px-4">Pesan Transmisi</th>
                  <th className="py-4 px-4 text-center">Gateway Provider</th>
                  <th className="py-4 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans text-xs">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500 font-mono text-[11px]">
                      Belum ada pesan dikirimkan ke log.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#121622]/40 transition">
                      <td className="py-3.5 px-5 font-mono text-[10.5px] text-slate-400 shrink-0">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : ''}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-200">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{log.recipient}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[280px] select-text">
                        <p className="line-clamp-2 leading-relaxed" title={log.message}>
                          {log.message}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-350 text-[10px] uppercase font-bold">
                          {log.provider === 'simulation' ? '💻 Simulator Model' : log.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold font-mono ${
                          log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
