'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const WebsiteGame = dynamic(() => import('./WebsiteGame'), {
  ssr: false,
  loading: () => <p role="status" className="web-loading">Preparing Math Tank…</p>,
});
const WebsiteDemo = dynamic(() => import('./WebsiteDemo'), {
  ssr: false,
  loading: () => <p role="status" className="web-loading">Preparing your battle…</p>,
});

export default function Page() {
  const [battleMode, setBattleMode] = useState<boolean | null>(null);

  useEffect(() => {
    setBattleMode(new URLSearchParams(window.location.search).get('mode') === 'battle');
  }, []);

  if (battleMode === null) return <p role="status" className="web-loading">Preparing Math Tank…</p>;
  return battleMode ? <WebsiteDemo /> : <WebsiteGame />;
}
