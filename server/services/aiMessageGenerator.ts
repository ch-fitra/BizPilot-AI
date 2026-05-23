import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null; // Will fallback gracefully to highly optimized prompt-templates
  }

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return aiClient;
}

export class AIMessageGenerator {
  /**
   * Universal AI generator for Indonesian UMKM WhatsApp follow-ups.
   * If Gemini API Key is missing, fallback to pristine dynamic localized template strings.
   */
  static async generateMessage(params: {
    type: 'follow_up' | 'payment_reminder' | 'simple_promo' | 'closing_negotiation' | 'retention' | 'reorder_reminder' | string;
    tone: 'formal' | 'friendly' | 'persuasive' | string;
    customerName: string;
    businessName: string;
    itemName?: string;
    amount?: string | number;
    extraDetails?: string;
  }): Promise<string> {
    const { type, tone, customerName, businessName, itemName = '', amount = '', extraDetails = '' } = params;

    const key = process.env.GEMINI_API_KEY;
    const ai = getAiClient();

    if (ai && key) {
      try {
        const prompt = `Anda adalah asisten cerdas pembuat pesan WhatsApp operasional bisnis untuk UMKM di Indonesia bernama BizPilot AI.
Tugas Anda adalah membuat draf pesan WhatsApp yang ramah, sopan, singkat, tidak merusak reputasi (tidak spammy), dan sangat lokal sesuai kultur komunikasi bisnis di Indonesia.

=== SPESIFIKASI PESAN ===
1. **Nama Penerima (Pelanggan)**: ${customerName}
2. **Nama Pengirim (Nama Bisnis)**: ${businessName}
3. **Jenis Pesan**: ${type} (follow_up / payment_reminder / simple_promo / closing_negotiation / retention / reorder_reminder)
4. **Gaya Bahasa (Tone)**: ${tone} (Formal / Friendly / Persuasive)
5. **Nama Produk/Layanan detail** (bila ada): ${itemName}
6. **Nilai Transaksi/Uang** (bila ada): ${amount}
7. **Informasi Tambahan / Riwayat Percakapan**: ${extraDetails}

=== PETUNJUK PENULISAN ===
- **Formal**: Sopan santun tinggi, sapaan "Bapak/Ibu", bahasa baku, ramah, profesional, cocok untuk instansi/B2B.
- **Friendly**: Hangat, akrab, sapaan "Kak" atau "Kakak/Agan", santai tapi tetap hormat, dinamis, cocok untuk pelanggan retail/anak muda.
- **Persuasive**: Sedikit mendesak tapi tetap elegan, menonjolkan keuntungan/promo terbatas/diskon khusus, mengajak untuk segera memutuskan transaksi (closing).

Outputkan LANGSUNG draf pesan WhatsApp saja, kosongkan keterangan tambahan, dan pastikan tidak bertele-tele. Anda bisa menggunakan emoji secukupnya agar estetik dan profesional.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        console.error('Gemini generated content failed, falling back to templates:', err);
      }
    }

    // High quality Indonesian templates fallback if AI is unconfigured or failed
    return this.getFallbackTemplate(type, tone, customerName, businessName, itemName, amount, extraDetails);
  }

  private static getFallbackTemplate(
    type: string,
    tone: string,
    customerName: string,
    businessName: string,
    itemName: string,
    amount: string | number,
    extraDetails: string
  ): string {
    const productStr = itemName ? `produk *${itemName}*` : 'pesanan Kakak';
    const amountStr = amount ? `senilai *Rp ${Number(amount).toLocaleString('id-ID')}*` : '';
    const detailsStr = extraDetails ? `\nCatatan tambahan: ${extraDetails}` : '';

    if (type === 'payment_reminder') {
      if (tone === 'formal') {
        return `Halo Selamat Siang Bapak/Ibu ${customerName},\n\nSemoga hari Anda menyenangkan. Kami dari bagian keuangan *${businessName}* ingin mengonfirmasi terkait tagihan atas pembelian ${productStr} ${amountStr} yang jatuh tempo hari ini. Mohon berkenan mengirimkan bukti transfer jika pembayaran sudah diselesaikan. Atas perhatian bapak/ibu kami ucapkan terima kasih. 🙏`;
      } else if (tone === 'friendly') {
        return `Halo Kak ${customerName}! 😊 Sapa hangat dari tim *${businessName}*.\n\nCuma mau ngingetin tipis-tipis nih Kak terkait pembayaran ${productStr} ${amountStr} yang kemarin sudah diproses. Link atau nomor rekening pembayaran masih aktif yaaa. Biar barang langsung bisa kami jadwalkan kirim hari ini juga. Makasih banyak Kak! ✨`;
      } else {
        return `Halo Kak ${customerName}! 🚨 Ada kabar nih, slots pengiriman ${productStr} *${businessName}* untuk hari ini hampir penuh!\n\nAgar pesanan Kakak tidak terpending ke minggu depan, boleh banget diselesaikan pembayarannya ${amountStr} sebelum jam 4 sore ini ya Kak. Dapatkan gratis ongkir khusus hari ini saja! Ditunggu konfirmasinya Kak, terima kasih! 🔥`;
      }
    }

    if (type === 'simple_promo') {
      if (tone === 'formal') {
        return `Yth. Bapak/Ibu ${customerName},\n\nKami dari *${businessName}* ingin mengabarkan kepuasan pelanggan istimewa kami. Dapatkan kesempatan promo eksklusif diskon up to 20% untuk pemesanan ${productStr} yang berlaku khusus minggu ini saja. Segera hubungi kami untuk informasi penawaran lebih lanjut. Terima kasih.`;
      } else if (tone === 'friendly') {
        return `Halo Kak ${customerName}! 😍 Ada kejutan seru nih dari *${businessName}*!\n\nKhusus buat Kakak, hari ini kami ada promo "Spesial Weekend" untuk pembelian ${productStr}! Ada diskon ataupun gratis mini-tester lho. Mau coba varian rasa terbaru kami Kak? Silakan chat langsung buat info lengkapnya yaaa! Chat sekarang sebelum kehabisan! 🥰`;
      } else {
        return `Halo Kak ${customerName}! 🔥 KESEMPATAN TERBATAS hanya sampai malam ini!\n\nKami punya promo gila-gilaan khusus buat Kak ${customerName} untuk pembelian ${productStr} di *${businessName}*. Pembelian sekarang dapat potongan langsung hingga Rp 50.000! Slot promo tersisa 3 slot lagi. Yuk amankan diskon Kakak sekarang sebelum hangus! Klik reply untuk ambil promonya ya! ⏳`;
      }
    }

    if (type === 'closing_negotiation') {
      if (tone === 'formal') {
        return `Selamat Pagi Bapak/Ibu ${customerName},\n\nMenindaklanjuti rencana kerja sama pemesanan ${productStr} ${amountStr} bersama *${businessName}*, kami ingin menanyakan apakah ada hal-hal atau kontrak penawaran harga yang perlu kami sesuaikan kembali? Kami sangat berharap dapat membantu menyediakan kebutuhan instansi Bapak/Ibu dengan pelayanan terbaik kami. Terima kasih.`;
      } else if (tone === 'friendly') {
        return `Halo Kak ${customerName}! 😊 Semoga sehat selalu ya Kak.\n\nTanya-tanya bentar nih Kak, rencana kelanjutan pesanan ${productStr} kemarin gimana kak? Hehe. Kalau ada kendala di spesifikasi atau budget, silakan dikabari yaaa. Kami siap bantu carikan solusi produk atau diskon kuantitas khusus yang pas buat Kakak. Ditunggu obrolannya Kak! 🙌`;
      } else {
        return `Halo Kak ${customerName}! 👋 Kabar gembira buat rencana pesanan ${productStr} Kakak senilai ${amountStr} di *${businessName}*!\n\nManajer kami baru saja menyetujui tambahan diskon bundling khusus untuk Kakak jika transaksinya di-closing-kan dalam 24 jam ini. Plus, pengiriman prioritas instan gratis! Ini kesempatan terbaik untuk dapat harga termurah. Yuk mari amankan penawarannya sekarang Kak! 🚀`;
      }
    }

    if (type === 'retention') {
      if (tone === 'formal') {
        return `Yth. Bapak/Ibu ${customerName},\n\nSemoga usaha Bapak/Ibu senantiasa sukses berjalan. Kami menyampaikan terima kasih atas kepercayaan Bapak/Ibu terhadap layanan dari *${businessName}* selama ini. Kami mengharapkan kritik atau masukan kualitas pelayanan dari Bapak/Ibu demi kepuasan kerja sama jangka panjang kita. Atas waktunya kami ucapkan terima kasih.`;
      } else if (tone === 'friendly') {
        return `Halo Kak ${customerName}! kangen nih! 😍 Sudah lama Kakak nggak mampir atau order ${productStr} di *${businessName}*.\n\nSemoga Kakak sehat-sehat selalu ya. Sebagai tanda rindu, kami kasih kupon diskon khusus senilai 15% buat pesanan Kakak berikutnya. Tanya-tanya menu atau produk terbaru kami yuk Kak! Sampai ketemu di ruang chat yaah! 😘`;
      } else {
        return `Halo Kak ${customerName}! 🌟 Kami sangat berterima kasih Kakak telah menjadi pelanggan setia *${businessName}*.\n\nKhusus bulan ini, ada program loyalitas rahasia bagi pelanggan VIP seperti Kakak. Ambil voucher spesial Kakak hari ini untuk dicairkan di order ${productStr} berikutnya. Hubungi kami seketika dengan balas pesan ini untuk klaim voucher VIP Anda! Terbatas untuk 10 pelanggan pertama!`;
      }
    }

    if (type === 'reorder_reminder') {
      if (tone === 'formal') {
        return `Yth. Bapak/Ibu ${customerName},\n\nBerdasarkan siklus pemesanan berkala sebelumnya, kami memprediksi ketersediaan bahan baku atau persediaan ${productStr} Anda mungkin hampir habis kembali. Kami siap melayani pengiriman bahan berikutnya dari *${businessName}* agar kelangsungan operasional bisnis Bapak/Ibu terjaga dengan baik. Hubungi admin kami untuk konfirmasi pengiriman ulang. Terima kasih.`;
      } else if (tone === 'friendly') {
        return `Halo Kak ${customerName}! Semoga harinya menyenangkan! 😎\n\nStok produk ${productStr} yang Kakak pesan sebulan lalu kayaknya udah mulai mau habis nih ya? Supaya operasional atau stok konsumsi harian Kakak nggak sempat kosong, yuk pesan ulang (re-order) sekarang di *${businessName}*. Kami bantu siapkan kiriman terjadwal cepat ya kak! Tinggal klik reply aja kok. Thanks Kak!`;
      } else {
        return `Halo Kak ${customerName}! 🚚 Jadwal pengiriman logistik rutin *${businessName}* sedang disusun!\n\nAgar stok ${productStr} Kakak amannya terjamin sepanjang minggu ini dan tanpa antrean pengiriman, yuk buat pesanan reorder sekarang juga! Khusus reorder hari ini, ada subsidi ongkir melimpah! Balas instan chat ini untuk langsung booking armada pengiriman Kakak. Aman tenteram! ⚡`;
      }
    }

    // Default general follow-up template
    if (tone === 'formal') {
      return `Selamat Siang Bapak/Ibu ${customerName},\n\nPerkenalkan saya dari *${businessName}*. Kami ingin menindaklanjuti percakapan singkat kita waktu lalu terkait layanan ${productStr}. Apabila ada kriteria penawaran harga, detail informasi produk, atau simulasi yang ingin ditanyakan, kami siap membantu Anda dengan senang hati. Terima kasih atas perhatiannya.${detailsStr}`;
    } else if (tone === 'friendly') {
      return `Halo Kak ${customerName}! 😊 Sapa hangat dari tim *${businessName}*.\n\nKak, mau nanya santai nih terkait rencana order ${productStr} kemarin. Apakah ada info yang masih membingungkan atau butuh kami kirimi info detail lagi? Monggo lho chat aja di sini, admin kami siap jawab 24/7 demi kelancaran kebutuhan Kakak. Makasih yaah!${detailsStr}`;
    } else {
      return `Halo Kak ${customerName}! 🔥 Rencana pesanan ${productStr} kemarin di *${businessName}* masih ready slot promosinya lho!\n\nHarga promo diskon dan gratis pengantaran cepat hanya berkualifikasi untuk pemesanan minggu ini saja Kak. Sayang banget kan kalau kelewat harga hematnya? Yuk tanya admin kami sekarang untuk cara instan booking kuota promo Kakak!${detailsStr}`;
    }
  }
}
