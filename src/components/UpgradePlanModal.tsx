import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Building2,
  Wallet,
} from 'lucide-react';
import { User } from '../types';
import { LAUNDRY_TIER_CONFIG, normalizeTier, HARGA_PREMIUM_BULANAN } from '../utils/subscription';
import { formatRupiah } from '../utils/formatters';
import { buildWhatsAppAdminUrl } from '../services/midtransService';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  currentTier?: string | null;
  triggerReason?: string;
  onChoosePayment?: (method: 'midtrans' | 'manual') => void;
  onExtendWithWallet?: () => Promise<boolean> | boolean | void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTier,
  triggerReason,
  onChoosePayment,
  onExtendWithWallet,
}) => {
  const [isProcessingWallet, setIsProcessingWallet] = useState(false);
  const [showConfirmExtend, setShowConfirmExtend] = useState(false);

  if (!isOpen) return null;

  const activeTier = normalizeTier(currentTier);
  const newcomerConfig = LAUNDRY_TIER_CONFIG.newcomer;
  const premiumConfig = LAUNDRY_TIER_CONFIG.premium;
  const walletBalance = currentUser?.walletBalance || 0;
  const isOwner = currentUser?.role === 'owner';
  const canPayWithWallet = isOwner && walletBalance >= HARGA_PREMIUM_BULANAN;

  const waUrl = buildWhatsAppAdminUrl(
    'Halo Tim Kafelas Wash, saya tertarik untuk aktivasi Paket Premium seharga Rp 27.000/bulan untuk outlet saya. Mohon informasi aktivasi lisensi resminya.'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={() => {
        if (!isProcessingWallet) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#800000]">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pilihan Paket Langganan</h2>
              <p className="text-[11px] text-slate-500">Kafelas Wash Dashboard</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isProcessingWallet}
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {triggerReason && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 text-xs text-amber-900 flex items-center gap-2 shrink-0">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Fitur Terkunci:</strong> {triggerReason}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {/* Card Status Saldo & Role */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Saldo Dompet Owner</span>
                <span className="text-xs font-black text-slate-900 font-mono tabular-nums">
                  {formatRupiah(walletBalance)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Status Akun:</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isOwner ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {isOwner ? 'Owner (Berhak Perpanjang)' : 'Bukan Owner'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between bg-white transition ${
                activeTier === 'premium'
                  ? 'border-[#800000] shadow-md ring-1 ring-[#800000]/20'
                  : 'border-[#800000]/60 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#800000] flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    {premiumConfig.label}
                  </span>
                  {activeTier === 'premium' ? (
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#800000] bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      Rekomendasi
                    </span>
                  )}
                </div>
                <div className="mt-1 text-lg font-black text-slate-900 tabular-nums">
                  {formatRupiah(premiumConfig.priceMonthly)}
                  <span className="text-[11px] font-normal text-slate-500"> / 30 hari</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tanpa batas kuota transaksi bulanan & operasional penuh
                </p>

                <div className="mt-2 pt-2.5 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] text-slate-800 flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tanpa Batas Kuota Nota / Bulan</span>
                  </div>
                  <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tanpa Batas Pelanggan & Layanan</span>
                  </div>
                  <div className="text-[11px] text-slate-800 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Login Kasir Beda HP & Penugasan Staf</span>
                  </div>
                  <div className="text-[11px] text-slate-800 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Export Excel & PDF A4 Resmi</span>
                  </div>
                  <div className="text-[11px] text-slate-800 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Grafik Komparasi Laba Rugi</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                {/* 1. Alur Perpanjangan Langsung dari Saldo */}
                {canPayWithWallet && onExtendWithWallet ? (
                  <button
                    type="button"
                    disabled={isProcessingWallet}
                    onClick={() => setShowConfirmExtend(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm tabular-nums"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>
                      {activeTier === 'premium' ? 'Perpanjang' : 'Aktifkan'} dari Saldo (
                      {formatRupiah(HARGA_PREMIUM_BULANAN)})
                    </span>
                  </button>
                ) : isOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onChoosePayment?.('manual');
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Saldo Kurang ({formatRupiah(walletBalance)}) • Isi Saldo (Top-Up)
                    </span>
                  </button>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] text-center font-medium">
                    Hanya akun Owner yang dapat memperpanjang paket
                  </div>
                )}

                {/* 2. Opsi Pembayaran Lainnya (Top-Up / Midtrans / Transfer Biasa) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isProcessingWallet}
                    onClick={() => {
                      onClose();
                      onChoosePayment?.('midtrans');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white font-bold text-[11px] transition active:scale-98 cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Lewat Midtrans</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingWallet}
                    onClick={() => {
                      onClose();
                      onChoosePayment?.('manual');
                    }}
                    className="py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Top-Up Saldo</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border flex flex-col justify-between bg-white transition ${
                activeTier === 'newcomer'
                  ? 'border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{newcomerConfig.label}</span>
                  {activeTier === 'newcomer' && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="mt-1 text-lg font-black text-slate-900 tabular-nums">
                  Rp 0
                  <span className="text-[11px] font-normal text-slate-500"> / 7 hari (Trial)</span>
                </div>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Uji coba 7 hari • Tidak dapat diperpanjang</p>

                <div className="mt-2 pt-2.5 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tanpa Batas Kuota Nota / Bulan</span>
                  </div>
                  <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tanpa Batas Layanan & Pelanggan</span>
                  </div>
                  <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 Cabang & 1 Owner Mandiri</span>
                  </div>
                  <div className="text-[11px] text-rose-600 flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Tidak dapat diperpanjang (Wajib Premium setelah 7 hari)</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 text-center font-medium">
                  {activeTier === 'newcomer' ? 'Masa Trial 7 Hari Sedang Berjalan' : 'Paket Starter Awal Telah Berakhir'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-center text-[11px] text-slate-500">
            Perlu bantuan aktivasi atau penambahan cabang outlet? Silakan hubungi tim CS Kafelas Wash.
          </div>
        </div>

        <div className="bg-white p-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Garansi Lisensi Resmi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Tutup
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Tanya CS WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Modal Konfirmasi Perpanjangan Langsung dari Saldo */}
        {showConfirmExtend && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Konfirmasi Perpanjangan
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Paket Premium 30 Hari
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Dompet Saat Ini:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {formatRupiah(walletBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Biaya Perpanjangan (30 Hari):</span>
                  <span className="font-bold font-mono tabular-nums">
                    - {formatRupiah(HARGA_PREMIUM_BULANAN)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Sisa Saldo Dompet:</span>
                  <span className="font-mono tabular-nums text-emerald-700">
                    {formatRupiah(walletBalance - HARGA_PREMIUM_BULANAN)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Eksekusi Langsung ke Firestore</span>
                </div>
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  Tidak perlu persetujuan admin. Saldo dompet akan langsung dipotong dan masa aktif bertambah 30 hari seketika.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessingWallet}
                  onClick={() => setShowConfirmExtend(false)}
                  className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isProcessingWallet}
                  onClick={async () => {
                    setIsProcessingWallet(true);
                    try {
                      const ok = await onExtendWithWallet?.();
                      if (ok !== false) {
                        setShowConfirmExtend(false);
                        onClose();
                      }
                    } finally {
                      setIsProcessingWallet(false);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isProcessingWallet ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Ya, Perpanjang</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};