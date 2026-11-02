import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, Wifi, CloudUpload, RotateCw, ExternalLink } from 'lucide-react';
import { IndexedDbService } from '../utils/indexedDb';
import { FirebaseSyncService } from '../utils/firebaseSync';
import { OutboxModal } from './OutboxModal.tsx';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOutboxModalOpen, setIsOutboxModalOpen] = useState(false);

  // Periksa sisa antrean outbox di IndexedDB
  const checkPendingOutbox = useCallback(async () => {
    try {
      const count = await IndexedDbService.getOutboxCount();
      setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Jalankan sinkronisasi senyap ke Cloud Firestore
  const triggerSilentSync = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await FirebaseSyncService.syncPendingOutbox();
    } finally {
      setIsSyncing(false);
      checkPendingOutbox();
    }
  }, [checkPendingOutbox]);

  useEffect(() => {
    checkPendingOutbox();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      triggerSilentSync();
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      triggerSilentSync();
      const timer = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      checkPendingOutbox();
    };

    const handleOutboxUpdate = () => {
      checkPendingOutbox();
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        triggerSilentSync();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && typeof navigator !== 'undefined' && navigator.onLine) {
        triggerSilentSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('kafelas-outbox-updated', handleOutboxUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat otomatis setiap 12 detik jika masih ada antrean dan perangkat online
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        IndexedDbService.getOutboxCount().then((count) => {
          setPendingCount(count);
          if (count > 0) {
            triggerSilentSync();
          }
        }).catch(() => {});
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('kafelas-outbox-updated', handleOutboxUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkPendingOutbox, triggerSilentSync]);

  return (
    <>
      {/* 1. Toast status pemulihan koneksi singkat */}
      {showReconnected && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg animate-fade-in pointer-events-none">
          <Wifi className="w-3.5 h-3.5" />
          <span>Terhubung kembali ke jaringan</span>
        </div>
      )}

      {/* 2. Banner strip saat sedang offline murni (Bisa diklik untuk melihat antrean) */}
      {!isOnline && (
        <div
          onClick={() => setIsOutboxModalOpen(true)}
          title="Klik untuk membuka rincian antrean transaksi offline"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600 hover:bg-amber-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xl cursor-pointer active:scale-95 transition"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span>Mode Offline — Data tersimpan di HP</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono font-bold">
              {pendingCount} Nota
            </span>
          )}
        </div>
      )}

      {/* 3. Floating Badge Nota Tertunda (Outbox Queue) - Klik untuk buka Modal Rincian */}
      {pendingCount > 0 && (
        <div className="fixed bottom-20 md:bottom-5 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            onClick={() => setIsOutboxModalOpen(true)}
            title="Klik untuk melihat rincian antrean & menyinkronkan data ke Cloud"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/95 text-white border border-amber-500/60 shadow-2xl backdrop-blur-xs cursor-pointer active:scale-95 transition select-none group hover:border-amber-400 hover:bg-slate-900"
          >
            <div className="relative flex items-center justify-center shrink-0">
              {isSyncing ? (
                <RotateCw className="w-4 h-4 text-amber-400 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>

            <div className="text-left min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300 font-mono tabular-nums leading-tight">
                  {pendingCount} Nota Tertunda
                </span>
                <span className="text-[10px] px-1 rounded bg-amber-400/20 text-amber-300 font-semibold hidden sm:inline">
                  Outbox
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight mt-0.5 truncate max-w-[170px] sm:max-w-none">
                {isSyncing
                  ? 'Sedang mengirim ke Cloud...'
                  : isOnline
                  ? 'Klik untuk lihat rincian & sinkronkan'
                  : 'Tersimpan di HP · Menunggu sinyal'}
              </p>
            </div>

            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0 ml-0.5" />
          </div>
        </div>
      )}

      {/* 4. Modal Rincian Antrean Outbox Informatif */}
      <OutboxModal
        isOpen={isOutboxModalOpen}
        onClose={() => {
          setIsOutboxModalOpen(false);
          checkPendingOutbox();
        }}
        isOnline={isOnline}
        onSynced={() => {
          checkPendingOutbox();
        }}
      />
    </>
  );
};

