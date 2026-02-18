
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, ShieldCheck } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner with responsive configuration
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15, 
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner. ", error);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full max-w-sm md:max-w-md mx-auto space-y-4 md:space-y-6 px-2">
      <div className="relative group">
        {/* Decorative Overlay */}
        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-[32px] md:rounded-[40px] pointer-events-none z-10" />
        
        {/* The Scanning Viewport Container */}
        <div className="bg-slate-900 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-slate-800">
          <div id="reader" className="w-full" />
          
          {/* Custom Overlay Icons */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-2 bg-indigo-950/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">Live Feed</span>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full px-4 md:px-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2.5 md:p-4 rounded-[20px] md:rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-amber-500 rounded-lg md:rounded-xl">
                  <Camera size={14} md:size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest leading-none">Scanning</p>
                  <p className="text-[8px] text-white/60 font-medium">Keep device steady</p>
                </div>
              </div>
              <QrCode size={18} md:size={24} className="text-white/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 md:p-5 rounded-[24px] md:rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3 md:gap-4 shadow-sm">
        <div className="p-2 bg-indigo-600 rounded-lg md:rounded-xl shrink-0">
          <ShieldCheck size={16} md:size={20} className="text-white" />
        </div>
        <p className="text-[10px] md:text-xs font-medium text-indigo-900 dark:text-indigo-300 leading-relaxed">
          Align the student pass within the square. System updates are cryptographically signed.
        </p>
      </div>
    </div>
  );
};
