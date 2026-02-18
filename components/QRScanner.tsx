
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
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 20, 
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.75);
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full max-w-sm md:max-w-md mx-auto space-y-8 px-4">
      <div className="relative group">
        {/* HUD Overlay Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 z-30 rounded-tl-2xl translate-x-4 translate-y-4"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 z-30 rounded-tr-2xl -translate-x-4 translate-y-4"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 z-30 rounded-bl-2xl translate-x-4 -translate-y-4"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 z-30 rounded-br-2xl -translate-x-4 -translate-y-4"></div>
        
        {/* Scanning Beam Animation */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,1)] z-30 animate-[bounce_3s_infinite] pointer-events-none"></div>

        <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 transition-all duration-500 ring-1 ring-slate-200 dark:ring-white/10">
          <div id="reader" className="w-full" />
          
          <div className="absolute top-8 left-8 z-30 flex items-center gap-3 bg-indigo-950/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">Active Sensor</span>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full px-8">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-4xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl shadow-lg">
                  <Camera size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Optical Scan</p>
                  <p className="text-[10px] text-white/50 font-medium">Keep code steady</p>
                </div>
              </div>
              <QrCode size={24} className="text-white/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-4xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-5 shadow-sm">
        <div className="p-3 bg-indigo-600 rounded-2xl shrink-0 shadow-lg shadow-indigo-600/20">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <p className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300 leading-relaxed pt-1">
          Verification is processed locally. Ensure the digital pass is within the target area for high-speed cryptographic acknowledgment.
        </p>
      </div>
    </div>
  );
};
