# ThermoLab - WebXR Sıcaklık & Nem Metroloji Laboratuvarı 🌡️🔬

[![GitHub Repository](https://img.shields.io/badge/GitHub-mchtkrkmz%2Fthermolab-blue?logo=github)](https://github.com/mchtkrkmz/thermolab)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%20%2F%20WebXR-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**ThermoLab**, uluslararası sıcaklık ölçeği **ITS-90 (International Temperature Scale of 1990)** birincil seviye sabit noktalarını ve endüstriyel iklimlendirme/nem kalibrasyon süreçlerini sanal gerçeklikte (WebXR / Meta Quest 3) ve masaüstü tarayıcılarda simüle eden gelişmiş bir 3D metroloji laboratuvarıdır.

---

## 🚀 Öne Çıkan Özellikler

### 1. ITS-90 Birincil Seviye Sabit Nokta İstasyonu (Primary Fixed-Points Suite)
- **Sabit Nokta Hücreleri & Fırınları:**
  - Cıva Üçlü Noktası (**Hg TPW**: $-38.8344\ ^\circ\text{C}$)
  - Su Üçlü Noktası (**TPW**: $+0.0100\ ^\circ\text{C}$)
  - Galyum Erime Noktası (**Ga**: $+29.7646\ ^\circ\text{C}$)
  - İndiyum Donma Noktası (**In**: $+156.5985\ ^\circ\text{C}$)
  - Kalay Donma Noktası (**Sn**: $+231.928\ ^\circ\text{C}$)
  - Çinko Donma Noktası (**Zn**: $+419.527\ ^\circ\text{C}$)
  - Alüminyum Donma Noktası (**Al**: $+660.323\ ^\circ\text{C}$)
  - Gümüş Donma Noktası (**Ag**: $+961.78\ ^\circ\text{C}$)
- **Etkileşimli Faz Değişimi & Gerçek Zamanlı Plato Grafiği:**
  - Standart Platin Direnç Termometresi (SPRT) daldırma ve çekme simülasyonu.
  - Sabit noktanın erime/donma faz geçiş platosunu milikelvin ($mK$) hassasiyetinde gösteren gerçek zamanlı telemetri grafiği.
- **Hassas AC/DC Direnç Köprüsü:**
  - Standart direnç ($R_s$) oranlama ölçümü ($W(T) = R(T) / R_{tpw}$).

---

### 2. ZHL_AKBLT (Model: G1TD) İklimlendirme Kabini & Nem Laboratuvarı
- **Optik Şeffaf Gözetleme Penceresi:**
  - İçerideki cihaz ekranlarını dışarıdan kapak açılmadan net okumayı sağlayan şeffaf cam.
  - 360° sızdırmaz çevre contası ve ön panel koruma kasası.
- **Müşteri Cihazları Kalibrasyon Senaryosu (KEC-1, KEC-2, KEC-3):**
  - Gerçek laboratuvar ortamlarındaki kalibrasyon testlerini taklit eden bağımsız sıcaklık ve bağıl nem sapmaları ($\Delta T, \Delta RH$).
  - **3D Konumlandırma & Yön Kontrolleri:**
    - Raf içi Sol, Sağ, İleri, Geri ve Üst/Alt raf geçiş kontrolleri.
    - Klavye yön tuşları (`←` `→` `↑` `↓`) ve 3D panel butonları ile anlık konum ayarlama.
- **Referans Çiy Noktası Aynası (Chilled Mirror Dew Point Meter):**
  - Kabin içerisindeki referans sıcaklık ve nem değerlerini yüksek hassasiyetle izleme.

---

### 3. Meta Quest 3 & WebXR Uyumluluğu
- **Sıfır Donma & Yüksek Akıcılık:**
  - Quest 3 başlığında 90 Hz akıcı VR performansı için throttle edilmiş React render döngüleri.
  - Çift el kontrolcü desteği, sanal lazer işaretçiler ve haptik dokunsal geri bildirim.

---

## 🛠️ Kurulum ve Çalıştırma

> 📖 **Detaylı Adım Adım Rehber:** Komutlar, VR başlık bağlantısı ve sorun giderme adımları için [KULLANIM_KILAVUZU.md](file:///c:/Users/m_kor/OneDrive/Belgeler/Vr/webxr-lab/KULLANIM_KILAVUZU.md) belgesine; kullanılan tüm teknolojiler ve mimari yapı için [TEKNOLOJI_VE_MIMARI.md](file:///c:/Users/m_kor/OneDrive/Belgeler/Vr/webxr-lab/TEKNOLOJI_VE_MIMARI.md) belgesine göz atabilirsiniz.

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- Modern bir WebXR destekli tarayıcı (Google Chrome, Microsoft Edge veya Meta Quest Browser)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/mchtkrkmz/thermolab.git
cd thermolab/webxr-lab
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirici Sunucusunu Başlatın (HTTPS Destekli)
```bash
npm run dev -- --host
```
> **Not:** WebXR oturumları HTTPS bağlantısı gerektirir. `@vitejs/plugin-basic-ssl` eklentisi yerel geliştirme için otomatik SSL sertifikası üretir.

### 4. Üretim Sürümü (Build) Alın
```bash
npm run build
```

---

## 📂 Proje Dizin Yapısı

```text
thermolab/
└── webxr-lab/
    ├── public/                     # Statik varlıklar ve modeller
    ├── src/
    │   ├── components/
    │   │   ├── ClimateCabinet.tsx        # ZHL_AKBLT G1TD İklim Kabini ve KEC Cihazları
    │   │   ├── FixedPointFurnacesSuite.tsx # ITS-90 Sabit Nokta Fırın İstasyonu
    │   │   ├── FixedPointBridge.tsx      # Direnç Köprüsü ve Plato Grafiği
    │   │   ├── DewPointMirror.tsx        # Referans Çiy Noktası Aynası
    │   │   ├── SPRTProbe.tsx             # Standart Platin Direnç Termometresi
    │   │   └── ...
    │   ├── App.tsx                       # Ana 3D Sahne ve WebXR Yapılandırması
    │   └── main.tsx                      # React Giriş Noktası
    ├── package.json
    ├── vite.config.ts
    └── README.md
```

---

## 👤 Geliştirici & Lisans

- **Geliştirici:** Mücahit Korkmaz ([@mchtkrkmz](https://github.com/mchtkrkmz))
- **Proje Bağlantısı:** [https://github.com/mchtkrkmz/thermolab](https://github.com/mchtkrkmz/thermolab)
- **Lisans:** MIT License
