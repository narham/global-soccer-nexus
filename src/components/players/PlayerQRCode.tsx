import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface PlayerQRCodeProps {
  playerId: string;
  size?: number;
}

export const PlayerQRCode: React.FC<PlayerQRCodeProps> = ({ playerId, size = 64 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrData = `${window.location.origin}/public/players/${playerId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      }).catch(console.error);
    }
  }, [qrData, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded"
      style={{ width: size, height: size }}
    />
  );
};
