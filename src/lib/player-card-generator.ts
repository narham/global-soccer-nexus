import jsPDF from 'jspdf';

export interface PlayerCardData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  clubName: string;
  clubLogo?: string;
  photoUrl?: string;
  shirtNumber?: number;
  cardNumber: string;
  validUntil: string;
}

export async function generatePlayerIDCard(playerData: PlayerCardData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 53.98], // Standard ID card size (credit card size)
  });

  const cardWidth = 85.6;
  const cardHeight = 53.98;

  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Border
  pdf.setDrawColor(0, 102, 204);
  pdf.setLineWidth(0.5);
  pdf.rect(2, 2, cardWidth - 4, cardHeight - 4);

  // Header
  pdf.setFillColor(0, 102, 204);
  pdf.rect(2, 2, cardWidth - 4, 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KARTU IDENTITAS PEMAIN', cardWidth / 2, 8, { align: 'center' });
  pdf.setFontSize(6);
  pdf.text('OFFICIAL PLAYER ID CARD', cardWidth / 2, 11.5, { align: 'center' });

  // Photo placeholder
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.rect(5, 16, 20, 25);
  
  if (playerData.photoUrl) {
    try {
      // In production, you'd load and add the actual image
      pdf.setFontSize(6);
      pdf.setTextColor(150, 150, 150);
      pdf.text('FOTO', 15, 28, { align: 'center' });
    } catch (e) {
      console.error('Failed to load photo:', e);
    }
  } else {
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    pdf.text('FOTO', 15, 28, { align: 'center' });
  }

  // Player Information
  pdf.setTextColor(0, 0, 0);
  let yPos = 18;

  // Name
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(playerData.fullName.toUpperCase(), 28, yPos);
  
  yPos += 5;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  
  // Position and Number
  const positionText = playerData.shirtNumber 
    ? `${playerData.position} • #${playerData.shirtNumber}`
    : playerData.position;
  pdf.text(positionText, 28, yPos);
  
  yPos += 5;
  pdf.setFontSize(6);
  
  // Date of Birth
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tanggal Lahir:', 28, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(playerData.dateOfBirth, 50, yPos);
  
  yPos += 4;
  
  // Nationality
  pdf.setFont('helvetica', 'bold');
  pdf.text('Kewarganegaraan:', 28, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(playerData.nationality, 50, yPos);
  
  yPos += 4;
  
  // Club
  pdf.setFont('helvetica', 'bold');
  pdf.text('Klub:', 28, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(playerData.clubName, 50, yPos);

  // Footer with card number and validity
  pdf.setFillColor(240, 240, 240);
  pdf.rect(2, cardHeight - 10, cardWidth - 4, 8, 'F');
  
  pdf.setFontSize(5);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`No. Kartu: ${playerData.cardNumber}`, 4, cardHeight - 6);
  pdf.text(`Berlaku hingga: ${playerData.validUntil}`, 4, cardHeight - 3.5);
  
  // QR Code placeholder (right side)
  pdf.rect(cardWidth - 14, cardHeight - 9.5, 12, 7);
  pdf.setFontSize(4);
  pdf.text('QR', cardWidth - 8, cardHeight - 5, { align: 'center' });

  // Save
  const fileName = `Kartu_Pemain_${playerData.fullName.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
}
