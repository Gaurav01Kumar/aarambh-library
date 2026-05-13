'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  onClose?: () => void;
  studentId?: string;
}

export function QRCodeDisplay({ value, title = 'QR Code', onClose, studentId }: QRCodeDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [qrValue, setQrValue] = useState(value);

  const generateQRCode = async () => {
    if (studentId) {
      setLoading(true);
      try {
        const response = await fetch(`/api/students/${studentId}/qr-code`, {
          method: 'POST',
        });
        const data = await response.json();
        if (data.success) {
          setQrValue(data.data.qrCode);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${title.replace(/\s+/g, '_')}_qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center break-all">
                {qrValue}
              </p>
              <div className="flex gap-2">
                <Button onClick={downloadQR} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {studentId && (
                  <Button
                    variant="outline"
                    onClick={generateQRCode}
                    disabled={loading}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}