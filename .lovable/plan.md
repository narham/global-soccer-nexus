

## Plan: Expand NIK City/Regency (Kabupaten/Kota) Extraction

### Problem
The current `indonesia-regions.ts` only has city data for 5 provinces (Jawa Barat, DKI Jakarta, Jawa Tengah, Jawa Timur, Bali). For NIK codes from other provinces (e.g., Sulawesi Selatan "73"), the city name falls back to generic "Kode 73.71" instead of showing the actual name like "Kota Makassar".

### Solution
Expand the `cities` array in `indonesia-regions.ts` to include kabupaten/kota data for **all 34 provinces** based on official BPS (Badan Pusat Statistik) codes.

### Changes

**1. `src/lib/indonesia-regions.ts`** — Add comprehensive city/regency data for all provinces:
- Aceh (11): ~23 kab/kota
- Sumatera Utara (12): ~33 kab/kota
- Sumatera Barat (13): ~19 kab/kota
- Riau (14): ~12 kab/kota
- Jambi (15): ~11 kab/kota
- Sumatera Selatan (16): ~17 kab/kota
- Bengkulu (17): ~10 kab/kota
- Lampung (18): ~15 kab/kota
- Kep. Bangka Belitung (19): ~7 kab/kota
- Kep. Riau (21): ~7 kab/kota
- Banten (36): ~8 kab/kota
- NTB (52): ~10 kab/kota
- NTT (53): ~22 kab/kota
- Kalimantan Barat (61): ~14 kab/kota
- Kalimantan Tengah (62): ~14 kab/kota
- Kalimantan Selatan (63): ~13 kab/kota
- Kalimantan Timur (64): ~10 kab/kota
- Kalimantan Utara (65): ~5 kab/kota
- Sulawesi Utara (71): ~15 kab/kota
- Sulawesi Tengah (72): ~13 kab/kota
- **Sulawesi Selatan (73)**: ~24 kab/kota (includes code "71" = Kota Makassar)
- Sulawesi Tenggara (74): ~17 kab/kota
- Gorontalo (75): ~6 kab/kota
- Sulawesi Barat (76): ~6 kab/kota
- Maluku (81): ~11 kab/kota
- Maluku Utara (82): ~10 kab/kota
- Papua Barat (91): ~13 kab/kota
- Papua (94): ~29 kab/kota
- DI Yogyakarta (34): ~5 kab/kota

Total: ~500 entries using official BPS codes.

**2. `src/components/players/NIKInput.tsx`** — Minor update to display format:
- Show "Kabupaten/Kota" label when city name is resolved
- Keep fallback "Kode XX.YY" when not found

**3. `src/lib/nik-validator.ts`** — No logic changes needed; it already calls `getCityName()` and falls back gracefully.

### Result
The NIK "7371031306690007" will display:
- **Lokasi:** Sulawesi Selatan, Kota Makassar
- **Tanggal Lahir:** 13 Juni 1969
- **Jenis Kelamin:** Laki-laki

