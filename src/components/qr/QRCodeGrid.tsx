'use client';

import QRCodeCard from './QRCodeCard';
import { QR_LINKS } from '@/lib/constants';

export default function QRCodeGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {QR_LINKS.map((link) => (
        <QRCodeCard
          key={link.url}
          url={link.url}
          label={link.label}
          icon={link.icon}
        />
      ))}
    </div>
  );
}
