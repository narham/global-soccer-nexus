

## Plan: Fitur Babak 1 dan Babak 2 di Modul Pertandingan

### Masalah Saat Ini
- Status pertandingan hanya: `scheduled → live → finished`
- Tidak ada pembagian babak (Babak 1, Istirahat, Babak 2)
- Skor babak pertama (`half_time_home_score`, `half_time_away_score`) sudah ada di database tapi tidak otomatis tercatat
- Timeline events tidak dikelompokkan per babak

### Perubahan yang Direncanakan

#### 1. Database Migration - Tambah enum values
Tambahkan status baru ke enum `match_status`:
- `first_half` - Babak 1 sedang berjalan
- `half_time` - Istirahat
- `second_half` - Babak 2 sedang berjalan

Sehingga flow menjadi: `scheduled → first_half → half_time → second_half → finished`

#### 2. MatchDetail.tsx - Tombol kontrol per fase
Ganti tombol "Mulai Pertandingan" / "Akhiri Pertandingan" dengan flow bertahap:
- `scheduled` → Tombol "Kick Off Babak 1"
- `first_half` → Tombol "Akhiri Babak 1" (otomatis simpan skor half-time)
- `half_time` → Tombol "Kick Off Babak 2"
- `second_half` → Tombol "Akhiri Pertandingan"
- Tampilkan badge fase saat ini (BABAK 1 / ISTIRAHAT / BABAK 2)

#### 3. MatchHeader.tsx - Tampilan skor per babak
- Tampilkan skor babak pertama (HT) di bawah skor utama jika sudah tersedia
- Tampilkan indikator fase saat ini (Babak 1 / Istirahat / Babak 2) dengan animasi pulse

#### 4. MatchEventsTab.tsx - Kelompokkan events per babak
- Pisahkan timeline menjadi 2 section: "Babak 1 (0'-45')" dan "Babak 2 (46'-90+)"
- Tambahkan separator visual "Istirahat / Half Time" di antara kedua babak
- Summary statistik per babak

#### 5. Update semua status labels
Update `getStatusLabel` di seluruh komponen yang menampilkan status pertandingan:
- `ClubMatchCard`, `CompetitionMatchesTab`, `MatchHeader`, `PublicMatchesTab`, `PublicLiveMatchesTab`
- `first_half` → "Babak 1"
- `half_time` → "Istirahat"  
- `second_half` → "Babak 2"

#### 6. MatchReportTab.tsx - Skor per babak
- Tampilkan "Skor Babak 1 (HT)" dan "Skor Akhir (FT)" secara terpisah di laporan

### Detail Teknis

**Migration SQL:**
```sql
ALTER TYPE public.match_status ADD VALUE 'first_half';
ALTER TYPE public.match_status ADD VALUE 'half_time';
ALTER TYPE public.match_status ADD VALUE 'second_half';
```

**Auto-save half-time score** (di `handleStatusChange` saat transisi `first_half → half_time`):
```typescript
if (newStatus === "half_time") {
  await supabase.from("matches").update({
    status: "half_time",
    half_time_home_score: match.home_score,
    half_time_away_score: match.away_score,
  }).eq("id", id);
}
```

### File yang Diubah
1. **Migration SQL** - Tambah enum values
2. `src/pages/MatchDetail.tsx` - Flow tombol bertahap
3. `src/components/matches/MatchHeader.tsx` - Skor HT + indikator fase
4. `src/components/matches/MatchEventsTab.tsx` - Grouping per babak
5. `src/components/matches/MatchReportTab.tsx` - Skor per babak
6. `src/components/clubs/ClubMatchCard.tsx` - Status label update
7. `src/components/clubs/ClubMatchManageDialog.tsx` - Status label
8. `src/components/competitions/CompetitionMatchesTab.tsx` - Status label
9. `src/components/public/PublicMatchesTab.tsx` - Status label
10. `src/components/public/PublicLiveMatchesTab.tsx` - Status label + include new live statuses

