import jsPDF from 'jspdf';

export interface MatchReportData {
  competition: string;
  matchDate: string;
  venue: string;
  attendance?: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  homeGoals: string[];
  awayGoals: string[];
  homeLineup: string;
  awayLineup: string;
  homeYellowCards: string[];
  homeRedCards: string[];
  awayYellowCards: string[];
  awayRedCards: string[];
  statistics: {
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number;
    awayCorners: number;
    homeFouls: number;
    awayFouls: number;
  };
  referee: string;
  assistantReferee1: string;
  assistantReferee2: string;
  fourthOfficial?: string;
  varOfficial?: string;
}

export function generateMatchReportPDF(data: MatchReportData): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper function to add text
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

  const addLine = () => {
    yPosition += 3;
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;
  };

  // Header
  addCenteredText('LAPORAN PERTANDINGAN RESMI', 16, 'bold');
  addCenteredText('OFFICIAL MATCH REPORT', 12);
  addCenteredText('Standar AFC/FIFA', 10);
  yPosition += 5;
  addLine();

  // Competition Info
  addText('INFORMASI KOMPETISI', 20, 12, 'bold');
  addText(`Kompetisi: ${data.competition}`, 20);
  addText(`Tanggal & Waktu: ${data.matchDate}`, 20);
  addText(`Venue: ${data.venue}`, 20);
  if (data.attendance) {
    addText(`Penonton: ${data.attendance.toLocaleString('id-ID')}`, 20);
  }
  yPosition += 5;
  addLine();

  // Final Score
  addCenteredText('SKOR AKHIR', 14, 'bold');
  const scoreText = `${data.homeTeam}  ${data.homeScore} : ${data.awayScore}  ${data.awayTeam}`;
  addCenteredText(scoreText, 16, 'bold');
  if (data.halfTimeHomeScore !== undefined && data.halfTimeAwayScore !== undefined) {
    addCenteredText(`(Babak Pertama: ${data.halfTimeHomeScore}-${data.halfTimeAwayScore})`, 10);
  }
  yPosition += 5;
  addLine();

  // Goals
  if (data.homeGoals.length > 0 || data.awayGoals.length > 0) {
    addText('PENCETAK GOL', 20, 12, 'bold');
    if (data.homeGoals.length > 0) {
      addText(`${data.homeTeam}: ${data.homeGoals.join(', ')}`, 20);
    }
    if (data.awayGoals.length > 0) {
      addText(`${data.awayTeam}: ${data.awayGoals.join(', ')}`, 20);
    }
    yPosition += 5;
    addLine();
  }

  // Check if new page needed
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 20;
  }

  // Lineups
  addText('SUSUNAN PEMAIN', 20, 12, 'bold');
  addText(`${data.homeTeam}:`, 20, 10, 'bold');
  const homeLineupLines = data.homeLineup.split('\n');
  homeLineupLines.forEach(line => {
    if (line.trim()) addText(line, 25, 9);
  });
  yPosition += 3;
  addText(`${data.awayTeam}:`, 20, 10, 'bold');
  const awayLineupLines = data.awayLineup.split('\n');
  awayLineupLines.forEach(line => {
    if (line.trim()) addText(line, 25, 9);
  });
  yPosition += 5;
  addLine();

  // Check if new page needed
  if (yPosition > 230) {
    pdf.addPage();
    yPosition = 20;
  }

  // Disciplinary
  if (data.homeYellowCards.length > 0 || data.homeRedCards.length > 0 || 
      data.awayYellowCards.length > 0 || data.awayRedCards.length > 0) {
    addText('KARTU', 20, 12, 'bold');
    if (data.homeYellowCards.length > 0) {
      addText(`🟨 ${data.homeTeam}: ${data.homeYellowCards.join(', ')}`, 20, 9);
    }
    if (data.homeRedCards.length > 0) {
      addText(`🟥 ${data.homeTeam}: ${data.homeRedCards.join(', ')}`, 20, 9);
    }
    if (data.awayYellowCards.length > 0) {
      addText(`🟨 ${data.awayTeam}: ${data.awayYellowCards.join(', ')}`, 20, 9);
    }
    if (data.awayRedCards.length > 0) {
      addText(`🟥 ${data.awayTeam}: ${data.awayRedCards.join(', ')}`, 20, 9);
    }
    yPosition += 5;
    addLine();
  }

  // Statistics
  addText('STATISTIK PERTANDINGAN', 20, 12, 'bold');
  addText(`Penguasaan Bola: ${data.statistics.homePossession}% - ${data.statistics.awayPossession}%`, 20);
  addText(`Tembakan: ${data.statistics.homeShots} - ${data.statistics.awayShots}`, 20);
  addText(`Tembakan Tepat Sasaran: ${data.statistics.homeShotsOnTarget} - ${data.statistics.awayShotsOnTarget}`, 20);
  addText(`Tendangan Sudut: ${data.statistics.homeCorners} - ${data.statistics.awayCorners}`, 20);
  addText(`Pelanggaran: ${data.statistics.homeFouls} - ${data.statistics.awayFouls}`, 20);
  yPosition += 5;
  addLine();

  // Match Officials
  addText('WASIT PERTANDINGAN', 20, 12, 'bold');
  addText(`Wasit Utama: ${data.referee}`, 20);
  addText(`Asisten Wasit 1: ${data.assistantReferee1}`, 20);
  addText(`Asisten Wasit 2: ${data.assistantReferee2}`, 20);
  if (data.fourthOfficial) {
    addText(`Wasit Keempat: ${data.fourthOfficial}`, 20);
  }
  if (data.varOfficial) {
    addText(`VAR: ${data.varOfficial}`, 20);
  }
  yPosition += 10;
  addLine();

  // Signatures
  addText('TANDA TANGAN', 20, 12, 'bold');
  yPosition += 10;
  
  const sigWidth = (pageWidth - 60) / 3;
  const sigY = yPosition;
  
  pdf.line(20, sigY + 15, 20 + sigWidth - 10, sigY + 15);
  pdf.setFontSize(9);
  pdf.text('Wasit', 20 + (sigWidth - 10 - pdf.getTextWidth('Wasit')) / 2, sigY + 20);
  
  pdf.line(30 + sigWidth, sigY + 15, 30 + sigWidth * 2 - 10, sigY + 15);
  pdf.text('Komite Pertandingan', 30 + sigWidth + (sigWidth - 10 - pdf.getTextWidth('Komite Pertandingan')) / 2, sigY + 20);
  
  pdf.line(40 + sigWidth * 2, sigY + 15, 40 + sigWidth * 3 - 10, sigY + 15);
  pdf.text('Federasi', 40 + sigWidth * 2 + (sigWidth - 10 - pdf.getTextWidth('Federasi')) / 2, sigY + 20);

  // Footer
  yPosition = pdf.internal.pageSize.getHeight() - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footerText = `Dicetak pada: ${new Date().toLocaleString('id-ID')}`;
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition);

  // Save
  const fileName = `Laporan_${data.homeTeam}_vs_${data.awayTeam}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
