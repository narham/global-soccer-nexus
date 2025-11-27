import * as XLSX from 'xlsx';

export type EntityType = 'clubs' | 'players' | 'competitions';

export const templateColumns = {
  clubs: [
    'Nama Klub*',
    'Nama Pendek',
    'Kota',
    'Alamat',
    'Nama Stadion',
    'Tahun Berdiri',
    'Warna Home',
    'Warna Away'
  ],
  players: [
    'Nama Lengkap*',
    'NIK',
    'Tempat Lahir',
    'Tanggal Lahir* (YYYY-MM-DD)',
    'Kewarganegaraan*',
    'Posisi* (GK/DF/MF/FW)',
    'No Punggung',
    'Tinggi (cm)',
    'Berat (kg)',
    'Kaki Dominan (Kanan/Kiri)'
  ],
  competitions: [
    'Nama Kompetisi*',
    'Musim*',
    'Jenis* (liga/piala/youth_league)',
    'Format* (round_robin/knockout/group_knockout)',
    'Tanggal Mulai* (YYYY-MM-DD)',
    'Tanggal Selesai (YYYY-MM-DD)',
    'Jumlah Tim',
    'Jumlah Grup',
    'Deskripsi'
  ]
};

export const exampleData = {
  clubs: [
    {
      'Nama Klub*': 'Persija Jakarta',
      'Nama Pendek': 'Persija',
      'Kota': 'Jakarta',
      'Alamat': 'Jl. Gelora Bung Karno',
      'Nama Stadion': 'Stadion Utama GBK',
      'Tahun Berdiri': '1928',
      'Warna Home': 'Merah',
      'Warna Away': 'Putih'
    },
    {
      'Nama Klub*': 'Persib Bandung',
      'Nama Pendek': 'Persib',
      'Kota': 'Bandung',
      'Alamat': 'Jl. Pajajaran',
      'Nama Stadion': 'Stadion Si Jalak Harupat',
      'Tahun Berdiri': '1933',
      'Warna Home': 'Biru',
      'Warna Away': 'Putih'
    }
  ],
  players: [
    {
      'Nama Lengkap*': 'Bambang Pamungkas',
      'NIK': '3171234567890123',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir* (YYYY-MM-DD)': '1980-06-10',
      'Kewarganegaraan*': 'Indonesia',
      'Posisi* (GK/DF/MF/FW)': 'FW',
      'No Punggung': '9',
      'Tinggi (cm)': '180',
      'Berat (kg)': '75',
      'Kaki Dominan (Kanan/Kiri)': 'Kanan'
    }
  ],
  competitions: [
    {
      'Nama Kompetisi*': 'Liga 1 Indonesia 2024/2025',
      'Musim*': '2024/2025',
      'Jenis* (liga/piala/youth_league)': 'liga',
      'Format* (round_robin/knockout/group_knockout)': 'round_robin',
      'Tanggal Mulai* (YYYY-MM-DD)': '2024-08-01',
      'Tanggal Selesai (YYYY-MM-DD)': '2025-05-30',
      'Jumlah Tim': '18',
      'Jumlah Grup': '',
      'Deskripsi': 'Kompetisi sepak bola tertinggi di Indonesia'
    }
  ]
};

export const downloadTemplate = (entityType: EntityType, format: 'xlsx' | 'csv' = 'xlsx') => {
  const columns = templateColumns[entityType];
  const examples = exampleData[entityType];
  
  // Create worksheet data with headers and examples
  const wsData = [columns, ...examples.map(example => columns.map(col => example[col] || ''))];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  // Set column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  
  const fileName = `template_${entityType}.${format}`;
  
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
};

export const columnMapping = {
  clubs: {
    'Nama Klub*': 'name',
    'Nama Pendek': 'short_name',
    'Kota': 'city',
    'Alamat': 'address',
    'Nama Stadion': 'stadium_name',
    'Tahun Berdiri': 'founded_year',
    'Warna Home': 'home_color',
    'Warna Away': 'away_color'
  },
  players: {
    'Nama Lengkap*': 'full_name',
    'NIK': 'nik',
    'Tempat Lahir': 'place_of_birth',
    'Tanggal Lahir* (YYYY-MM-DD)': 'date_of_birth',
    'Kewarganegaraan*': 'nationality',
    'Posisi* (GK/DF/MF/FW)': 'position',
    'No Punggung': 'shirt_number',
    'Tinggi (cm)': 'height_cm',
    'Berat (kg)': 'weight_kg',
    'Kaki Dominan (Kanan/Kiri)': 'preferred_foot'
  },
  competitions: {
    'Nama Kompetisi*': 'name',
    'Musim*': 'season',
    'Jenis* (liga/piala/youth_league)': 'type',
    'Format* (round_robin/knockout/group_knockout)': 'format',
    'Tanggal Mulai* (YYYY-MM-DD)': 'start_date',
    'Tanggal Selesai (YYYY-MM-DD)': 'end_date',
    'Jumlah Tim': 'num_teams',
    'Jumlah Grup': 'num_groups',
    'Deskripsi': 'description'
  }
};
