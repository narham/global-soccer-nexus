// Data provinsi dan kabupaten/kota Indonesia untuk validasi NIK

export interface Province {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
  provinceCode: string;
}

export const provinces: Province[] = [
  { code: "11", name: "Aceh" },
  { code: "12", name: "Sumatera Utara" },
  { code: "13", name: "Sumatera Barat" },
  { code: "14", name: "Riau" },
  { code: "15", name: "Jambi" },
  { code: "16", name: "Sumatera Selatan" },
  { code: "17", name: "Bengkulu" },
  { code: "18", name: "Lampung" },
  { code: "19", name: "Kepulauan Bangka Belitung" },
  { code: "21", name: "Kepulauan Riau" },
  { code: "31", name: "DKI Jakarta" },
  { code: "32", name: "Jawa Barat" },
  { code: "33", name: "Jawa Tengah" },
  { code: "34", name: "DI Yogyakarta" },
  { code: "35", name: "Jawa Timur" },
  { code: "36", name: "Banten" },
  { code: "51", name: "Bali" },
  { code: "52", name: "Nusa Tenggara Barat" },
  { code: "53", name: "Nusa Tenggara Timur" },
  { code: "61", name: "Kalimantan Barat" },
  { code: "62", name: "Kalimantan Tengah" },
  { code: "63", name: "Kalimantan Selatan" },
  { code: "64", name: "Kalimantan Timur" },
  { code: "65", name: "Kalimantan Utara" },
  { code: "71", name: "Sulawesi Utara" },
  { code: "72", name: "Sulawesi Tengah" },
  { code: "73", name: "Sulawesi Selatan" },
  { code: "74", name: "Sulawesi Tenggara" },
  { code: "75", name: "Gorontalo" },
  { code: "76", name: "Sulawesi Barat" },
  { code: "81", name: "Maluku" },
  { code: "82", name: "Maluku Utara" },
  { code: "91", name: "Papua Barat" },
  { code: "94", name: "Papua" },
];

export const cities: City[] = [
  // Jawa Barat (32)
  { code: "01", name: "Bogor", provinceCode: "32" },
  { code: "02", name: "Sukabumi", provinceCode: "32" },
  { code: "03", name: "Cianjur", provinceCode: "32" },
  { code: "04", name: "Bandung", provinceCode: "32" },
  { code: "05", name: "Garut", provinceCode: "32" },
  { code: "06", name: "Tasikmalaya", provinceCode: "32" },
  { code: "07", name: "Ciamis", provinceCode: "32" },
  { code: "71", name: "Kota Bogor", provinceCode: "32" },
  { code: "72", name: "Kota Sukabumi", provinceCode: "32" },
  { code: "73", name: "Kota Bandung", provinceCode: "32" },
  { code: "74", name: "Kota Cirebon", provinceCode: "32" },
  { code: "75", name: "Kota Bekasi", provinceCode: "32" },
  { code: "76", name: "Kota Depok", provinceCode: "32" },
  { code: "77", name: "Kota Cimahi", provinceCode: "32" },
  { code: "78", name: "Kota Tasikmalaya", provinceCode: "32" },
  { code: "79", name: "Kota Banjar", provinceCode: "32" },
  
  // DKI Jakarta (31)
  { code: "71", name: "Jakarta Selatan", provinceCode: "31" },
  { code: "72", name: "Jakarta Timur", provinceCode: "31" },
  { code: "73", name: "Jakarta Pusat", provinceCode: "31" },
  { code: "74", name: "Jakarta Barat", provinceCode: "31" },
  { code: "75", name: "Jakarta Utara", provinceCode: "31" },
  { code: "01", name: "Kepulauan Seribu", provinceCode: "31" },
  
  // Jawa Tengah (33)
  { code: "01", name: "Cilacap", provinceCode: "33" },
  { code: "02", name: "Banyumas", provinceCode: "33" },
  { code: "03", name: "Purbalingga", provinceCode: "33" },
  { code: "04", name: "Banjarnegara", provinceCode: "33" },
  { code: "71", name: "Kota Magelang", provinceCode: "33" },
  { code: "72", name: "Kota Surakarta", provinceCode: "33" },
  { code: "73", name: "Kota Salatiga", provinceCode: "33" },
  { code: "74", name: "Kota Semarang", provinceCode: "33" },
  { code: "75", name: "Kota Pekalongan", provinceCode: "33" },
  { code: "76", name: "Kota Tegal", provinceCode: "33" },
  
  // Jawa Timur (35)
  { code: "01", name: "Pacitan", provinceCode: "35" },
  { code: "02", name: "Ponorogo", provinceCode: "35" },
  { code: "03", name: "Trenggalek", provinceCode: "35" },
  { code: "04", name: "Tulungagung", provinceCode: "35" },
  { code: "71", name: "Kota Kediri", provinceCode: "35" },
  { code: "72", name: "Kota Blitar", provinceCode: "35" },
  { code: "73", name: "Kota Malang", provinceCode: "35" },
  { code: "74", name: "Kota Probolinggo", provinceCode: "35" },
  { code: "75", name: "Kota Pasuruan", provinceCode: "35" },
  { code: "76", name: "Kota Mojokerto", provinceCode: "35" },
  { code: "77", name: "Kota Madiun", provinceCode: "35" },
  { code: "78", name: "Kota Surabaya", provinceCode: "35" },
  { code: "79", name: "Kota Batu", provinceCode: "35" },
  
  // Bali (51)
  { code: "01", name: "Jembrana", provinceCode: "51" },
  { code: "02", name: "Tabanan", provinceCode: "51" },
  { code: "03", name: "Badung", provinceCode: "51" },
  { code: "04", name: "Gianyar", provinceCode: "51" },
  { code: "71", name: "Kota Denpasar", provinceCode: "51" },
];

export function getProvinceName(code: string): string | null {
  const province = provinces.find(p => p.code === code);
  return province ? province.name : null;
}

export function getCityName(provinceCode: string, cityCode: string): string | null {
  const city = cities.find(c => c.provinceCode === provinceCode && c.code === cityCode);
  return city ? city.name : null;
}

export function isValidProvinceCode(code: string): boolean {
  return provinces.some(p => p.code === code);
}

export function isValidCityCode(provinceCode: string, cityCode: string): boolean {
  return cities.some(c => c.provinceCode === provinceCode && c.code === cityCode);
}
