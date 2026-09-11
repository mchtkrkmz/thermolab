/**
 * Planck's Radiation Law (Planck Işınım Kanunu) ve Piroelektronik / Optik Pirometre Hesaplamaları
 * 
 * Birincil seviye radyasyon termometrisi ve spektral radyans denklemleri:
 * L(lambda, T) = c1 / (pi * lambda^5 * (exp(c2 / (lambda * T)) - 1))
 * 
 * Sabitler (CODATA / ITS-90):
 * c1 = 2 * pi * h * c^2 = 3.74177185e-16 W*m^2 = 1.1910428e8 W*µm^4 / (m^2 * sr)
 * c2 = h * c / k_B = 1.438776877e-2 m*K = 14387.77 µm*K
 */

export const PLANCK_C1 = 1.1910428e8 // W * µm^4 / (m^2 * sr)
export const PLANCK_C2 = 14387.77    // µm * K

/**
 * Belirli bir sıcaklık (T_celsius) ve dalgaboyunda (lambda_um) Planck spektral radyansını hesaplar.
 * @param lambda_um Spektral dalgaboyu (mikrometre, örn: 0.9, 1.6, 3.9, 10.0)
 * @param temp_C Sıcaklık (Santigrat derece)
 * @returns Spektral radyans [W / (m^2 * sr * µm)]
 */
export function calculatePlanckRadiance(lambda_um: number, temp_C: number): number {
  const temp_K = temp_C + 273.15
  if (temp_K <= 0 || lambda_um <= 0) return 0

  const exponent = PLANCK_C2 / (lambda_um * temp_K)
  // exp(>85) IEEE 754 sınırları için sıfıra çok yakın radyans demektir (sinyal yok)
  if (exponent > 85) return 0

  const denominator = Math.pow(lambda_um, 5) * (Math.exp(exponent) - 1)
  if (denominator <= 0) return 0

  return PLANCK_C1 / denominator
}

/**
 * Ölçülen spektral radyans değerinden Planck Kanununu tersine çevirerek radyans sıcaklığını hesaplar.
 * T_K = c2 / (lambda * ln(1 + c1 / (lambda^5 * L)))
 * @param lambda_um Spektral dalgaboyu (mikrometre)
 * @param radiance Spektral radyans [W / (m^2 * sr * µm)]
 * @returns Sıcaklık (Santigrat derece) veya sinyal yoksa null
 */
export function invertPlanckRadiance(lambda_um: number, radiance: number): number | null {
  if (radiance <= 0 || lambda_um <= 0) return null

  const ratio = PLANCK_C1 / (Math.pow(lambda_um, 5) * radiance)
  if (ratio <= 0) return null

  const temp_K = PLANCK_C2 / (lambda_um * Math.log(1 + ratio))
  if (!isFinite(temp_K) || temp_K <= 0) return null

  return temp_K - 273.15
}

/**
 * Pirometre ölçüm simülasyonu:
 * Hedef sıcaklık, hedef emisyon oranı, ortam yansıması ve pirometrenin kendi emisyon katsayısı ayarını
 * birleştirerek ölçülen değeri ve metrolojik durumu belirler.
 */
export interface PyrometerMeasurementResult {
  measuredTemp: number | null
  status: 'OK' | 'UNDER' | 'OVER'
  receivedRadiance: number
  displayString: string
}

export function simulatePyrometerMeasurement(
  targetTemp_C: number,
  targetEmissivity: number,
  ambientTemp_C: number,
  pyrometerEmissivitySetting: number,
  wavelength_um: number,
  minTemp_C: number,
  maxTemp_C: number
): PyrometerMeasurementResult {
  // 1. Hedefin yaydığı radyans + ortamdan yansıyan radyans
  const blackbodyRadiance = calculatePlanckRadiance(wavelength_um, targetTemp_C)
  const ambientRadiance = calculatePlanckRadiance(wavelength_um, ambientTemp_C)

  const eps_target = Math.max(0.01, Math.min(1.0, targetEmissivity))
  const receivedRadiance = (eps_target * blackbodyRadiance) + ((1 - eps_target) * ambientRadiance)

  // 2. Pirometrenin emisyon katsayısı düzeltmesi:
  // L_target_est = (L_received - (1 - eps_user) * L_ambient) / eps_user
  const eps_user = Math.max(0.1, Math.min(1.0, pyrometerEmissivitySetting))
  const correctedRadiance = (receivedRadiance - (1 - eps_user) * ambientRadiance) / eps_user

  // 3. Ters Planck Hesabı
  const calculatedTemp = invertPlanckRadiance(wavelength_um, correctedRadiance)

  // Hedef sıcaklığı veya ters Planck'tan elde edilen sıcaklık
  const finalTemp = calculatedTemp !== null
    ? Math.round(calculatedTemp * 10) / 10
    : Math.round(targetTemp_C * 10) / 10

  if (calculatedTemp === null || calculatedTemp < minTemp_C) {
    return {
      measuredTemp: finalTemp,
      status: 'UNDER',
      receivedRadiance,
      displayString: `${finalTemp >= 0 ? '+' : ''}${finalTemp.toFixed(1)} °C`
    }
  }

  if (calculatedTemp > maxTemp_C) {
    return {
      measuredTemp: finalTemp,
      status: 'OVER',
      receivedRadiance,
      displayString: `${finalTemp >= 0 ? '+' : ''}${finalTemp.toFixed(1)} °C`
    }
  }

  return {
    measuredTemp: finalTemp,
    status: 'OK',
    receivedRadiance,
    displayString: `${finalTemp >= 0 ? '+' : ''}${finalTemp.toFixed(1)} °C`
  }
}
