import React, { useMemo, useState } from 'react';
import { Transaksi, Pengeluaran } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface DashboardMiniTrendChartProps {
  transaksiList: Transaksi[];
  pengeluaranList: Pengeluaran[];
  activeLaundryId: string;
  compact?: boolean;
}

interface DayBucket {
  key: string;
  shortLabel: string;
  dateLabel: string;
  income: number;
  expense: number;
  net: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const DashboardMiniTrendChart: React.FC<DashboardMiniTrendChartProps> = ({
  transaksiList,
  pengeluaranList,
  activeLaundryId,
  compact = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(6);

  const { buckets, current7Income, current7Expense, prev7Income, growthPercent, isPositiveGrowth } =
    useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const windowStart = todayStart - 6 * DAY_MS;
      const prevWindowStart = windowStart - 7 * DAY_MS;

      const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
      const fullFormatter = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      });

      const list: DayBucket[] = Array.from({ length: 7 }, (_, idx) => {
        const ts = windowStart + idx * DAY_MS;
        const d = new Date(ts);
        return {
          key: String(ts),
          shortLabel: idx === 6 ? 'Hr Ini' : dayFormatter.format(d).slice(0, 3),
          dateLabel: fullFormatter.format(d),
          income: 0,
          expense: 0,
          net: 0,
        };
      });

      let curInc = 0;
      let curExp = 0;
      let prvInc = 0;

      for (let i = 0; i < transaksiList.length; i++) {
        const t = transaksiList[i];
        if (!t || t.laundryId !== activeLaundryId) continue;

        // DP saat masuk
        if (!t.isTransisi) {
          const tm = t.tanggalMasuk;
          const dp = Math.min(t.totalHarga, t.jumlahDp || 0);
          if (tm >= windowStart && tm < windowStart + 7 * DAY_MS) {
            const idx = Math.floor((tm - windowStart) / DAY_MS);
            if (idx >= 0 && idx < 7) list[idx].income += dp;
            curInc += dp;
          } else if (tm >= prevWindowStart && tm < windowStart) {
            prvInc += dp;
          }
        }

        // Pelunasan saat pengambilan
        const pickupTs = t.tanggalPengambilan || 0;
        if (pickupTs > 0 && t.statusPembayaran === 'Lunas') {
          const pelunasan = Math.max(0, t.totalHarga - (t.jumlahDp || 0));
          if (pickupTs >= windowStart && pickupTs < windowStart + 7 * DAY_MS) {
            const idx = Math.floor((pickupTs - windowStart) / DAY_MS);
            if (idx >= 0 && idx < 7) list[idx].income += pelunasan;
            curInc += pelunasan;
          } else if (pickupTs >= prevWindowStart && pickupTs < windowStart) {
            prvInc += pelunasan;
          }
        }
      }

      for (let i = 0; i < pengeluaranList.length; i++) {
        const p = pengeluaranList[i];
        if (!p || p.laundryId !== activeLaundryId) continue;
        const pts = p.tanggal;
        const jml = p.jumlah || 0;
        if (pts >= windowStart && pts < windowStart + 7 * DAY_MS) {
          const idx = Math.floor((pts - windowStart) / DAY_MS);
          if (idx >= 0 && idx < 7) list[idx].expense += jml;
          curExp += jml;
        }
      }

      // Hitung net tiap hari
      for (let i = 0; i < list.length; i++) {
        list[i].net = list[i].income - list[i].expense;
      }

      const diff = curInc - prvInc;
      const growth = prvInc > 0 ? (diff / prvInc) * 100 : curInc > 0 ? 100 : 0;

      return {
        buckets: list,
        current7Income: curInc,
        current7Expense: curExp,
        prev7Income: prvInc,
        growthPercent: Math.abs(growth),
        isPositiveGrowth: diff >= 0,
      };
    }, [transaksiList, pengeluaranList, activeLaundryId]);

  const activeBucket = buckets[selectedIndex] || buckets[buckets.length - 1];

  return (
    <div
      className={
        compact
          ? 'pt-2.5 border-t border-slate-100 space-y-2'
          : 'pt-3 border-t border-slate-100 space-y-2.5'
      }
    >
      {/* 1. Header Tren Delta Persentase */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-slate-800 text-[11px] truncate">
            Tren Kas 7 Hari
          </span>
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
              isPositiveGrowth
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isPositiveGrowth ? (
              // Inline SVG Arrow Up
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Inline SVG Arrow Down
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M7 7L17 17M17 17H7M17 17V7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>{growthPercent.toFixed(1)}%</span>
          </span>
        </div>

        <span className="font-mono font-black text-xs text-emerald-700 tabular-nums shrink-0">
          +{formatRupiah(current7Income)}
        </span>
      </div>

      {/* 2. Grid Tabular 7 Hari Terakhir */}
      <div
        className="grid grid-cols-7 gap-1 p-1 bg-slate-50/90 rounded-xl border border-slate-200/80 text-center"
        role="group"
        aria-label="Ringkasan tren 7 hari terakhir"
      >
        {buckets.map((b, idx) => {
          const isSelected = idx === selectedIndex;
          const isToday = idx === 6;

          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`p-1 rounded-lg flex flex-col items-center justify-between transition cursor-pointer ${
                isSelected
                  ? 'bg-white shadow-2xs ring-1 ring-slate-300'
                  : 'hover:bg-white/60'
              }`}
            >
              <span
                className={`text-[9px] leading-tight font-black ${
                  isToday
                    ? 'text-[#800000]'
                    : isSelected
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                {b.shortLabel}
              </span>

              <span className="text-[10px] font-mono font-black text-emerald-700 tabular-nums mt-0.5 leading-none">
                {b.income >= 1000000
                  ? `${(b.income / 1000000).toFixed(1)}M`
                  : b.income >= 1000
                  ? `${Math.round(b.income / 1000)}k`
                  : b.income > 0
                  ? String(b.income)
                  : '-'}
              </span>

              {b.expense > 0 && (
                <span className="text-[9px] font-mono font-bold text-red-600 tabular-nums leading-none mt-0.5">
                  -{b.expense >= 1000000
                    ? `${(b.expense / 1000000).toFixed(1)}M`
                    : b.expense >= 1000
                    ? `${Math.round(b.expense / 1000)}k`
                    : String(b.expense)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Detail Ringkas Hari Terpilih */}
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/70 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{activeBucket.dateLabel}:</span>
          <span className="text-emerald-700 font-mono font-bold tabular-nums">
            Masuk {formatRupiah(activeBucket.income)}
          </span>
        </div>
        {activeBucket.expense > 0 ? (
          <span className="text-red-600 font-mono font-bold tabular-nums">
            Keluar {formatRupiah(activeBucket.expense)}
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-[10px]">Tanpa pengeluaran</span>
        )}
      </div>
    </div>
  );
};

export default DashboardMiniTrendChart;
