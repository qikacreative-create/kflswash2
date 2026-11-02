import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CloudUpload,
  Wifi,
  WifiOff,
  RotateCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { Transaksi } from '../types';
import { IndexedDbService } from '../utils/indexedDb';
import { FirebaseSyncService } from '../utils/firebaseSync';
import { formatRupiah, formatJamWIB, formatTanggalIndo } from '../utils/formatters';
import { useToast } from './NotificationContext';

export interface OutboxItem extends Transaksi {
  queuedAt?: number;
}

interface OutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onSynced?: () => void;
}

export const OutboxModal: React.FC<OutboxModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  onSynced,
}) => {
  const toast = useToast();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const loadOutboxItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = (await IndexedDbService.getOutbox()) as OutboxItem[];
      // Urutkan dari yang terbaru dimasukkan ke antrean
      list.sort((a, b) => (b.queuedAt || b.tanggalMasuk || 0) - (a.queuedAt || a.tanggalMasuk || 0));
      setItems(list);
    } catch (e) {
      console.warn('Gagal memuat daftar antrean outbox:', e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadOutboxItems();
      setSyncProgress(null);
    }
  }, [isOpen, loadOutboxItems]);

  // Dengarkan pembaruan outbox real-time jika ada transaksi baru masuk antrean
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      loadOutboxItems();
    };
    window.addEventListener('kafelas-outbox-updated', handleUpdate);
    return () => window.removeEventListener('kafelas-outbox-updated', handleUpdate);
  }, [isOpen, loadOutboxItems]);

  const handleManualSync = async () => {
    if (isSyncing) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.warning('Perangkat masih offline (tidak ada sinyal internet). Data tetap aman di HP sampai sinyal kembali.');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: items.length });

    try {
      const result = await FirebaseSyncService.syncPendingOutbox((current, total) => {
        setSyncProgress({ current, total });
      });

      await loadOutboxItems();

      if (result.synced > 0) {
        toast.success(`Berhasil menyinkronkan ${result.synced} nota transaksi ke Cloud!`);
        if (onSynced) onSynced();
      }

      if (result.remaining === 0) {
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        toast.warning(`Masih ada ${result.remaining} nota tersisa di antrean. Akan dicoba ulang saat sinyal stabil.`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyinkronkan antrean ke server.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  if (!isOpen) return null;

  const totalNominal = items.reduce((sum, item) => sum + (item.totalHarga || 0), 0);

  const formatQueuedTime = (timestamp?: number) => {
    if (!timestamp) return 'Waktu tidak tercatat';
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu (${formatJamWIB(timestamp)})`;
    return formatTanggalIndo(new Date(timestamp), true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Diterima':
        return {
          label: 'Baru Masuk',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'Proses':
        return {
          label: 'Sedang Dikerjakan',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'Selesai':
        return {
          label: 'Selesai Cuci',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'Diambil':
        return {
          label: 'Telah Diambil',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Antrean Lokal (Outbox)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-amber-400 text-slate-950">
                  {items.length} Nota
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Data disimpan aman di memori HP saat sinyal internet buruk
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer relative z-10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Koneksi & Kartu Ringkasan */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          {/* Status Koneksi Bar */}
          <div
            className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/90 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <Wifi className="w-4 h-4 text-emerald-700" />
                  <span>Internet Terhubung — Siap Sinkronisasi</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />
                  <span>Mode Offline — Menunggu Jaringan Internet</span>
                </>
              )}
            </div>

            <span className="text-[11px] font-mono font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* 3 Kartu Mini Ringkasan */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Tertunda
              </span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                {items.length}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Nilai
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block truncate">
                {formatRupiah(totalNominal)}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Antrean
              </span>
              <span
                className={`text-[11px] font-black mt-0.5 block truncate ${
                  isSyncing
                    ? 'text-blue-600'
                    : isOnline
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {isSyncing ? 'Mengirim...' : isOnline ? 'Siap Kirim' : 'Tertahan di HP'}
              </span>
            </div>
          </div>

          {/* Progress Sinkronisasi Aktif */}
          {syncProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Mengirim ke Server Cloud...
                </span>
                <span className="font-mono">
                  {syncProgress.current} / {syncProgress.total} Nota
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((syncProgress.current / Math.max(1, syncProgress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Daftar Transaksi di Outbox (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <RotateCw className="w-6 h-6 text-slate-400 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Memeriksa antrean data di HP...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">Antrean Bersih (Tersinkron Penuh)</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Semua transaksi dan pembaruan status pengerjaan telah berhasil terkirim ke server Cloud.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Daftar Transaksi Tertunda</span>
                <span>{items.length} Pesanan</span>
              </div>

              {items.map((item, idx) => {
                const statusBadge = getStatusBadge(item.status);
                const isLunas = item.statusPembayaran === 'Lunas';
                const itemsCount = item.items?.length || 0;

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-[#800000] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            {item.nomorTransaksi || 'Nota Baru'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isLunas
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {isLunas ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mt-1 truncate">
                          {item.namaPelanggan || 'Pelanggan'}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 font-mono block">
                          {formatRupiah(item.totalHarga)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {itemsCount} Layanan
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Antrean: {formatQueuedTime(item.queuedAt || item.tanggalMasuk)}
                        </span>
                      </div>

                      {item.dikerjakanOleh && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{item.dikerjakanOleh}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kotak Edukasi / Jaminan Keamanan Data */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs space-y-1.5 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold text-blue-900">Data Anda 100% Aman di Memori Perangkat</p>
              <p className="text-[11px] text-blue-800">
                Semua nota &amp; perubahan indikator pengerjaan di atas tersimpan permanen di database internal HP. Begitu koneksi internet kembali normal, sistem otomatis mengunggahnya ke server.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs transition cursor-pointer active:scale-95 text-center"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || items.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#800000] hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? 'Menyinkronkan...'
                : isOnline
                ? 'Sinkronkan Sekarang'
                : 'Coba Hubungkan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
