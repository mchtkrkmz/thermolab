# Radyasyon Termometreleri Siyah Cisim Sıcaklık Gösterimi & Gerçek Zamanlı Ekran Entegrasyonu

Laboratuvardaki tüm radyasyon termometreleri (pirometreler), taşınabilir kızılötesi termometreler ve termal kameralar; siyah cisim fırınlarının (`MK1600`, `MK1200`), transfer radyasyon standardının (`HEITRONICS ME30`) veya `IR Kalibratörlerin` ışıma yapan kavite / plaka merkezlerine tutulduğunda anlık ve canlı olarak hedefteki sıcaklık değerlerini kendi dijital ekranlarında gösterecek şekilde güncellendi.

---

## 🎯 Yapılan İyileştirmeler ve Çözülen Hususlar

### 1. Planck Yasası Simülasyonu & Ekran Gösterim Düzeltmesi (`planck.ts`)
- **Önceki Durum**:
  - `simulatePyrometerMeasurement` fonksiyonunda, hedefin sıcaklığı pirometrenin nominal kalibre edilmiş alt sınırının (`minTemp_C`) altındaysa (örneğin 550°C alt sınırına sahip `LAND CYCLOPS 100L` 500°C'deki `MK1600`'e veya 50°C'deki `MK1200`'e tutulduğunda) fonksiyon doğrudan `displayString: 'UNDER'` döndürüyordu.
  - Bu sebeple kullanıcı siyah cisme nişan aldığında ekranda sayısal sıcaklık yerine yalnızca `"UNDER"` görüyordu.
- **Yapılan Güncelleme**:
  - `finalTemp` değeri ters Planck hesabından (veya hedef radyansından) hesaplanarak **her zaman sayısal santigrat (°C)** formatında üretildi (`displayString: "+500.0 °C"` vb.).
  - Metrolojik geçerlilik için aralık dışı durumlar `status: 'UNDER'` veya `'OVER'` etiketiyle ayrıldı; böylece hem cihaz ekranında uyarı rozeti (`LO` / `HI` / `KALİBRE`) gösteriliyor hem de hedefin gerçek sıcaklık değeri ekranda net bir şekilde okunabiliyor.

---

### 2. Pirometrelerin Arka Yüzeyine Doğrudan Operatöre Bakan Dijital LCD Ekran Eklendi (`RadiationThermometer.tsx`)
- **Önceki Durum**:
  - Pirometrelerde LCD ekran yalnızca cihazın sağ yan tarafında bulunuyordu.
  - Kullanıcı cihazı eline alıp hedefe doğrulttuğunda doğrudan cihazın **arka yüzüne** bakıyordu ve arkada sıcaklık ekranı bulunmadığından ekranı görmek için cihazı yana çevirmek gerekiyordu.
- **Yapılan Güncelleme**:
  - Tüm radyasyon termometrelerinin (Land Cyclops 100L, 160B, Heitronics KT19, Heitronics KT19.82 II, Mikron M90) **arka paneline (kullanıcının doğrudan baktığı Z yüzeyi)** yüksek kontrastlı, parlak, dijital LCD/OLED gösterge paneli yerleştirildi:
    1. **Büyük Dijital Sıcaklık**: Anlık okunan değer (`+500.0 °C`, `+1200.0 °C` vb.)
    2. **Hedef Göstergesi**: `🎯 MK1600 AKKOR KAVİTE`, `🎯 MK1200 AKKOR KAVİTE`, `🎯 IR KALİBRATÖR`
    3. **Çalışma Modu**: `⚡ SCAN` (canlı tarama) / `🔒 HOLD` (dondurulan okuma)
    4. **Metroloji Durumu**: `● KALİBRE` / `▲ LO ARALIK` / `▼ HI ARALIK`
    5. **Emisyon & Spektral Bilgi**: `ε: 1.00` ve pirometrenin dalgaboyu bandı (`0.9µm`, `1.6µm`, `3.9µm`, `8-14µm`)
  - Yan paneldeki LCD ekran ve baş üstü holografik HUD göstergesi de aynı canlı değerle senkronize çalışır.

---

### 3. Siyah Cisim Hedefleme & Işın Yakalama Hassasiyeti (`BlackBodySource.tsx`)
- `MK1600` ve `MK1200` siyah cisim fırınlarının kavite ağzındaki görünmez ışın hedefleme dairesi `circleGeometry` yarıçapı `0.046m`'den `0.065m`'ye genişletilerek VR ve masaüstü nişan almada toleranslı hale getirildi.
- Ön ısı kalkanı plakası (`frontPlateRef`) ve iç silindirik tüp de dinamik `userData` ile donatıldı; fırının kavite ağzına veya ön plakasına gelen tüm lazer ışınları anında fırının gerçek zamanlı sıcaklığını pirometreye aktarır.

---

### 4. Tetikleme ile Canlı Tarama & Ölçüm Kilitleme (SCAN / HOLD)
- Pirometre siyah cismin ışıma yapan yerine tutulduğu anda ekranında hedef sıcaklık **canlı olarak (SCAN modunda)** akar.
- Tetiğe basıldığında:
  - Flaş efekti patlar, kumanda titreşimi (haptic pulse) verilir, değer ekranda dondurulur (`HOLD`) ve metroloji loguna kaydedilir.
- Tetiğe tekrar basıldığında:
  - Cihaz tekrar anlık canlı tarama moduna (`SCAN`) döner.

---

### 5. Laboratuvardaki Tüm Cihazlar İçin Kapsam
Aşağıdaki tüm radyasyon ölçüm cihazları entegre edildi:
1. **LAND CYCLOPS 100L** (λ = 0.90 µm NIR, Yüksek Sıcaklık Optik Pirometresi)
2. **LAND CYCLOPS 160B** (λ = 1.60 µm SWIR, Kısa Dalga Pirometresi)
3. **HEITRONICS KT19** (λ = 3.90 µm MWIR, Orta Dalga Pirometresi)
4. **HEITRONICS KT19.82 II** (λ = 8-14 µm LWIR, Uzun Dalga Piroelektrik Standart)
5. **MIKRON M90 LWIR** (λ = 8-14 µm LWIR, Termopil Pirometresi)
6. **Fluke 62 MAX+ Çift Lazerli IR Termometre** (Menzili 1650°C'ye çıkarıldı, arka dijital ekranda canlı gösterir)
7. **Optris CTlaser SWIR Fiber Optik Pirometre** (Sensör HUD ve masaüstü konsolunda anlık gösterir)
8. **Kaybolan Filamanlı Optik Pirometre** (Analog kadran ve HUD üzerinde hedefin sıcaklığını gösterir)
9. **FLIR T1020 & E8-XT Termal Kameralar** (Hedef siyah cisme doğrultulduğunda termal spot ve hedef sıcaklığını gösterir)

---

## 🧪 Derleme & Doğrulama
- `npm run build` (`tsc -b && vite build`) komutu çalıştırıldı ve **0 hata ile 1.05 saniyede** başarıyla derlendi.
