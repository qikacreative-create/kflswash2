import React, { useState, useMemo } from 'react';
import { Building2, Trophy, ArrowUpRight, Filter, Table2, Layers, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export interface BranchPerformanceData {
  branchId: string;
  branchName: string;
  totalOmzet: number;
  totalUangMasuk: number;
  totalTrx: number;
  aov: number; // Average Order Value
  percentageContribution: number;
  address?: string | null;
  phone?: string | null;
}

export interface BranchComparisonD3ChartProps {
  data: BranchPerformanceData[];
  periodeLabel: string;
  onSelectBranch?: (branchId: string) => void;
  activeBranchId?: string;
}

type MetricType = 'omzet' | 'uangMasuk' | 'trx' | 'aov';
type SortType = 'desc' | 'asc' | 'name';

export const BranchComparisonD3Chart: React.FC<BranchComparisonD3ChartProps> = ({
  data,
  periodeLabel,
  onSelectBranch,
  activeBranchId,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('omzet');
  const [sortOrder, setSortOrder] = useState<SortType>('desc');

  // Urutkan data berdasarkan metrik dan pilihan sortir
  const sortedData = useMemo(() => {
    const list = [...data];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.branchName.localeCompare(b.branchName));
    }
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (selectedMetric === 'omzet') {
        valA = a.totalOmzet;
        valB = b.totalOmzet;
      } else if (selectedMetric === 'uangMasuk') {
        valA = a.totalUangMasuk;
        valB = b.totalUangMasuk;
      } else if (selectedMetric === 'trx') {
        valA = a.totalTrx;
        valB = b.totalTrx;
      } else {
        valA = a.aov;
        valB = b.aov;
      }
      return (valA - valB) * multiplier;
    });
  }, [data, selectedMetric, sortOrder]);

  // Cabang Terproduktif (Peringkat #1 berdasarkan Omzet)
  const topBranch = useMemo(() => {
    if (data.length === 0) return null;
    return [...data].sort((a, b) => b.totalOmzet - a.totalOmzet)[0];
  }, [data]);

  const totals = useMemo(() => {
    const totalOmzet = data.reduce((sum, item) => sum + item.totalOmzet, 0);
    const totalUangMasuk = data.reduce((sum, item) => sum + item.totalUangMasuk, 0);
    const totalTrx = data.reduce((sum, item) => sum + item.totalTrx, 0);
    const avgAov = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;
    return { totalOmzet, totalUangMasuk, totalTrx, avgAov };
  }, [data]);

  const getBranchDisplayName = (name: any): string => {
    if (typeof name === 'object' && name !== null) {
      return name.namaLaundry || 'Cabang';
    }
    return String(name || 'Cabang');
  };

  return (
    <div className="space-y-4">
      {/* 1. KONTROL FILTER & METRIK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        {/* Metric Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedMetric('omzet')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedMetric === 'omzet'
                ? 'bg-[#800000] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Omzet
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('uangMasuk')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedMetric === 'uangMasuk'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uang Kas Masuk
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('trx')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedMetric === 'trx'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jumlah Order
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('aov')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedMetric === 'aov'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rata-rata/Nota
          </button>
        </div>

        {/* Sort Order Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-[11px]">Urutan:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortType)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#800000] cursor-pointer"
          >
            <option value="desc">Tertinggi ke Terendah</option>
            <option value="asc">Terendah ke Tertinggi</option>
            <option value="name">Nama Cabang (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Banner informasi jika baru ada 1 cabang */}
      {data.length <= 1 && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <span className="font-bold block text-sky-950">1 Cabang Terdaftar</span>
              <span className="text-[11px] text-sky-800">
                Data di bawah menampilkan performa cabang utama. Jika Anda memiliki cabang ke-2 atau ke-3, tambahkan di menu <strong>Kelola Owner &gt; Tambah Cabang</strong> agar matriks tabel membandingkan performa otomatis.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. CARD JUARA / CABANG TERPRODUKTIF #1 */}
      {topBranch && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-rose-50/60 border border-amber-300/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300/60">
                  Cabang Terproduktif #1
                </span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-xs text-slate-500">{periodeLabel}</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {getBranchDisplayName(topBranch.branchName)}
              </h3>
              <p className="text-[11px] text-slate-500">
                Menyumbang <strong>{topBranch.percentageContribution.toFixed(1)}%</strong> dari total seluruh omzet bisnis wash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-amber-200/80 pt-2 sm:pt-0 sm:pl-5 text-right">
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Total Omzet</span>
              <span className="text-base sm:text-lg font-black text-[#800000] font-mono tabular-nums">
                {formatRupiah(topBranch.totalOmzet)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Volume Order</span>
              <span className="text-sm sm:text-base font-black text-slate-800 font-mono tabular-nums">
                {topBranch.totalTrx} Nota
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MATRIKS TABEL KOMPARASI PER CABANG (ZERO-D3 ULTRA FAST) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-[#800000]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Matriks Komparasi Kinerja Antar-Cabang
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-600">
            <span>Total Omzet: <strong className="text-[#800000]">{formatRupiah(totals.totalOmzet)}</strong></span>
            <span>·</span>
            <span>Total: <strong>{totals.totalTrx} Order</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3">Nama Cabang</th>
                <th className="py-2.5 px-3 text-right">Order</th>
                <th className="py-2.5 px-3 text-right">Uang Masuk</th>
                <th className="py-2.5 px-3 text-right">Rata-rata/Nota</th>
                <th className="py-2.5 px-3 text-right">Total Omzet</th>
                <th className="py-2.5 px-3 text-right w-28">Kontribusi</th>
                <th className="py-2.5 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.map((branch, idx) => {
                const isWinner = topBranch && branch.branchId === topBranch.branchId;
                const isActive = activeBranchId === branch.branchId;
                const branchNameStr = getBranchDisplayName(branch.branchName);

                return (
                  <tr
                    key={branch.branchId}
                    className={`hover:bg-slate-50/90 transition ${
                      isActive ? 'bg-amber-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          isWinner
                            ? 'bg-amber-400 text-slate-950 shadow-2xs'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>

                    {/* Nama Cabang */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {branchNameStr}
                        </span>
                        {isWinner && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Top #1
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </div>
                      {branch.address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {branch.address}
                        </div>
                      )}
                    </td>

                    {/* Order count */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">
                      {branch.totalTrx} Nota
                    </td>

                    {/* Uang Masuk */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {formatRupiah(branch.totalUangMasuk)}
                    </td>

                    {/* AOV */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">
                      {formatRupiah(branch.aov)}
                    </td>

                    {/* Omzet */}
                    <td className="py-3 px-3 text-right font-mono font-black text-[#800000] tabular-nums text-xs sm:text-sm">
                      {formatRupiah(branch.totalOmzet)}
                    </td>

                    {/* Kontribusi */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isWinner ? 'bg-amber-500' : 'bg-[#800000]'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(4, branch.percentageContribution))}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-600 tabular-nums">
                          {branch.percentageContribution.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Aksi Pilih */}
                    <td className="py-3 px-3 text-center">
                      {isActive ? (
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          Sedang Buka
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectBranch && onSelectBranch(branch.branchId)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#800000] text-slate-700 hover:text-white font-bold text-[10px] transition cursor-pointer"
                        >
                          Beralih
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                <td colSpan={2} className="py-3 px-3 uppercase text-[11px] tracking-wider font-black">
                  Total Seluruh Cabang ({sortedData.length})
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {totals.totalTrx} Nota
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 tabular-nums">
                  {formatRupiah(totals.totalUangMasuk)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                  {formatRupiah(totals.avgAov)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#800000] tabular-nums text-xs sm:text-sm">
                  {formatRupiah(totals.totalOmzet)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  100.0%
                </td>
                <td className="py-3 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-3 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>💡 Data komparasi dihitung real-time langsung dari database kasir tanpa beban grafik berat.</span>
          <span className="font-semibold text-slate-600">Tabular Ultra-Light</span>
        </div>
      </div>
    </div>
  );
};

export const BranchComparisonTable = BranchComparisonD3Chart;
export default BranchComparisonD3Chart;
