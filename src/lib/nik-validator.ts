import { getProvinceName, getCityName, isValidProvinceCode } from "./indonesia-regions";

export interface NIKValidationResult {
  isValid: boolean;
  errors: string[];
  info?: {
    province: string;
    city: string;
    district: string;
    dateOfBirth: Date;
    gender: "male" | "female";
  };
}

export function validateNIK(nik: string): NIKValidationResult {
  const errors: string[] = [];

  // Validasi panjang
  if (nik.length !== 16) {
    errors.push("NIK harus 16 digit");
    return { isValid: false, errors };
  }

  // Validasi hanya angka
  if (!/^\d+$/.test(nik)) {
    errors.push("NIK hanya boleh berisi angka");
    return { isValid: false, errors };
  }

  // Parse NIK
  const provinceCode = nik.substring(0, 2);
  const cityCode = nik.substring(2, 4);
  const districtCode = nik.substring(4, 6);
  let day = parseInt(nik.substring(6, 8));
  const month = parseInt(nik.substring(8, 10));
  const year = parseInt(nik.substring(10, 12));

  // Validasi kode provinsi
  if (!isValidProvinceCode(provinceCode)) {
    errors.push("Kode provinsi tidak valid");
  }

  // Deteksi gender (jika tanggal > 40, maka perempuan)
  const gender: "male" | "female" = day > 40 ? "female" : "male";
  if (day > 40) {
    day -= 40;
  }

  // Validasi tanggal
  if (day < 1 || day > 31) {
    errors.push("Tanggal lahir tidak valid");
  }

  if (month < 1 || month > 12) {
    errors.push("Bulan lahir tidak valid");
  }

  // Tentukan tahun lengkap (asumsi: 00-30 = 2000-2030, 31-99 = 1931-1999)
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  // Buat tanggal untuk validasi
  const dateOfBirth = new Date(fullYear, month - 1, day);
  if (
    dateOfBirth.getDate() !== day ||
    dateOfBirth.getMonth() !== month - 1 ||
    dateOfBirth.getFullYear() !== fullYear
  ) {
    errors.push("Tanggal lahir tidak valid");
  }

  // Cek apakah tanggal lahir tidak di masa depan
  if (dateOfBirth > new Date()) {
    errors.push("Tanggal lahir tidak boleh di masa depan");
  }

  const provinceName = getProvinceName(provinceCode);
  const cityName = getCityName(provinceCode, cityCode);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    info: {
      province: provinceName || `Kode ${provinceCode}`,
      city: cityName || `Kode ${provinceCode}.${cityCode}`,
      district: `Kecamatan ${districtCode}`,
      dateOfBirth,
      gender,
    },
  };
}

export function extractDateFromNIK(nik: string): Date | null {
  if (nik.length !== 16) return null;

  let day = parseInt(nik.substring(6, 8));
  const month = parseInt(nik.substring(8, 10));
  const year = parseInt(nik.substring(10, 12));

  // Adjust untuk perempuan
  if (day > 40) {
    day -= 40;
  }

  const fullYear = year <= 30 ? 2000 + year : 1900 + year;
  const date = new Date(fullYear, month - 1, day);

  // Validasi tanggal
  if (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === fullYear
  ) {
    return date;
  }

  return null;
}
