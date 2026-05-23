export interface ScenarioData {
  id: string; // 'kopi' | 'laundry' | 'fashion' | 'warung'
  title: string;
  business: {
    id: string;
    business_name: string;
    business_type: string;
    owner_name: string;
    location: string;
    currency: string;
    phone: string;
    email: string;
    description: string;
  };
  history: any[]; // AI Analysis history
  leads: any[]; // CRM Leads
  forecast: any; // Forecasting data
  notifications: any[]; // System alerts/notifications
}

export const demoScenarios: Record<string, ScenarioData> = {
  kopi: {
    id: 'kopi',
    title: 'Kedai Kopi Selaras',
    business: {
      id: 'demo_biz_kopi',
      business_name: 'Kopi Selaras Cilandak',
      business_type: 'F&B Cafe',
      owner_name: 'Budi Santoso',
      location: 'Cilandak, Jakarta Selatan',
      currency: 'IDR',
      phone: '+62 812-3456-7890',
      email: 'kontak@kopiselaras.com',
      description: 'Kedai kopi artisan lokal dengan konsep asri, menyajikan kopi Nusantara premium dan kudapan lezat bagi pekerja urban dan komunitas kreatif.'
    },
    history: [
      {
        id: 'hist_kopi_1',
        business_id: 'demo_biz_kopi',
        health_score: 84,
        health_summary: 'Kinerja kedai kopi sangat prima dengan pertumbuhan penjualan mingguan sebesar 12%. Menu Signature Aren Latte menyumbang 40% dari total pendapatan. Namun, terdapat risiko operasional pada bagian persediaan biji kopi Arabika Gayo yang kritis, serta keluhan kecil pelanggan regarding kecepatan kasir di jam sibuk sore hari (16.00 - 18.00 WIB).',
        strengths: [
          'Loyalitas pelanggan sangat tinggi pada komunitas remote workers.',
          'Gross Profit Margin sehat di angka 68% berkat pasokan biji langsung dari petani.'
        ],
        risks: [
          'Keterbatasan stok biji kopi signature Arabika Gayo selama 3 hari mendatang.',
          'Penumpukan antrean kasir di jam sibuk yang menurunkan kepuasan pelanggan.'
        ],
        sales_trend: 'up',
        alerts: [
          'PERSENTASE PERSIDANGAN GAYO: Stok kritis di bawah 2.5 kg!',
          'BOTTLENECK KASIR: Rata-rata waktu tunggu antrean mencapai 8 menit.'
        ],
        sales_data: [
          { date: '17 Mei', sales: 2450000, transactions: 48 },
          { date: '18 Mei', sales: 2700000, transactions: 52 },
          { date: '19 Mei', sales: 2100000, transactions: 41 },
          { date: '20 Mei', sales: 2900000, transactions: 58 },
          { date: '21 Mei', sales: 3400000, transactions: 65 },
          { date: '22 Mei', sales: 3800000, transactions: 72 },
          { date: '23 Mei', sales: 4100000, transactions: 80 }
        ],
        top_products: [
          { name: 'Selaras Aren Latte', sales: 210, stock: 120, trend: 'up' },
          { name: 'V60 Gayo Single Origin', sales: 95, stock: 4, trend: 'down' },
          { name: 'Croissant Butter', sales: 80, stock: 15, trend: 'up' },
          { name: 'Es Coklat Klasik', sales: 60, stock: 45, trend: 'flat' }
        ],
        customer_reviews_summary: [
          { topic: 'Kualitas Rasa Kopi', rating: 4.9, count: 42, sentiment: 'positive' },
          { topic: 'Kenyamanan Tempat Kerja', rating: 4.7, count: 31, sentiment: 'positive' },
          { topic: 'Kecepatan Sajian / Kasir', rating: 3.8, count: 18, sentiment: 'negative' }
        ],
        action_plan: [
          {
            id: 1,
            priority: 'high',
            task: 'Restock biji kopi Arabika Gayo secepatnya dari mitra Koperasi Tani.',
            category: 'inventory',
            reasoning: 'Gayo Single Origin menyumbang margin tinggi. Kekosongan stok selama akhir pekan dapat menyebabkan hilangnya potensi penjualan hingga IDR 1.200.000.'
          },
          {
            id: 2,
            priority: 'high',
            task: 'Optimalkan sistem POS nirkabel (Tablet) di meja untuk memecah antrean.',
            category: 'operations',
            reasoning: 'Mengurangi waktu tunggu antrean dari 8 menit menjadi di bawah 4 menit, meningkatkan kepuasan pelanggan hingga 20%.'
          },
          {
            id: 3,
            priority: 'medium',
            task: 'Luncurkan promo bundling kopi gratis Croissant tiap Kamis sore.',
            category: 'marketing',
            reasoning: 'Memanfaatkan sisa stok pastry pertengahan minggu dan mendorong basket size transaksi minimal dari IDR 45.000 ke IDR 65.000.'
          }
        ],
        created_at: new Date().toISOString()
      }
    ],
    leads: [
      {
        id: 'lead_kopi_1',
        business_id: 'demo_biz_kopi',
        lead_name: 'Andi Wijaya (B2B Coffee Catering)',
        company_name: 'PT Digital Venture Indonesia',
        phone: '+62 813-1111-2222',
        email: 'andi.wijaya@digitalventures.id',
        source: 'Instagram',
        pipeline_stage: 'Negotiation',
        estimated_value: 12000000,
        interest_level: 'Hot',
        notes: 'Meminta penawaran katering kopi untuk event startup gathering mingguan selama 1 bulan penuh (4x event, total target 400 cup).',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'lead_kopi_2',
        business_id: 'demo_biz_kopi',
        lead_name: 'Rina Kartika (Sponsorship Campus)',
        company_name: 'BEM Universitas Bakrie',
        phone: '+62 819-2222-3333',
        email: 'rina.kartika@student.bakrie.ac.id',
        source: 'WhatsApp Web',
        pipeline_stage: 'Contacted',
        estimated_value: 2500000,
        interest_level: 'Warm',
        notes: 'Mengajukan proposal sponsor kopi Selaras untuk seminar entepreneur muda. Memiliki potensi visibilitas brand luas.',
        status: 'Active',
        created_at: new Date().toISOString()
      }
    ],
    forecast: {
      business_id: 'demo_biz_kopi',
      predicted_score: 87,
      growth_index: 1.15,
      factors: [
        { name: 'Volume Konsumsi Signature Drink', weight: 40, status: 'favorable' },
        { name: 'Ketergantungan Supply Chain Gayo', weight: -25, status: 'unfavorable' },
        { name: 'Waktu Layanan Loket Kasir', weight: -15, status: 'unfavorable' }
      ],
      created_at: new Date().toISOString()
    },
    notifications: [
      {
        id: 'notif_kopi_1',
        business_id: 'demo_biz_kopi',
        title: '⚠️ Stok Kritis Arabika Gayo',
        message: 'Biji kopi Arabika Gayo tersisa kurang dari 2.5 kg di gudang. Segera hubungi distributor Jawa Barat.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  },
  laundry: {
    id: 'laundry',
    title: 'Bersih Kilat Laundry',
    business: {
      id: 'demo_biz_laundry',
      business_name: 'Bersih Kilat Laundry',
      business_type: 'Jasa Laundry',
      owner_name: 'Santi Rahayu',
      location: 'Depok, Jawa Barat',
      currency: 'IDR',
      phone: '+62 821-4444-5555',
      email: 'owner@bersihkilatlaundry.com',
      description: 'Layanan laundry kiloan dan satuan professional berteknologi pembersih ramah lingkungan, menargetkan keluarga muda dan mahasiswa sibuk.'
    },
    history: [
      {
        id: 'hist_laundry_1',
        business_id: 'demo_biz_laundry',
        health_score: 78,
        health_summary: 'Kesehatan bisnis laundry berada di zona moderat tinggi. Tingkat pemakaian detergen dan air terkontrol ramah lingkungan. Kendala utama adalah utilisasi mesin pengering nomor 3 yang sedang mengalami penurunan panas, menghambat siklus laundry express kilat.',
        strengths: [
          'Harganya sangat kompetitif dengan sistem poin loyalty digital.',
          'Waktu penyelesaian laundry reguler stabil di bawah 48 jam.'
        ],
        risks: [
          'Mesin pengering No. 3 mengalami error pemanas heater, memperpanjang durasi antrean express.',
          'Kenaikan harga deterjen impor sebesar 8% mulai bulan depan.'
        ],
        sales_trend: 'flat',
        alerts: [
          'SERVIS PEMANAS PENGERING: Mesin 3 tidak mencapai suhu optimal 60 derajat.',
          'STOK PARFUM PREMIUM: Sisa 1 botol aroma Sakura!'
        ],
        sales_data: [
          { date: '17 Mei', sales: 1200000, transactions: 30 },
          { date: '18 Mei', sales: 1350000, transactions: 32 },
          { date: '19 Mei', sales: 1100000, transactions: 28 },
          { date: '20 Mei', sales: 1400000, transactions: 35 },
          { date: '21 Mei', sales: 1250000, transactions: 31 },
          { date: '22 Mei', sales: 1600000, transactions: 40 },
          { date: '23 Mei', sales: 1850000, transactions: 46 }
        ],
        top_products: [
          { name: 'Cuci Setrika Kiloan Reguler', sales: 450, stock: 1000, trend: 'flat' },
          { name: 'Cuci Kilat Express 6 Jam', sales: 180, stock: 2, trend: 'up' },
          { name: 'Dry Cleaning Jas Premium', sales: 42, stock: 50, trend: 'up' },
          { name: 'Cuci Bedcover Besar', sales: 35, stock: 20, trend: 'flat' }
        ],
        customer_reviews_summary: [
          { topic: 'Keharuman Pakaian', rating: 4.8, count: 54, sentiment: 'positive' },
          { topic: 'Kecepatan Laundry Express', rating: 3.4, count: 22, sentiment: 'negative' },
          { topic: 'Kerapian Setrika', rating: 4.6, count: 32, sentiment: 'positive' }
        ],
        action_plan: [
          {
            id: 1,
            priority: 'high',
            task: 'Panggil teknisi mesin cuci untuk kalibrasi elemen pemanas pengering No 3.',
            category: 'operations',
            reasoning: 'Keterlambatan pengerjaan laundry express dapat merusak reputasi "Kilat" dan berisiko klaim ganti rugi pelanggan hingga IDR 400.000.'
          },
          {
            id: 2,
            priority: 'medium',
            task: 'Restock cadangan parfum premium varian terlaris Sakura & Lavender.',
            category: 'inventory',
            reasoning: 'Varian wangi Sakura disukai oleh 70% pelanggan wanita. Kehabisan varian ini berpotensi menurunkan kepuasan retensi loyalis.'
          }
        ],
        created_at: new Date().toISOString()
      }
    ],
    leads: [
      {
        id: 'lead_laundry_1',
        business_id: 'demo_biz_laundry',
        lead_name: 'Ibu Ratna (Kost Putri Melati)',
        company_name: 'Kost Mandiri Sukses',
        phone: '+62 821-9988-7766',
        email: 'ratna_kost@gmail.com',
        source: 'Rekomendasi',
        pipeline_stage: 'Qualified',
        estimated_value: 6500000,
        interest_level: 'Hot',
        notes: 'Tertarik kontrak eksklusif laundry untuk total 35 mahasiswi penghuni kost dengan diskon khusus 10%.',
        status: 'Active',
        created_at: new Date().toISOString()
      }
    ],
    forecast: {
      business_id: 'demo_biz_laundry',
      predicted_score: 82,
      growth_index: 1.08,
      factors: [
        { name: 'Tingkat Kepuasan Wangi Pakaian', weight: 35, status: 'favorable' },
        { name: 'Kapasitas Mesin Rusak/Heater Malfunction', weight: -30, status: 'unfavorable' }
      ],
      created_at: new Date().toISOString()
    },
    notifications: [
      {
        id: 'notif_laundry_1',
        business_id: 'demo_biz_laundry',
        title: '⚠ Heater Malfunction Mesin 3',
        message: 'Sensor suhu mendeteksi elemen pengering nomor 3 tidak mencapai batas hangat 60 derajat.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  },
  fashion: {
    id: 'fashion',
    title: 'Batik Kirana Collection',
    business: {
      id: 'demo_biz_fashion',
      business_name: 'Batik Kirana Collection',
      business_type: 'Retail Fashion',
      owner_name: 'Kirana Larasati',
      location: 'Surakarta, Jawa Tengah',
      currency: 'IDR',
      phone: '+62 878-5555-6666',
      email: 'cs@batikkirana.com',
      description: 'Produsen & butik retail busana batik modern tulis dan cap bercorak khas Surakarta, memadukan tradisi klasik dengan cutting modern profesional muda.'
    },
    history: [
      {
        id: 'hist_fashion_1',
        business_id: 'demo_biz_fashion',
        health_score: 89,
        health_summary: 'Bisnis fashion memiliki profitabilitas sangat gemilang dengan margin laba bersih yang melampaui rata-rata industri. Stok kain mentah sutera dan katun prima terjaga aman. Tantangan krusial adalah tingginya pembatalan pesanan di keranjang belanja e-commerce Shopee akibat kurangnya follow-up WhatsApp konfirmasi pembayaran.',
        strengths: [
          'Brand identity kuat dengan corak cap eksklusif milik Kirana.',
          'Zero defect production quality - pengembalian produk 0.2%.'
        ],
        risks: [
          'Tingginya cart abandonment (keranjang ditinggalkan) capai 42% di platform online.',
          'Waktu produksi batik tulis premium membutuhkan waktu hingga 21 hari pengerjaan.'
        ],
        sales_trend: 'up',
        alerts: [
          'CART ABANDONMENT RATE: 24 keranjang Shopee terbengkalai 2x24 jam!',
          'PRODUKSI EXCLUSIVE SERI BANYU: Sisa 3 helai kain tulis sutera.'
        ],
        sales_data: [
          { date: '17 Mei', sales: 4500000, transactions: 15 },
          { date: '18 Mei', sales: 5200000, transactions: 18 },
          { date: '19 Mei', sales: 3900000, transactions: 12 },
          { date: '20 Mei', sales: 6100000, transactions: 22 },
          { date: '21 Mei', sales: 7500000, transactions: 28 },
          { date: '22 Mei', sales: 8200000, transactions: 30 },
          { date: '23 Mei', sales: 9800000, transactions: 35 }
        ],
        top_products: [
          { name: 'Kemeja Slimfit Tulis Parang', sales: 85, stock: 12, trend: 'up' },
          { name: 'Blouse Katun Cap Kirana', sales: 120, stock: 45, trend: 'up' },
          { name: 'Outer Silk Mega Mendung', sales: 30, stock: 2, trend: 'down' },
          { name: 'Selendang Sutra Premium', sales: 18, stock: 8, trend: 'flat' }
        ],
        customer_reviews_summary: [
          { topic: 'Kehalusan Bahan Kain', rating: 4.9, count: 65, sentiment: 'positive' },
          { topic: 'Kesesuaian Ukuran Baju', rating: 4.5, count: 48, sentiment: 'positive' },
          { topic: 'Kecepatan Respon Admin Chat', rating: 3.5, count: 20, sentiment: 'negative' }
        ],
        action_plan: [
          {
            id: 1,
            priority: 'high',
            task: 'Aktifkan reminder otomatis WhatsApp Fonnte untuk target abandoned cart.',
            category: 'marketing',
            reasoning: 'Follow-up dalam 30 menit pertama berpotensi memulihkan 15-20% penjualan tertunda senilai IDR 3.500.000.'
          },
          {
            id: 2,
            priority: 'medium',
            task: 'Update foto katalog resolusi tinggi dan video fitting baju di Shopee.',
            category: 'marketing',
            reasoning: 'Mengurangi keraguan pelanggan perihal detail kain sutra dan menurunkan komplain retur ukuran.'
          }
        ],
        created_at: new Date().toISOString()
      }
    ],
    leads: [
      {
        id: 'lead_fashion_1',
        business_id: 'demo_biz_fashion',
        lead_name: 'Bapak Gunawan (Seragam Kantor)',
        company_name: 'BPD Bank Jateng Cabang Solo',
        phone: '+62 856-4444-8888',
        email: 'gunawan_corp@bankjateng.co.id',
        source: 'Website',
        pipeline_stage: 'Won',
        estimated_value: 45000000,
        interest_level: 'Hot',
        notes: 'Pemesanan seragam batik cap motif parang custom untuk 120 staf bank. Pembayaran DP 50% telah aman diterima.',
        status: 'Closed',
        created_at: new Date().toISOString()
      }
    ],
    forecast: {
      business_id: 'demo_biz_fashion',
      predicted_score: 94,
      growth_index: 1.25,
      factors: [
        { name: 'Eksklusivitas Motif Kirana', weight: 45, status: 'favorable' },
        { name: 'Kelambatan follow-up e-commerce', weight: -15, status: 'unfavorable' }
      ],
      created_at: new Date().toISOString()
    },
    notifications: [
      {
        id: 'notif_fashion_1',
        business_id: 'demo_biz_fashion',
        title: '🛍️ Tingkat Keranjang Tertinggal',
        message: 'Ditemukan lonjakan 24 keranjang Shopee tak kunjung diselesaikan pelaku belanja.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  },
  warung: {
    id: 'warung',
    title: 'Warung Makan Bu Djoko',
    business: {
      id: 'demo_biz_warung',
      business_name: 'Warung Makan Bu Djoko',
      business_type: 'Warung Makan',
      owner_name: 'Bu Djoko',
      location: 'Sleman, D.I. Yogyakarta',
      currency: 'IDR',
      phone: '+62 852-7777-9999',
      email: 'budjoko@warungbudjoko.com',
      description: 'Warung masakan rumahan Jawa khas legendaris menyajikan aneka ramesan, sayur lodeh, ayam goreng kalasan dengan rasa otentik yang higienis.'
    },
    history: [
      {
        id: 'hist_warung_1',
        business_id: 'demo_biz_warung',
        health_score: 81,
        health_summary: 'Warung Makan berkembang dengan sehat berkat volume transaksi harian yang stabil di jam makan siang (11.30 - 13.30 WIB). Margin terpelihara tangguh berkat pembelian bahan pokok langsung di pasar induk pagi buta. Kendala operasional adalah kelebihan limbah makanan (food waste) pada pukul 21.00 WIB untuk menu bersantan yang tidak tahan lama.',
        strengths: [
          'Cita rasa bumbu resep turun temurun sangat digemari pelancong.',
          'Harga ramah kantong mahasiswa Sleman dengan porsi mengenyangkan.'
        ],
        risks: [
          'Kerugian dari sisa sajian bersantan (masak sore) yang tidak tahan basi hingga besok pagi.',
          'Kenaikan harga minyak goreng kemasan dan daging ayam potong.'
        ],
        sales_trend: 'up',
        alerts: [
          'BAHAN BASI SORE: Potensi sisa lodeh bersantan dibuang pada malam hari.',
          'HARGA BAHAN POKOK: Cabai rawit merah melonjak hingga IDR 80.000/kg!'
        ],
        sales_data: [
          { date: '17 Mei', sales: 1800000, transactions: 60 },
          { date: '18 Mei', sales: 1950000, transactions: 65 },
          { date: '19 Mei', sales: 1700000, transactions: 58 },
          { date: '20 Mei', sales: 2100000, transactions: 70 },
          { date: '21 Mei', sales: 2400000, transactions: 80 },
          { date: '22 Mei', sales: 2600000, transactions: 85 },
          { date: '23 Mei', sales: 2900000, transactions: 95 }
        ],
        top_products: [
          { name: 'Nasi Rames Ayam Kalasan', sales: 380, stock: 15, trend: 'up' },
          { name: 'Sayur Lodeh Labu Siam', sales: 250, stock: 2, trend: 'flat' },
          { name: 'Gudeg Telur Khas Solo', sales: 190, stock: 30, trend: 'up' },
          { name: 'Es Teh Manis Jumbo', sales: 420, stock: 500, trend: 'up' }
        ],
        customer_reviews_summary: [
          { topic: 'Keotentikan Rasa', rating: 4.9, count: 72, sentiment: 'positive' },
          { topic: 'Kehigienisan Sajian', rating: 4.6, count: 45, sentiment: 'positive' },
          { topic: 'Stok Menu Cepat Habis Sore', rating: 3.7, count: 15, sentiment: 'neutral' }
        ],
        action_plan: [
          {
            id: 1,
            priority: 'high',
            task: 'Terapkan diskon "Flash Sale Sore" sebesar 30% pada semua menu ramesan pukul 20.00 WIB.',
            category: 'finance',
            reasoning: 'Mencegah pembuangan sia-sia menu ramesan basah, menghasilkan sisa omset tunai tambahan minimal IDR 150.000 per hari.'
          },
          {
            id: 2,
            priority: 'medium',
            task: 'Lakukan pra-pemesanan ayam potong langsung ke peternakan Sleman untuk mengunci harga.',
            category: 'finance',
            reasoning: 'Mengurangi volatilitas biaya bahan pokok ayam potong sebesar 8-12% menjelang libur nasional.'
          }
        ],
        created_at: new Date().toISOString()
      }
    ],
    leads: [
      {
        id: 'lead_warung_1',
        business_id: 'demo_biz_warung',
        lead_name: 'Bapak Roni (Katering Arisan)',
        company_name: 'Warga RW 08 Condongcatur',
        phone: '+62 853-2222-3333',
        email: 'roni_condong@gmail.com',
        source: 'Mulut ke Mulut',
        pipeline_stage: 'Contacted',
        estimated_value: 3800000,
        interest_level: 'Warm',
        notes: 'Mengajukan rincian harga katering nasi kotak komplit sebanyak 80 pax untuk acara puncak silaturahmi warga kelurahan.',
        status: 'Active',
        created_at: new Date().toISOString()
      }
    ],
    forecast: {
      business_id: 'demo_biz_warung',
      predicted_score: 85,
      growth_index: 1.12,
      factors: [
        { name: 'Kekuatan Rasa & Harga Mahasiswa', weight: 40, status: 'favorable' },
        { name: 'Limbah Sisa Makanan Bersantan', weight: -20, status: 'unfavorable' }
      ],
      created_at: new Date().toISOString()
    },
    notifications: [
      {
        id: 'notif_warung_1',
        business_id: 'demo_biz_warung',
        title: '🥘 Kerugian Limbah Makanan',
        message: 'Ditemukan potensi kerugian pembuangan ramesan tersisa di gudang setiap jam tutup malam hari.',
        type: 'alert',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  }
};
