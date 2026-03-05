'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeCardProps {
  url: string;
  label: string;
  icon: string;
}

export default function QRCodeCard({ url, label, icon }: QRCodeCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition-all group"
    >
      <div className="bg-white rounded-xl p-2">
        <QRCodeSVG
          value={url}
          size={100}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
          includeMargin={false}
        />
      </div>
      <div className="text-center">
        <span className="text-lg">{icon}</span>
        <p className="text-sm text-white/70 group-hover:text-white transition-colors mt-1">
          {label}
        </p>
      </div>
    </a>
  );
}
