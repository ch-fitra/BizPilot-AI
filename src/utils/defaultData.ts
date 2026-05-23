import { BusinessHealthState } from '../types';

export const DEFAULT_BUSINESS_STATE: BusinessHealthState = {
  health_score: 84,
  health_summary: "Kinerja operasional Kopi Selaras di wilayah Jakarta Selatan stabil dengan pertumbuhan repeat customer yang konsisten. Namun, terdapat peningkatan ulasan negatif terkait kecepatan penyajian (waiting time) selama rush hour sore hari, serta pasokan Susu Oat (Oat Milk) yang kritis menjelang akhir pekan.",
  strengths: [
    "Pertumbuhan tingkat loyalitas pelanggan (repeat orders) yang solid mencapai 68%",
    "Menu 'Es Kopi Susu Selaras' menyumbang Margin Keuntungan Kotor sebesar 45%",
    "Biaya operasional bahan baku esensial (biji kopi & gula aren) stabil aman tahun ini"
  ],
  risks: [
    "Waktu tunggu pesanan (delivery & dine-in) meningkat hingga rata-rata 18 menit pada akhir pekan",
    "Peralatan grinder utama mengalami panas berlebih (overheat) pada jam sibuk",
    "Persediaan Susu Oatmen (Oat Milk) kritis, tersisa kurang dari 1 karton (6 liter)"
  ],
  sales_trend: 'up',
  alerts: [
    "Peringatan Logistik: Stok Susu Oatmen kritis (Sisa 1 karton)!",
    "Keluhan Pelanggan: 3 ulasan negatif mendeteksi keterlambatan penyajian kemarin sore",
    "Anomali Keuangan: Biaya admin kurir online melonjak 12% minggu ini"
  ],
  sales_data: [
    { date: "16 Mei", sales: 1200000, transactions: 35 },
    { date: "17 Mei", sales: 1450000, transactions: 42 },
    { date: "18 Mei", sales: 1900000, transactions: 58 },
    { date: "19 Mei", sales: 2100000, transactions: 65 },
    { date: "20 Mei", sales: 1100000, transactions: 30 },
    { date: "21 Mei", sales: 1300000, transactions: 38 },
    { date: "22 Mei", sales: 1550000, transactions: 45 }
  ],
  top_products: [
    { name: "Es Kopi Susu Selaras", sales: 340, stock: 120, trend: 'up' },
    { name: "Croissant Almond", sales: 160, stock: 15, trend: 'up' },
    { name: "Oat Latte (Premium)", sales: 95, stock: 5, trend: 'down' },
    { name: "Manual Brew Gayo", sales: 48, stock: 50, trend: 'flat' }
  ],
  customer_reviews_summary: [
    { topic: "Rasa Kopi & Konsistensi", rating: 4.8, count: 42, sentiment: 'positive' },
    { topic: "Kecepatan Penyajian (Speed)", rating: 3.2, count: 18, sentiment: 'negative' },
    { topic: "Keramahan Staff Barista", rating: 4.6, count: 25, sentiment: 'positive' },
    { topic: "Harga vs Ekspektasi", rating: 4.2, count: 15, sentiment: 'neutral' }
  ],
  action_plan: [
    {
      id: 1,
      priority: 'high',
      task: "Restock Susu Oatmen Segera",
      category: 'inventory',
      reasoning: "Pasokan tersisa kurang dari 6 liter sedangkan penjualan harian rata-rata menu Oat-based di akhir pekan berkisar 15-20 gelas. Hubungi distributor darurat hari ini."
    },
    {
      id: 2,
      priority: 'high',
      task: "Separasi Jalur Pesanan Lapangan vs Kurir Online",
      category: 'operations',
      reasoning: "Laporan keluhan menyoroti penumpukan orderan ojek online di meja bar yang menghalangi walk-in customer dan memperlambat order penyajian selama sore hari."
    },
    {
      id: 3,
      priority: 'medium',
      task: "Aktifkan Voucher Happy Hour 'Senin Lambat'",
      category: 'marketing',
      reasoning: "Tingkat transaksi hari Senin merosot hingga 40% dibanding rata-rata harian. Voucher diskon 15% pada jam 14:00 - 17:00 akan menstimulasi kedatangan pengunjung."
    },
    {
      id: 4,
      priority: 'low',
      task: "Migrasi Biji Kopi Gayo ke Kemasan Wholesale 5kg",
      category: 'finance',
      reasoning: "Manual brew Gayo memiliki margin keuntungan terendah (30%). Dengan membeli kemasan karung wholesale 5kg, kita dapat mereduksi harga pokok penjualan (HPP) sebesar 9%."
    }
  ]
};
