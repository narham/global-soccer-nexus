// Loader untuk data kecamatan Indonesia dari CSV
// Data sumber: https://github.com/fityannugroho/idn-area-data

let districtCache: Map<string, string> | null = null;
let loadingPromise: Promise<Map<string, string>> | null = null;

/**
 * Parse CSV data kecamatan ke Map
 * Key format: "PP.KK.CC" (provinsi.kabupaten.kecamatan)
 */
function parseDistrictCSV(csv: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = csv.trim().split("\n");
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Format: code,regency_code,name
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);
    
    if (firstComma === -1 || secondComma === -1) continue;
    
    const code = line.substring(0, firstComma).trim();
    const name = line.substring(secondComma + 1).trim();
    
    map.set(code, name);
  }
  
  return map;
}

/**
 * Load district data from CSV file (cached after first load)
 */
export async function loadDistricts(): Promise<Map<string, string>> {
  if (districtCache) return districtCache;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = fetch("/data/districts.csv")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load district data");
      return response.text();
    })
    .then(csv => {
      districtCache = parseDistrictCSV(csv);
      loadingPromise = null;
      return districtCache;
    })
    .catch(err => {
      console.error("Error loading district data:", err);
      loadingPromise = null;
      return new Map<string, string>();
    });
  
  return loadingPromise;
}

/**
 * Get district name by full code (PP.KK.CC)
 * Returns null if not loaded yet or not found
 */
export function getDistrictName(provinceCode: string, cityCode: string, districtCode: string): string | null {
  if (!districtCache) return null;
  
  const fullCode = `${provinceCode}.${cityCode}.${districtCode}`;
  return districtCache.get(fullCode) || null;
}

/**
 * Check if district data has been loaded
 */
export function isDistrictDataLoaded(): boolean {
  return districtCache !== null;
}

/**
 * Validate if a district code exists
 */
export function isValidDistrictCode(provinceCode: string, cityCode: string, districtCode: string): boolean | null {
  if (!districtCache) return null; // Data not loaded yet
  
  const fullCode = `${provinceCode}.${cityCode}.${districtCode}`;
  return districtCache.has(fullCode);
}
