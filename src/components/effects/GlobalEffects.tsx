'use client';

import dynamic from 'next/dynamic';

const ScrollProgress = dynamic(
  () => import('@/components/effects/ScrollProgress'),
  { ssr: false }
);
const CursorGlow = dynamic(
  () => import('@/components/effects/CursorGlow'),
  { ssr: false }
);

export default function GlobalEffects() {
  return (
    <>
      <ScrollProgress />
      <CursorGlow />
    </>
  );
}
