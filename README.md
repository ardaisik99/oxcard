# OxCard — Oxford 3000 Kelime Kartları

**OxCard**, Oxford'un en çok kullanılan **3.351 İngilizce kelimesini** (A1–B2 CEFR seviyeli, Türkçe anlamlı, örnek cümleli ve sesli telaffuzlu) günlük kelime kartlarıyla öğretmek için tasarlanmış, **mavi-beyaz modern mobil tasarımlı** bir web/PWA uygulamasıdır.

Bilgisayardan (PC) hem **mobil telefon görünümü** hem de **klavye kısayolları ve gün simülasyonu** ile rahatça kontrol edilebilir; aynı zamanda telefon tarayıcısından açılarak **Ana Ekrana Ekle (PWA)** ile gerçek bir mobil uygulama gibi kullanılabilir.

## Özellikler

- **Kişisel Günlük Hedef:** Başlangıçta (ve Ayarlar'dan dilediğin zaman) günde kaç yeni kelime öğrenmek istediğini seçersin (`5` – `50`, önerilen `20`).
- **1. Aşama — Kaydırarak Ayırma (Triage):**
  - Bilmediğin kelimeleri **sola kaydır** (`←`), bildiklerini **sağa kaydır** (`→`).
  - Bildiklerin kaydedilir ve bir daha zamanını almaz.
  - Bilmediğin kelimeler günlük hedefine (ör. 20) ulaştığında o günün öğrenme paketi otomatik hazırlanır.
- **2. Aşama — 3D Kelime Kartları & Pekiştirme Testi:**
  - Seçtiğin kelimeleri 3D çevrilebilir kartlarla çalış: Türkçe anlam, İngilizce tanım, örnek cümle, sık kullanılan kalıplar (collocations), eş anlamlılar ve **US/UK sesli telaffuz** (normal ve yavaş).
  - Zorlandığın kartları **"Tekrar Göster"** ile aynı oturum içinde tekrar karşına çıkar.
  - Ardından 1 dakikalık **Hızlı Pekiştirme Testi** ile kelimeleri kalıcı hafızaya kaydet.
- **Her Gün Yeni Kelimeler & Akıllı Tekrar (Spaced Repetition):**
  - Tüm ilerleme tarayıcıda (`localStorage`) güvenle kaydedilir.
  - Ertesi gün yepyeni Oxford 3000 kelimeleri gelir ve önceki günlerden öğrendiğin kelimeler aralıklı tekrar takvimine göre (`+1, +3, +7, +14, +30 gün`) karşına çıkar.
- **Oxford 3000 Sözlük & İstatistikler:**
  - Tüm 3.351 kelime içinde İngilizce/Türkçe arama, CEFR seviyesi (A1–B2) ve durum filtresi, favoriler, haftalık seri grafiği ve günlük öğrenme geçmişi.
- **PC Kontrol Paneli:**
  - Masaüstünde mobil çerçeve yanında canlı klavye kısayolları, **Geniş / Telefon Görünümü** geçişi ve **Ertesi Güne Geç (+1 Gün)** test simülasyonu.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda **`http://localhost:5173`** adresini aç.

> Aynı Wi-Fi ağındaki telefonundan açmak için terminalde yazan `Network: http://<IP>:5173` adresini telefon tarayıcına yazabilirsin.

## PC Klavye Kısayolları

| Ekran | Kısayol | İşlev |
| --- | --- | --- |
| Kelime Seçimi (Keşif) | `←` / `→` | Bilmiyorum (Öğren) / Biliyorum |
| Kelime Seçimi (Keşif) | `Boşluk` | Anlamına göz at / Gizle |
| Kelime Seçimi (Keşif) | `Z` veya `Backspace` | Son işlemi geri al |
| Kart Çalışma / Tekrar | `Boşluk` | Kartı çevir |
| Kart Çalışma / Tekrar | `←` (`1`) / `→` (`2`) | Tekrar göster / Öğrendim |
| Pekiştirme Testi | `1` – `4` | Doğru şıkkı seç |
| Tüm Kart Ekranları | `S` | İngilizce telaffuzu dinle |

## Veri Kaynakları ve Lisans

- Kelime anlamları, Türkçe çeviriler, örnek cümleler ve kalıplar: [ciwga/Oxford3000_Vocab](https://github.com/ciwga/Oxford3000_Vocab) (MIT Lisansı).
- CEFR seviye eşleştirmeleri (A1–B2): [nalgeon/words](https://github.com/nalgeon/words).
