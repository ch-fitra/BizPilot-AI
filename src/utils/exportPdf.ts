import { jsPDF } from 'jspdf';
import { AnalysisHistoryRecord } from '../types/analysis';

/**
 * Format currency helper
 */
const formatCurrency = (value: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Clean string for filenames
 */
export const getSafeFilename = (bizName: string, dateStr: string, extension: string) => {
  const cleanName = bizName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const cleanDate = dateStr.split('T')[0];
  return `bizpilot-report-${cleanName}-${cleanDate}.${extension}`;
};

export const exportReportToPdf = (record: AnalysisHistoryRecord) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = 20;

  // Helper for text drawing and auto-paging
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawFooter(); // Add footer on new page
    }
  };

  const drawFooter = () => {
    const pageCount = doc.internal.pages.length - 1;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`BizPilot AI - Intelligent Analytics Report - Halaman ${pageCount}`, margin, pageHeight - 10);
    doc.text('Generasi Otonom oleh Kecerdasan Buatan', pageWidth - margin - 60, pageHeight - 10);
  };

  const drawHeaderBlock = () => {
    // Top banner styling (Navy background)
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(margin, y, contentWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BIZPILOT AI', margin + 6, y + 9);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 255);
    doc.text('Asisten Operasional Otonom & Analisis Bisnis MSME', margin + 6, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const dateFormatted = new Date(record.created_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Waktu Analisis: ${dateFormatted}`, pageWidth - margin - 80, y + 11);
    doc.text(`Report ID: ${record.analysis_id.substring(0, 16)}...`, pageWidth - margin - 80, y + 16);

    y += 32;
  };

  // Setup initial footer & headers
  drawFooter();
  drawHeaderBlock();

  // SECTION 1: BUSINESS PROFILE
  checkPageBreak(50);
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 31, 'F');
  
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('I. PROFIL IDENTITAS BISNIS', margin + 5, y + 6);
  doc.line(margin + 5, y + 8, margin + 80, y + 8);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nama Usaha  : ${record.business_name}`, margin + 5, y + 14);
  doc.text(`Kategori     : ${record.business_type}`, margin + 5, y + 20);
  doc.text(`Mata Uang    : IDR (Rupiah)`, margin + 100, y + 14);
  doc.text(`Sumber Data  : Input ${record.input_source === 'file' ? 'Berkas Unggahan' : 'Manual Teks'}`, margin + 100, y + 20);
  doc.text(`Nama File    : ${record.uploaded_file_name || 'N/A (Teks Langsung)'}`, margin + 5, y + 26);
  y += 40;

  // SECTION 2: EXECUTIVE SUMMARY & SCORE
  checkPageBreak(65);
  doc.setFillColor(255, 255, 255);
  
  // Health score box representation
  const score = record.health_score;
  const risk = record.risk_level;

  let scoreBg = [16, 185, 129]; // emerald green as default
  if (score < 50) scoreBg = [239, 68, 68]; // red
  else if (score < 70) scoreBg = [245, 158, 11]; // amber

  doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
  doc.rect(margin, y, 40, 35, 'F');

  // Draw Score details inside
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(String(score), margin + 20, y + 15, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text('INDEKS KESEHATAN', margin + 20, y + 23, { align: 'center' });
  doc.text('BISNIS (0-100)', margin + 20, y + 28, { align: 'center' });

  // Executive summary points
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('II. RINGKASAN EKSEKUTIF & EVALUASI', margin + 48, y + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Kategori Risiko   : ${risk}`, margin + 48, y + 13);
  doc.text(`Jumlah Penjualan  : ${formatCurrency(record.total_sales, 'IDR')}`, margin + 48, y + 19);
  doc.text(`Total Transaksi   : ${record.total_transactions} kali transaksi`, margin + 48, y + 25);

  let summaryText = record.raw_input_summary || '';
  if (summaryText.length > 180) {
    summaryText = summaryText.substring(0, 180) + '...';
  }
  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8);
  doc.text(`Pengantar Audit: "${summaryText}"`, margin + 48, y + 31, { maxWidth: contentWidth - 48 });

  y += 45;

  // STRENGTHS, RISKS, PRIORITY RECS
  checkPageBreak(50);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 40, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EVALUASI KONDISI STRATEGIS:', margin + 4, y + 6);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`• Kekuatan Utama Usaha  : Kinerja produk andalan stabil dengan marjin sehat.`, margin + 5, y + 13, { maxWidth: contentWidth - 10 });
  doc.text(`• Risiko Operasional     : Keberlangsungan pasokan inventori kritis & ulasan negatif pelayanan.`, margin + 5, y + 21, { maxWidth: contentWidth - 10 });
  
  const recText = record.action_plan?.[0]?.task || 'Monitor pergerakan kas harian dan tinjau ulasan pelanggan secara berkala.';
  doc.text(`• Rekomendasi Utama      : ${recText}`, margin + 5, y + 29, { maxWidth: contentWidth - 10 });
  y += 48;

  // SECTION 3: SALES PERFORMANCE
  checkPageBreak(65);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('III. KINERJA PENJUALAN & TREN INDUSTRI', margin, y);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);
  y += 8;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Berdasarkan data audit, total omzet usaha tercatat sebesar ${formatCurrency(record.total_sales, 'IDR')} dengan rerata nilai transaksi harian sebesar ${record.total_transactions > 0 ? formatCurrency(Math.round(record.total_sales / record.total_transactions), 'IDR') : 'IDR 0'} per pembelian.`, margin, y, { maxWidth: contentWidth });
  y += 11;

  // Draw TOP PRODUCTS Table Header
  checkPageBreak(40);
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Nama Item Produk', margin + 4, y + 5);
  doc.text('Kategori', margin + 55, y + 5);
  doc.text('Stok', margin + 95, y + 5);
  doc.text('Volume Terjual', margin + 115, y + 5);
  doc.text('Pendapatan', margin + 145, y + 5);
  y += 7;

  // Top products rows
  doc.setFont('Helvetica', 'normal');
  const prods = record.top_products || [];
  if (prods.length > 0) {
    prods.slice(0, 4).forEach((p: any) => {
      checkPageBreak(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(p.name || p.product_name || 'N/A', margin + 4, y + 5);
      doc.text(p.category || 'N/A', margin + 55, y + 5);
      doc.text(String(p.stock ?? p.stock_level ?? 0), margin + 95, y + 5);
      doc.text(String(p.sold ?? p.total_sold ?? 0), margin + 115, y + 5);
      doc.text(formatCurrency(p.revenue ?? p.earnings ?? 0, 'IDR'), margin + 145, y + 5);
      
      // Bottom thin border
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);
      y += 7.5;
    });
  } else {
    doc.text('Tidak ada data produk yang terdeteksi dalam laporan ini.', margin + 4, y + 5);
    y += 8;
  }
  y += 5;

  // SECTION 4: INVENTORY & SUPPLY CHAIN ALERTS
  checkPageBreak(50);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('IV. INTELLIGENT LOGISTICS & INVENTORY STATUS', margin, y);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);
  y += 8;

  const alerts = record.inventory_alerts || [];
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  if (alerts.length > 0) {
    doc.text('Identifikasi kritis logistik mendeteksi beberapa stok yang mendekati ambang batas minimum:', margin, y);
    y += 6;
    alerts.forEach((alert: string) => {
      checkPageBreak(10);
      doc.setFillColor(254, 243, 199); // light orange background
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setTextColor(180, 83, 9);
      doc.setFont('Helvetica', 'bold');
      doc.text(`[PERINGATAN] ${alert}`, margin + 3, y + 4.5, { maxWidth: contentWidth - 6 });
      y += 7;
    });
    doc.setTextColor(15, 23, 42);
  } else {
    doc.text('Seluruh sediaan logistik terpantau dalam tingkat aman. Ketersediaan bahan baku di atas ambang batas kritis.', margin, y);
    y += 8;
  }
  y += 5;

  // SECTION 5: CUSTOMER SENTIMENT & REVIEWS ASPECT
  checkPageBreak(50);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('V. REPUTASI PELAYANAN & OUTLOOK KONSUMEN', margin, y);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);
  y += 8;

  const sentiment = typeof record.customer_sentiment === 'string' 
    ? record.customer_sentiment 
    : (record.customer_sentiment?.sentiment || 'Neutral');
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Indikator Utama Sentimen Publik adalah: ${sentiment.toUpperCase()}`, margin, y);
  y += 6;

  // Aspect table headers
  checkPageBreak(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Aspek Topik Keluhan', margin + 4, y + 5);
  doc.text('Tingkat Kepuasan', margin + 65, y + 5);
  doc.text('Jumlah Feedback', margin + 115, y + 5);
  y += 7;

  doc.setFont('Helvetica', 'normal');
  if (record.customer_reviews_summary && record.customer_reviews_summary.length > 0) {
    record.customer_reviews_summary.slice(0, 3).forEach((r: any) => {
      checkPageBreak(10);
      doc.text(r.topic || r.aspect || 'N/A', margin + 4, y + 5);
      doc.text(r.satisfaction || r.rating || 'N/A', margin + 65, y + 5);
      doc.text(String(r.count || r.mentions || 0) + ' kali disebut', margin + 115, y + 5);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);
      y += 7.5;
    });
  } else {
    doc.text('Tidak ada ulasan konsumen spesifik yang diekstrak.', margin + 4, y + 5);
    y += 8;
  }
  y += 5;

  // SECTION 6: DAILY ACTION PLAN
  checkPageBreak(50);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VI. STRATEGI MITIGASI & AI ACTION PLAN', margin, y);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);
  y += 8;

  // Action plan items headers
  checkPageBreak(40);
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(margin, y, contentWidth, 7, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Prio', margin + 3, y + 5);
  doc.text('Rencana Aksi Mitigasi', margin + 18, y + 5);
  doc.text('Divisi', margin + 110, y + 5);
  doc.text('Estimasi Dampak', margin + 140, y + 5);
  y += 7;

  doc.setTextColor(15, 23, 42);
  const actions = record.action_plan || [];
  if (actions.length > 0) {
    actions.forEach((act: any) => {
      checkPageBreak(12);
      
      // Select bullet priority color
      doc.setFont('Helvetica', 'bold');
      const priority = act.priority || 'Medium';
      doc.text(priority.toUpperCase().substring(0, 4), margin + 3, y + 5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      
      // Multiline wrapping because of task length
      const wrappedTask = doc.splitTextToSize(act.task || act.description || 'N/A', 88);
      doc.text(wrappedTask, margin + 18, y + 5);
      doc.text(act.category || 'Umum', margin + 110, y + 5);
      doc.text(act.impact || 'High', margin + 140, y + 5);

      // Height dynamic adjustment based on rows wrapped
      const computedHeight = Math.max(wrappedTask.length * 4.5, 7.5);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + computedHeight, margin + contentWidth, y + computedHeight);
      y += computedHeight + 1.5;
    });
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.text('Tidak ada daftar rencana aksi spesifik.', margin + 4, y + 5);
    y += 8;
  }
  y += 5;

  // SIGN-OFF RECOMMENDATIONS (VII)
  checkPageBreak(60);
  doc.setFillColor(240, 245, 255);
  doc.rect(margin, y, contentWidth, 42, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('VII. REKOMENDASI TAHAPAN WAKTU & SIGN-OFF', margin + 5, y + 6);
  doc.line(margin + 5, y + 8, margin + 80, y + 8);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('• 24 Jam Pertama : Hubungi pemasok logistik untuk menanggulangi item berstatus kritis.', margin + 5, y + 14);
  doc.text('• 7 Hari Kedepan  : Sosialisasikan SOP layanan ramah untuk menetralisir aspek ulasan negatif.', margin + 5, y + 21);
  doc.text('• 30 Hari Kedepan : Evaluasi struktur harga jual dan integrasikan laporan ini ke basis data reguler.', margin + 5, y + 28);
  doc.text('Catatan Penutup  : Dokumen ini terdaftar sebagai sertifikat operasional bisnis UMKM resmi.', margin + 5, y + 36);

  // Trigger Save File
  const filename = getSafeFilename(record.business_name, record.created_at, 'pdf');
  doc.save(filename);
};
