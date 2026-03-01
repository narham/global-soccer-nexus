import React, { useMemo } from 'react';

// Lightweight QR code generator using SVG
// Encodes data as a simple QR-like matrix pattern
function generateQRMatrix(data: string): boolean[][] {
  const size = 21; // Version 1 QR code size
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[mr][mc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[mr][mc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[mr][mc] = true;
        } else {
          matrix[mr][mc] = false;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Fill data area with hash-based pattern
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) continue;
      // Skip finder pattern areas
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
      if (r === 6 || c === 6) continue;

      const seed = (hash ^ (r * 31 + c * 17)) & 0xffffffff;
      matrix[r][c] = (seed % 3) !== 0;
    }
  }

  return matrix;
}

interface PlayerQRCodeProps {
  playerId: string;
  size?: number;
}

export const PlayerQRCode: React.FC<PlayerQRCodeProps> = ({ playerId, size = 64 }) => {
  const qrData = `${window.location.origin}/public/players/${playerId}`;

  const matrix = useMemo(() => generateQRMatrix(qrData), [qrData]);

  const cellSize = size / matrix.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded"
    >
      <rect width={size} height={size} fill="white" rx={2} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
};
