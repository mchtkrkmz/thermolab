# 🧪 ThermoLab - Sunucu Başlatma ve Kullanım Kılavuzu

Bu doküman, **ThermoLab (WebXR Sıcaklık & Nem Metroloji Laboratuvarı)** projesini yerel bilgisayarınızda başlatmak, yerel ağdan (Meta Quest VR başlığı veya mobil cihazlar) erişmek ve laboratuvar simülasyonunu kullanmak için gereken tüm komutları ve adımları içermektedir.

---

## 📋 1. Ön Gereksinimler

Projenin sorunsuz çalışabilmesi için bilgisayarınızda aşağıdaki yazılımların kurulu olması gerekir:

- **Node.js**: v18.0 veya üzeri ([Node.js İndir](https://nodejs.org/))
- **npm**: Node.js ile birlikte gelen paket yöneticisi (v9 veya üzeri)
- **Tarayıcı**:
  - **Masaüstü:** Google Chrome, Microsoft Edge, Brave veya Opera (WebXR / WebGL 2.0 destekli)
  - **VR Başlığı:** Meta Quest Browser (Meta Quest 2 / 3 / Pro)

---

## ⚙️ 2. İlk Kurulum (Bağımlılıkları Yükleme)

Projeyi ilk kez çalıştırıyorsanız veya yeni paketler eklendiyse, terminali (PowerShell, CMD veya VS Code Terminali) proje ana dizininde açıp şu komutu çalıştırın:

```bash
npm install
```

> **İpucu:** Bu işlem `node_modules` klasörünü ve gerekli Three.js / React / WebXR kütüphanelerini indirecektir.

---

## 🚀 3. Sunucuyu Başlatma Komutları

### 💻 Windows CMD (Komut İstemi) ile Başlatma

Projenin bilgisayarınızdaki tam dosya yolu:
```text
C:\Users\m_kor\OneDrive\Belgeler\Vr\webxr-lab
```

#### Yöntem 1: CMD Açıp Komutları Yazma (Standart Yol)

1. Klavyeden **`Win + R`** tuşlarına basın, açılan kutucuğa **`cmd`** yazıp **Enter**'a basın (veya Windows Başlat menüsüne `cmd` yazın).
2. Açılan siyah pencereye sırasıyla şu komutları yazıp Enter'a basın:

```cmd
cd /d "C:\Users\m_kor\OneDrive\Belgeler\Vr\webxr-lab"
npm run dev
```

> **Önemli İpucu:** `cd /d` parametresi, komut istemi farklı bir sürücüde (örneğin `D:\`) olsa bile doğrudan hedef sürücüye ve klasöre geçiş yapmanızı sağlar.

---

#### Yöntem 2: Tek Satırda Başlatma

CMD penceresini açıp tek bir satır yapıştırarak çalıştırmak isterseniz:

```cmd
cd /d "C:\Users\m_kor\OneDrive\Belgeler\Vr\webxr-lab" && npm run dev
```

---

#### Yöntem 3: Dosya Gezgininden Hızlıca CMD Açma (En Pratik Yol)

1. Klasörlerinizden `C:\Users\m_kor\OneDrive\Belgeler\Vr\webxr-lab` klasörüne girin.
2. Üstteki **Adres Çubuğuna** tıklayın (yolun yazdığı yer).
3. Oraya doğrudan **`cmd`** yazıp **Enter** tuşuna basın.
4. Doğrudan proje klasöründe bir CMD penceresi açılacaktır. Açılan pencerede sadece şunu yazın:
   ```cmd
   npm run dev
   ```

---

#### Yöntem 4: Çift Tıklayarak Başlatma (`baslat.bat`)

Klasör içerisine sizin için hazır bir **`baslat.bat`** dosyası eklenmiştir.
- Klasör içindeki **`baslat.bat`** dosyasına **çift tıklamanız** yeterlidir. Otomatik olarak bağımlılıkları kontrol eder ve sunucuyu HTTPS modunda başlatır.

---

### 🔹 Komut Çalıştığında Terminal Çıktısı

Sunucu başarıyla başladığında CMD ekranında şu şekilde bir çıktı belirecektir:

```text
  VITE v8.2.2  ready in 350 ms

  ➜  Local:   https://localhost:5173/
  ➜  Network: https://192.168.1.XX:5173/
  ➜  press h + enter to show help
```

Sunucuyu kapatmak istediğinizde terminal ekranında **`Ctrl + C`** tuşlarına basabilir veya CMD penceresini kapatabilirsiniz.

---

## 🥽 4. VR Başlığı (Meta Quest 3) veya Farklı Cihazdan Bağlanma

WebXR API'leri güvenlik gereği **yalnızca HTTPS bağlantılarında** çalışmaktadır. Projenin Vite yapılandırması otomatik SSL sertifikası üretmektedir.

### Adım Adım VR Bağlantısı:

1. **Aynı Wi-Fi Ağına Bağlanın:**
   - Bilgisayarınız ile Meta Quest başlığınızın **aynı Wi-Fi ağına** bağlı olduğundan emin olun.
2. **Terminaldeki Network Adresini Not Edin:**
   - `npm run dev` çıktısındaki `https://192.168.x.x:5173/` IP adresini alın.
3. **Quest Browser'ı Açın:**
   - Adres çubuğuna terminalde gördüğünüz `https://<yerel-ip>:5173` adresini yazıp gidin.
4. **SSL Sertifika Uyarısını Geçin:**
   - Sertifika yerel (self-signed) üretildiği için tarayıcı `"Bağlantınız gizli değil"` uyarısı verecektir.
   - **"Gelişmiş" (Advanced)** butonuna tıklayın.
   - **"Siteye devam et (güvenli değil)" / "Proceed to site"** seçeneğini seçin.
5. **VR Moduna Giriş:**
   - Sayfa yüklendiğinde ekrandaki **"Enter VR"** butonuna basarak sanal metroloji laboratuvarına geçin.

---

## 💻 5. Masaüstü Tarayıcıda Kullanım

VR başlığınız olmasa bile projeyi masaüstü tarayıcınızda 3D olarak tam etkileşimli kullanabilirsiniz:

1. Tarayıcınızda [https://localhost:5173](https://localhost:5173) adresini açın.
2. Güvenlik uyarısını **Gelişmiş -> Devam Et** diyerek onaylayın.
3. Fare ve klavye kontrolleri ile laboratuvarı inceleyin:
   - **Sol Tık + Sürükle:** Kamera açısını döndürür (Orbit).
   - **Sağ Tık + Sürükle:** Kamerayı yatay/dikey kaydırır (Pan).
   - **Tekerlek (Scroll):** Yakınlaşma ve uzaklaşma (Zoom).
   - **Yön Tuşları (`←` `↑` `→` `↓`):** İklim kabini içindeki KEC cihazlarının konumunu milimetrik kaydırır.

---

## 🛠️ 6. Diğer Yararlı Komutlar

| Komut | Açıklama |
| :--- | :--- |
| `npm run dev` | HTTPS ve Ağ paylaşımı açık geliştirme sunucusunu başlatır. |
| `npm run build` | TypeScript tip kontrollerini yapar ve üretim için optimize `dist/` klasörünü derler. |
| `npm run preview` | Derlenmiş `dist` paketini yerel HTTPS sunucusunda test etmenizi sağlar. |
| `npm run lint` | Hızlı linter (`oxlint`) ile kod stil ve sözdizimi hatalarını denetler. |
| `npm run dev -- --port 3000` | Port çakışması durumunda farklı bir portta (örneğin 3000) başlatır. |

---

## ❓ 7. Sık Karşılaşılan Sorunlar ve Çözümleri

### 1. Meta Quest'ten `https://192.168.x.x:5173` Adresine Ulaşılamıyor
- **Windows Güvenlik Duvarı (Firewall):** Node.js için yerel ağ bağlantısı engellenmiş olabilir. Windows Güvenlik Duvarı ayarlarından Node.js'e **Özel Ağ (Private Network)** erişim izni verildiğinden emin olun.
- **Farklı Ağ (Misafir Ağı):** Bilgisayar ve Quest başlığının aynı modem ve aynı SSID'ye bağlı olduğundan (özellikle Misafir Ağı/Guest Wi-Fi olmadığından) emin olun.

### 2. "Enter VR" Butonu Görünmüyor veya Tıklanamıyor
- WebXR yalnızca **HTTPS** üzerinden veya masaüstünde **localhost** üzerinden aktiftir. HTTP (`http://...`) ile giriyorsanız çalışmaz; mutlaka `https://...` yazmalısınız.
- Quest Browser kullanıldığından emin olun.

### 3. Port 5173 Zaten Kullanımda Hatası
Eğer arka planda açık kalmış başka bir Vite oturumu varsa:
```bash
npm run dev -- --port 5174
```
komutunu kullanarak boş bir port üzerinden başlatabilirsiniz.
