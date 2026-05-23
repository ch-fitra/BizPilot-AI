import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Percent, 
  Calendar, 
  Sparkles, 
  Grid, 
  List, 
  AlertTriangle, 
  PhoneCall, 
  Building, 
  Mail, 
  Trash2,
  FileSpreadsheet,
  FileText,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CRMLead, CRMDashboardStats } from '../types/crm';
import { CRMService } from '../services/crmService';
import PipelineBoard from './PipelineBoard';
import LeadModal from './LeadModal';
import { useDebouncedValue } from '../utils/performance';
import TableSkeleton from './skeletons/TableSkeleton';

interface CRMTabProps {
  businessState?: any;
  setActiveTab?: (tab: string) => void;
}

export default function CRMTab({ businessState, setActiveTab }: CRMTabProps) {
  const currency = businessState?.profile?.currency || 'IDR';
  const businessId = businessState?.profile?.id || null;

  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [stats, setStats] = useState<CRMDashboardStats>({
    totalLeads: 0,
    hotLeads: 0,
    pendingFollowup: 0,
    closedDeals: 0,
    totalEstimatedRevenue: 0,
    conversionRate: 0,
    upcomingFollowup: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'score'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal control systems
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadCRMData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allLeads = await CRMService.getLeads(businessId);
      setLeads(allLeads);
      
      const dashboardStats = await CRMService.getDashboardStats(businessId);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching CRM Leads in CRMTab:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadCRMData();
  }, [loadCRMData]);

  const handleCreateLead = () => {
    setSelectedLeadId(null);
    setIsModalOpen(true);
  };

  const handleCreateLeadAtStage = (stage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost') => {
    setSelectedLeadId(null);
    setIsModalOpen(true);
    // Modal will naturally handle this or we let LeadModal auto-select the pipelineStage
  };

  const handleEditLead = (id: string) => {
    setSelectedLeadId(id);
    setIsModalOpen(true);
  };

  const handleMoveStage = async (id: string, newStage: 'New Lead' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost') => {
    try {
      await CRMService.updateLead(id, { pipeline_stage: newStage });
      await loadCRMData(); // Reload stats and positions
    } catch (err: any) {
      alert(`Gagal memindahkan tahapan: ${err.message}`);
    }
  };

  const handleDeleteLead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus data prospek ini secara permanen?')) {
      try {
        await CRMService.deleteLead(id);
        await loadCRMData();
      } catch (err: any) {
        alert('Gagal mengapus lead.');
      }
    }
  };

  // Filtering + Sorting computations
  const processedLeads = useMemo(() => leads
    .filter((lead) => {
      const matchSearch = 
        lead.lead_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (lead.notes && lead.notes.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      
      const matchStage = stageFilter === 'all' || lead.pipeline_stage === stageFilter;
      const matchInterest = interestFilter === 'all' || lead.interest_level === interestFilter;

      return matchSearch && matchStage && matchInterest;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.lead_name.localeCompare(b.lead_name);
      } else if (sortBy === 'value') {
        comparison = (a.estimated_value || 0) - (b.estimated_value || 0);
      } else if (sortBy === 'score') {
        comparison = (a.lead_score || 0) - (b.lead_score || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    }), [leads, debouncedSearchTerm, stageFilter, interestFilter, sortBy, sortOrder]);

  // Paginated elements
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = useMemo(
    () => processedLeads.slice(indexOfFirstItem, indexOfLastItem),
    [processedLeads, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.ceil(processedLeads.length / itemsPerPage);

  // Check overdue followups
  const overdueLeads = useMemo(() => leads.filter((l) => {
    if (!l.next_follow_up || l.pipeline_stage === 'Won' || l.pipeline_stage === 'Lost') return false;
    return new Date(l.next_follow_up).getTime() < Date.now();
  }), [leads]);

  // Download simple CSV export representation
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Nama Lead', 'Usaha', 'WA', 'Email', 'Source', 'Stage', 'Deal Value', 'AI Score', 'Suhu', 'Follow up'];
      const rows = leads.map(l => [
        l.id,
        l.lead_name,
        l.company_name || 'Personal',
        l.phone || '',
        l.email || '',
        l.source || '',
        l.pipeline_stage,
        l.estimated_value,
        l.lead_score,
        l.interest_level,
        l.next_follow_up || ''
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `crm_leads_bizpilot_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading CRM CSV:', err);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-1">
      
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
            Sales Pipeline & CRM 
            <span className="px-2.5 py-1 text-[9px] bg-indigo-505/15 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono font-bold uppercase tracking-wider">
              Phase 6
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tingkatkan omzet UMKM Anda dengan asisten otonom kelola leads, pelacakan proses penawaran harga, hitung otomatis skor closing, dan buat draf follow-up WhatsApp instan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:self-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-705 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Ekspor CSV
          </button>
          <button
            onClick={handleCreateLead}
            className="px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Prospek Baru
          </button>
        </div>
      </div>

      {/* 2. Top-Level Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Total Pipelines */}
        <div className="p-4.5 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden h-[120px]">
          <div className="flex justify-between items-center text-slate-450 z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Total Prospek</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 z-10">
            <h3 className="text-xl font-bold text-slate-50">{stats.totalLeads}</h3>
            <p className="text-[9.5px] text-slate-500 mt-0.5">Kontak tercatat</p>
          </div>
        </div>

        {/* Card 2: Hot Leads */}
        <div className="p-4.5 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden h-[120px]">
          <div className="flex justify-between items-center text-slate-450 z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Hot Leads</span>
            <Sparkles className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 z-10">
            <h3 className="text-xl font-bold text-rose-400">{stats.hotLeads}</h3>
            <p className="text-[9.5px] text-slate-500 mt-0.5">Suhu deal tertinggi</p>
          </div>
        </div>

        {/* Card 3: Pending Followup */}
        <div className="p-4.5 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden h-[120px]">
          <div className="flex justify-between items-center text-slate-450 z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Pending Follow-up</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 z-10">
            <h3 className="text-xl font-bold text-amber-400">{stats.pendingFollowup}</h3>
            <p className="text-[9.5px] text-slate-500 mt-0.5">Butuh tanggapan aktif</p>
          </div>
        </div>

        {/* Card 4: Won Conversion */}
        <div className="p-4.5 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden h-[120px]">
          <div className="flex justify-between items-center text-slate-450 z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Deals Won</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 z-10">
            <h3 className="text-xl font-bold text-emerald-400">{stats.closedDeals}</h3>
            <p className="text-[9.5px] text-slate-500 mt-0.5">Pemesanan closing</p>
          </div>
        </div>

        {/* Card 5: Pipeline Revenue Value */}
        <div className="p-4.5 bg-[#121622] border border-slate-850 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden h-[120px] lg:col-span-2">
          <div className="flex justify-between items-center text-slate-450 z-10">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Estimasi Nilai Pipeline</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 z-10">
            <h3 className="text-lg md:text-xl font-black text-cyan-455 font-mono text-cyan-400">
              {currency} {stats.totalEstimatedRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-[9.5px] text-slate-500 mt-0.5">Potensi omzet berjalan</p>
          </div>
        </div>

      </div>

      {/* 3. Follow-up Urgent Warnings Row */}
      {overdueLeads.length > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-300">Peringatan: Keterlambatan Follow-Up Terdeteksi!</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Ada <strong className="text-rose-400">{overdueLeads.length} prospek</strong> dengan jadwal follow-up yang terlewati (Overdue). Segera hubungi prospek ini agar momentum closing tidak hilang.
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setStageFilter('all');
              setSearchTerm('');
              setViewMode('table');
            }}
            className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] font-bold tracking-wide transition shrink-0 select-none cursor-pointer"
          >
            Tinjau Daftar Terlambat
          </button>
        </div>
      )}

      {/* 4. Filter Utilities Toolbar */}
      <div className="bg-[#121622]/80 border border-slate-850/80 p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 select-none">
        
        {/* Toggle + Search left section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          
          {/* Layout Mode switch */}
          <div className="bg-[#0b0e16] p-1 rounded-xl border border-slate-800 flex gap-1 self-start min-w-[120px] text-xs">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                viewMode === 'pipeline' ? 'bg-slate-800 text-slate-200 shadow' : 'text-slate-500 hover:text-slate-350 hover:text-slate-300'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-slate-800 text-slate-200 shadow' : 'text-slate-500 hover:text-slate-350 hover:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabel Leads
            </button>
          </div>

          {/* Search Contacts bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari prospek dari nama, instansi, atau pesan..."
              className="w-full pl-9.5 pl-9 pr-4 py-2.5 bg-[#0b0e16] border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-indigo-500 outline-none transition"
            />
          </div>

        </div>

        {/* Sorting and Selector triggers */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-550 font-medium text-slate-400">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0b0e16] border border-slate-800 rounded-lg text-slate-300 font-bold hover:bg-slate-900 outline-none transition cursor-pointer"
            >
              <option value="all">Sifat Semua</option>
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-550 font-medium text-slate-400">Suhu:</span>
            <select
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0b0e16] border border-slate-800 rounded-lg text-slate-300 font-bold hover:bg-slate-900 outline-none transition cursor-pointer"
            >
              <option value="all">Semua Suhu</option>
              <option value="Cold">❄️ Cold</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Hot">🔥 Hot</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-550 font-medium text-slate-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#0b0e16] border border-slate-800 rounded-lg text-slate-300 font-bold hover:bg-slate-900 outline-none transition cursor-pointer"
            >
              <option value="score">AI Lead Score</option>
              <option value="value">Deal Value</option>
              <option value="name">Abjad Nama</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 border border-slate-800 bg-[#0b0e16] hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

        </div>

      </div>

      {/* 5. Main Content Renderer Box */}
      {isLoading ? (
        <TableSkeleton />
      ) : leads.length === 0 ? (
        
        // Empty State visual representation
        <div className="py-20 border border-dashed border-slate-850 bg-[#0c0f18]/60 rounded-3xl text-center max-w-xl mx-auto p-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto text-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-slate-200 text-sm">CRM Leads Masih Kosong!</h4>
            <p className="text-xs text-slate-450 leading-relaxed">
              Anda belum merekam satupun prospek penjualan. CRM membantu Anda memantau estimasi transaksi, status obrolan, dan mengoptimalkan persentase konversi (Closing-rate).
            </p>
          </div>
          <button
            onClick={handleCreateLead}
            className="px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white font-black text-xs rounded-xl transition cursor-pointer"
          >
            Mulai Tambah Prospek Pertama Anda
          </button>
        </div>

      ) : viewMode === 'pipeline' ? (
        
        // Pipeline Board view layout
        <PipelineBoard
          leads={processedLeads}
          currency={currency}
          onLeadClick={handleEditLead}
          onAddLeadAtStage={handleCreateLeadAtStage}
          onMoveStage={handleMoveStage}
        />

      ) : (

        // Table List view layout with Pagination
        <div className="bg-[#0b0e16] border border-slate-850 rounded-2xl overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-350 select-text">
              <thead className="bg-[#121622] border-b border-slate-850 text-slate-400 font-mono text-[10.5px]">
                <tr>
                  <th className="py-4 px-5">Nama Pelanggan</th>
                  <th className="py-4 px-4">Instansi/Perusahaan</th>
                  <th className="py-4 px-4">Kontak</th>
                  <th className="py-4 px-4">Sumber</th>
                  <th className="py-4 px-4 text-center">Stage</th>
                  <th className="py-4 px-4 text-right">Nilai Deal</th>
                  <th className="py-4 px-4 text-center">Skor AI</th>
                  <th className="py-2 px-2 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ada prospek yang cocok dengan kriteria pencarian/filter di atas.
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((l) => {
                    const hasOverdue = l.next_follow_up && new Date(l.next_follow_up).getTime() < Date.now();
                    return (
                      <tr 
                        key={l.id} 
                        className="hover:bg-[#121622]/40 transition group cursor-pointer"
                        onClick={() => handleEditLead(l.id)}
                      >
                        <td className="py-3.5 px-5 font-bold text-slate-250 truncate max-w-[180px] text-left">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-100 group-hover:text-indigo-400 transition-colors">{l.lead_name}</span>
                              {l.isOfflineDraft && (
                                <span className="px-1.5 py-0 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8.5px] font-bold tracking-tight animate-pulse shrink-0">
                                  Offline
                                </span>
                              )}
                            </div>
                            {hasOverdue && (
                              <span className="text-[8.5px] uppercase text-rose-400 font-mono font-bold">⚠ Overdue follow-up</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]">
                          {l.company_name || <span className="text-slate-600 font-mono text-[10px]">-</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-350 select-all font-mono">
                          {l.phone || l.email || <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9.5px] text-slate-300 rounded font-medium">
                            {l.source || 'Walk-in'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                            l.pipeline_stage === 'Won' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            l.pipeline_stage === 'Lost' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            l.pipeline_stage === 'Negotiation' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                            l.pipeline_stage === 'Qualified' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            l.pipeline_stage === 'Contacted' ? 'bg-indigo-500/10 text-indigo-450 border border-indigo-500/20' :
                            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {l.pipeline_stage === 'New Lead' ? 'New Sapaan' : l.pipeline_stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                          {currency} {Number(l.estimated_value || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded border text-[9.5px] font-bold ${
                            l.lead_score >= 75 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            l.lead_score >= 40 ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          }`}>
                            {l.lead_score} ({l.interest_level})
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditLead(l.id)}
                              className="p-1 px-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-indigo-500/30 text-[9.5px] text-slate-300 hover:text-indigo-400 rounded transition font-bold cursor-pointer flex items-center gap-1"
                            >
                              Detail
                            </button>
                            <button
                              onClick={(e) => handleDeleteLead(e, l.id)}
                              className="p-1 text-slate-600 hover:text-rose-400 transition cursor-pointer"
                              title="Hapus prospek secara permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Table Pagination controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#121622] border-t border-slate-850 flex items-center justify-between gap-4 text-xs font-mono text-slate-400 no-print">
              <span>Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, processedLeads.length)} dari {processedLeads.length} Prospek</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-2 border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-40 rounded-lg transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="p-2 border border-slate-800 bg-[#0b0e16] px-4 rounded-lg font-bold text-slate-100">{currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-2 border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-40 rounded-lg transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      )}

      {/* 6. Lead details & additions creation dialog popup frame */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={selectedLeadId}
        businessId={businessId}
        currency={currency}
        onSaveSuccess={loadCRMData}
      />

    </div>
  );
}
