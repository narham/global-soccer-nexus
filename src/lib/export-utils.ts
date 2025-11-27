import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Player Export to PDF
export function exportPlayersToPDF(players: any[], clubName?: string) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  const addText = (text: string, x: number, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.text(text, x, yPosition);
    yPosition += size / 2 + 2;
  };

  const addCenteredText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, (pageWidth - textWidth) / 2, yPosition);
    yPosition += size / 2 + 2;
  };

  // Header
  addCenteredText('DAFTAR PEMAIN', 16, 'bold');
  if (clubName) {
    addCenteredText(clubName, 12, 'bold');
  }
  yPosition += 5;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Player List
  players.forEach((player, index) => {
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }

    addText(`${index + 1}. ${player.full_name}`, 20, 10, 'bold');
    addText(`   Posisi: ${player.position}`, 20, 9);
    addText(`   Tanggal Lahir: ${new Date(player.date_of_birth).toLocaleDateString('id-ID')}`, 20, 9);
    addText(`   Kewarganegaraan: ${player.nationality}`, 20, 9);
    
    if (player.shirt_number) {
      addText(`   Nomor Punggung: ${player.shirt_number}`, 20, 9);
    }
    
    yPosition += 5;
  });

  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footerText = `Dicetak pada: ${new Date().toLocaleString('id-ID')}`;
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY);

  const fileName = clubName 
    ? `Daftar_Pemain_${clubName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    : `Daftar_Pemain_${new Date().toISOString().split('T')[0]}.pdf`;
  
  pdf.save(fileName);
}

// Player Export to Excel
export function exportPlayersToExcel(players: any[], clubName?: string) {
  const data = players.map((player, index) => ({
    'No': index + 1,
    'Nama Lengkap': player.full_name,
    'Posisi': player.position,
    'Tanggal Lahir': new Date(player.date_of_birth).toLocaleDateString('id-ID'),
    'Tempat Lahir': player.place_of_birth || '-',
    'Kewarganegaraan': player.nationality,
    'Tinggi (cm)': player.height_cm || '-',
    'Berat (kg)': player.weight_kg || '-',
    'Nomor Punggung': player.shirt_number || '-',
    'Kaki Dominan': player.preferred_foot || '-',
    'Status Registrasi': player.registration_status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemain');

  const fileName = clubName
    ? `Daftar_Pemain_${clubName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Daftar_Pemain_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

// Competition Statistics Export to Excel
export function exportCompetitionStatsToExcel(standings: any[], competitionName: string) {
  const data = standings.map((standing, index) => ({
    'Posisi': standing.position || index + 1,
    'Tim': standing.club?.name || '-',
    'Main': standing.played || 0,
    'Menang': standing.won || 0,
    'Seri': standing.drawn || 0,
    'Kalah': standing.lost || 0,
    'Gol Untuk': standing.goals_for || 0,
    'Gol Kebobolan': standing.goals_against || 0,
    'Selisih Gol': standing.goal_difference || 0,
    'Poin': standing.points || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Klasemen');

  const fileName = `Klasemen_${competitionName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// Competition Statistics Export to PDF
export function exportCompetitionStatsToPDF(standings: any[], competitionName: string) {
  const pdf = new jsPDF('landscape');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  const addCenteredText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, (pageWidth - textWidth) / 2, yPosition);
    yPosition += size / 2 + 2;
  };

  // Header
  addCenteredText('KLASEMEN KOMPETISI', 16, 'bold');
  addCenteredText(competitionName, 12, 'bold');
  yPosition += 5;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // Table Header
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const cols = ['Pos', 'Tim', 'Main', 'M', 'S', 'K', 'GM', 'GK', 'SG', 'Poin'];
  const colWidths = [15, 70, 20, 15, 15, 15, 20, 20, 20, 25];
  let xPos = 20;
  
  cols.forEach((col, i) => {
    pdf.text(col, xPos, yPosition);
    xPos += colWidths[i];
  });
  
  yPosition += 7;
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 7;

  // Table Content
  pdf.setFont('helvetica', 'normal');
  standings.forEach((standing, index) => {
    if (yPosition > 180) {
      pdf.addPage('landscape');
      yPosition = 20;
    }

    xPos = 20;
    const values = [
      (standing.position || index + 1).toString(),
      standing.club?.name || '-',
      (standing.played || 0).toString(),
      (standing.won || 0).toString(),
      (standing.drawn || 0).toString(),
      (standing.lost || 0).toString(),
      (standing.goals_for || 0).toString(),
      (standing.goals_against || 0).toString(),
      (standing.goal_difference || 0).toString(),
      (standing.points || 0).toString(),
    ];

    values.forEach((val, i) => {
      pdf.text(val, xPos, yPosition);
      xPos += colWidths[i];
    });

    yPosition += 7;
  });

  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footerText = `Dicetak pada: ${new Date().toLocaleString('id-ID')}`;
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY);

  const fileName = `Klasemen_${competitionName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
