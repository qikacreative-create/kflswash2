import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Tag,
  Search,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  Car,
  Bike,
  ShieldCheck,
  Package,
  Layers,
  Lock,
} from 'lucide-react';
import { Layanan, SettingsData, VehicleCategory } from '../types';
import { formatRupiah, formatRibuanInput, bersihkanTitik } from '../utils/formatters';
import { useToast, useConfirm } from '../components/NotificationContext';
import { isProTier, getLaundryLimits } from '../utils/subscription';

interface KelolaLayananViewProps {
  onBack: () => void;
  layananList: Layanan[];
  activeLaundryId: string;
  settings?: SettingsData;
  currentTier?: string | null;
  onSaveLayanan: (layanan: Layanan) => void;
  onDeleteLayanan: (layananId: string) => void;
  onReorderLayanan: (reorderedList: Layanan[]) => void;
  onOpenUpgradeModal?: (reason?: string) => void;
}

// 5 Layanan Utama Sederhana (Fokus Cuci Mobil & Motor)
const PRESET_STANDAR_WASH: Omit<Layanan, 'id' | 'laundryId' | 'urutan'>[] = [
  // 1. Cuci Mobil
  { nama: 'Cuci Mobil', harga: 35000, satuanHarga: 'Unit', durasi: '30 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, kategori: 'Cuci Mobil' },

  // 2. Cuci Motor
  { nama: 'Cuci Motor', harga: 15000, satuanHarga: 'Unit', durasi: '20 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, kategori: 'Cuci Motor' },

  // 3. Cuci Mobil Komplit (+ Vacuum & Semir)
  { nama: 'Cuci Mobil Komplit (+ Vacuum & Semir)', harga: 50000, satuanHarga: 'Unit', durasi: '45 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, kategori: 'Cuci Mobil' },

  // 4. Cuci Motor Matic Besar (NMAX/PCX)
  { nama: 'Cuci Motor Matic Besar (NMAX/PCX)', harga: 20000, satuanHarga: 'Unit', durasi: '25 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, kategori: 'Cuci Motor' },

  // 5. Cuci Kolong Hidrolik Mobil
  { nama: 'Cuci Kolong Hidrolik Mobil', harga: 65000, satuanHarga: 'Unit', durasi: '45 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, kategori: 'Cuci Mobil' },
];

export const KelolaLayananView: React.FC<KelolaLayananViewProps> = ({
  onBack,
  layananList,
  activeLaundryId,
  settings,
  currentTier,
  onSaveLayanan,
  onDeleteLayanan,
  onReorderLayanan,
  onOpenUpgradeModal,
}) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [editingLayanan, setEditingLayanan] = useState<Layanan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | VehicleCategory>('all');

  const limits = getLaundryLimits(currentTier);
  const isLimitReached = layananList.length >= limits.maxServices;

  // Form states
  const [kategori, setKategori] = useState<VehicleCategory>('Cuci Mobil');
  const [nama, setNama] = useState('');
  const [hargaStr, setHargaStr] = useState('35.000');
  const [satuanHarga, setSatuanHarga] = useState('Unit');
  const [durasiAngka, setDurasiAngka] = useState('30');
  const [durasiSatuan, setDurasiSatuan] = useState('Menit');
  const [hitungBebanKerja, setHitungBebanKerja] = useState(true);

  // Helper function to deduce category if not explicitly set
  const resolveCategory = (lay: Layanan): VehicleCategory => {
    if (lay.kategori && ['Cuci Mobil', 'Cuci Motor', 'Cuci Helm', 'Lainnya'].includes(lay.kategori as VehicleCategory)) {
      return lay.kategori as VehicleCategory;
    }
    const lower = lay.nama.toLowerCase();
    if (lower.includes('mobil') || lower.includes('car') || lower.includes('kolong') || lower.includes('fogging')) {
      return 'Cuci Mobil';
    }
    if (lower.includes('motor') || lower.includes('nmax') || lower.includes('pcx') || lower.includes('matic') || lower.includes('moge')) {
      return 'Cuci Motor';
    }
    if (lower.includes('helm') || lower.includes('helmet')) {
      return 'Cuci Helm';
    }
    return 'Lainnya';
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: layananList.length,
      'Cuci Mobil': 0,
      'Cuci Motor': 0,
      'Cuci Helm': 0,
      Lainnya: 0,
    };
    layananList.forEach((lay) => {
      const cat = resolveCategory(lay);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.Lainnya++;
      }
    });
    return counts;
  }, [layananList]);

  // Sorted by urutan so Urutan 0 (Cuci Mobil) and Urutan 1 (Cuci Motor) are always at the top
  const sortedLayananList = useMemo(() => {
    return [...layananList].sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  }, [layananList]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return sortedLayananList.filter((lay) => {
      const matchSearch =
        lay.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lay.harga.toString().includes(searchQuery) ||
        lay.satuanHarga.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lay.kategori && lay.kategori.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeCategory !== 'all') {
        const cat = resolveCategory(lay);
        return cat === activeCategory;
      }
      return true;
    });
  }, [sortedLayananList, searchQuery, activeCategory]);

  const handlePrioritizeCoreServices = () => {
    if (layananList.length === 0) return;

    let carItem = layananList.find(
      (l) => l.nama.toLowerCase() === 'cuci mobil' || (l.kategori === 'Cuci Mobil' && l.nama.toLowerCase().includes('cuci mobil'))
    ) || layananList.find((l) => l.kategori === 'Cuci Mobil');

    let motorItem = layananList.find(
      (l) => l.nama.toLowerCase() === 'cuci motor' || (l.kategori === 'Cuci Motor' && l.nama.toLowerCase().includes('cuci motor'))
    ) || layananList.find((l) => l.kategori === 'Cuci Motor');

    const reordered: Layanan[] = [];
    if (carItem) reordered.push({ ...carItem, urutan: 0 });
    if (motorItem && motorItem.id !== carItem?.id) reordered.push({ ...motorItem, urutan: 1 });

    const existingIds = new Set(reordered.map((r) => r.id));
    layananList.forEach((lay) => {
      if (!existingIds.has(lay.id)) {
        reordered.push({ ...lay, urutan: reordered.length });
      }
    });

    onReorderLayanan(reordered);
    toast.success('Layanan Cuci Mobil (#1) & Cuci Motor (#2) berhasil diposisikan di urutan awal!');
  };

  const openAddModal = (presetCategory?: VehicleCategory) => {
    if (isLimitReached) {
      toast.warning(`Batas ${limits.maxServices} jenis layanan telah tercapai. Fitur penambahan layanan lebih banyak hanya untuk Paket Premium.`);
      return;
    }
    const cat = presetCategory || (activeCategory !== 'all' ? activeCategory : 'Cuci Mobil');
    setEditingLayanan(null);
    setKategori(cat);
    setNama('');
    if (cat === 'Cuci Mobil') {
      setHargaStr('35.000');
      setDurasiAngka('30');
      setDurasiSatuan('Menit');
      setSatuanHarga('Unit');
    } else if (cat === 'Cuci Motor') {
      setHargaStr('15.000');
      setDurasiAngka('20');
      setDurasiSatuan('Menit');
      setSatuanHarga('Unit');
    } else if (cat === 'Cuci Helm') {
      setHargaStr('20.000');
      setDurasiAngka('1');
      setDurasiSatuan('Jam');
      setSatuanHarga('Pcs');
    } else {
      setHargaStr('50.000');
      setDurasiAngka('1');
      setDurasiSatuan('Jam');
      setSatuanHarga('Paket');
    }
    setHitungBebanKerja(true);
    setIsModalOpen(true);
  };

  const openEditModal = (lay: Layanan) => {
    setEditingLayanan(lay);
    setKategori(resolveCategory(lay));
    setNama(lay.nama);
    setHargaStr(formatRibuanInput(lay.harga));
    setSatuanHarga(lay.satuanHarga);

    const parts = (lay.durasi || '30 Menit').split(' ');
    setDurasiAngka(parts[0] || '30');
    setDurasiSatuan(parts[1] || 'Menit');
    setHitungBebanKerja(lay.hitungBebanKerja);
    setIsModalOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_STANDAR_WASH[0]) => {
    setKategori(preset.kategori as VehicleCategory);
    setNama(preset.nama);
    setHargaStr(formatRibuanInput(preset.harga));
    setSatuanHarga(preset.satuanHarga);
    const parts = preset.durasi.split(' ');
    setDurasiAngka(parts[0] || '30');
    setDurasiSatuan(parts[1] || 'Menit');
    setHitungBebanKerja(preset.hitungBebanKerja);
  };

  const handleSave = () => {
    const numericHarga = bersihkanTitik(hargaStr);
    if (!nama.trim()) {
      toast.warning('Nama layanan wajib diisi.');
      return;
    }
    if (numericHarga <= 0) {
      toast.warning('Tarif harus lebih dari Rp 0.');
      return;
    }

    if (!editingLayanan && isLimitReached) {
      toast.warning(`Batas ${limits.maxServices} jenis layanan telah tercapai.`);
      return;
    }

    const payload: Layanan = {
      id: editingLayanan ? editingLayanan.id : `lay-${Date.now()}`,
      laundryId: activeLaundryId,
      kategori,
      nama: nama.trim(),
      harga: numericHarga,
      satuanHarga,
      durasi: `${durasiAngka} ${durasiSatuan}`,
      satuanDurasi: durasiSatuan,
      hitungBebanKerja,
      urutan: editingLayanan ? editingLayanan.urutan : layananList.length,
    };

    onSaveLayanan(payload);
    setIsModalOpen(false);
    toast.success(editingLayanan ? 'Layanan berhasil diperbarui!' : 'Layanan baru berhasil ditambahkan!');
  };

  const handleToggleBeban = (lay: Layanan) => {
    onSaveLayanan({
      ...lay,
      hitungBebanKerja: !lay.hitungBebanKerja,
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layananList.length) return;

    const updated = [...layananList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((it, idx) => ({ ...it, urutan: idx }));
    onReorderLayanan(reordered);
  };

  const handleResetToStandard = async () => {
    const ok = await confirm({
      title: 'Terapkan 5 Layanan Utama',
      message: 'Ganti atau reset daftar layanan menjadi 5 layanan cuci utama yang simpel (Cuci Mobil & Cuci Motor)?',
      confirmText: 'Ya, Terapkan 5 Layanan',
    });

    if (ok) {
      const clean5: Layanan[] = PRESET_STANDAR_WASH.map((preset, idx) => ({
        ...preset,
        id: `lay-${idx + 1}`,
        laundryId: activeLaundryId,
        urutan: idx,
      }));
      onReorderLayanan(clean5);
      toast.success('5 Layanan utama Kafelas Wash berhasil diterapkan!');
    }
  };

  const addNominal = (amt: number) => {
    const currentVal = bersihkanTitik(hargaStr);
    const nextVal = Math.max(0, currentVal + amt);
    setHargaStr(formatRibuanInput(nextVal));
  };

  const setNominal = (amt: number) => {
    setHargaStr(formatRibuanInput(amt));
  };

  // Helper to render category badge
  const renderCategoryBadge = (catName: VehicleCategory) => {
    switch (catName) {
      case 'Cuci Mobil':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Car className="w-3 h-3 text-blue-600" />
            <span>Cuci Mobil</span>
          </span>
        );
      case 'Cuci Motor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Bike className="w-3 h-3 text-emerald-600" />
            <span>Cuci Motor</span>
          </span>
        );
      case 'Cuci Helm':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>Cuci Helm</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Detailing / Lainnya</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-20">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-lg sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:scale-95 transition"
            title="Kembali ke Pengaturan"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-black text-base tracking-tight leading-tight">Kelola Layanan Cuci</h1>
            <p className="text-[11px] text-white/80 font-medium">
              Kafelas Wash • 5 Layanan Utama Mobil & Motor
            </p>
          </div>
        </div>

        <button
          onClick={() => openAddModal()}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ${
            isLimitReached
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-white text-[#800000] hover:bg-amber-50'
          }`}
        >
          {isLimitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          <span>{isLimitReached ? `Batas ${limits.maxServices} Penuh` : 'Tambah Layanan'}</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto w-full px-3 md:px-6 py-3 md:py-6 space-y-3">
        {/* Category Tabs: Fokus Utama pada Cuci Mobil & Cuci Motor di Awal */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => setActiveCategory('Cuci Mobil')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'Cuci Mobil'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cuci Mobil</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'Cuci Mobil' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categoryCounts['Cuci Mobil']}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('Cuci Motor')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'Cuci Motor'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Cuci Motor</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'Cuci Motor' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categoryCounts['Cuci Motor']}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#800000] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categoryCounts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('Lainnya')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategory === 'Lainnya'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Detailing / Lainnya</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'Lainnya' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {categoryCounts.Lainnya + (categoryCounts['Cuci Helm'] || 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Quick Controls */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari layanan (misal: Mobil, Motor, Salju, Hidrolik)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800000] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action helper bar with Prioritize Core Services */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
          <span className="font-medium text-[11px]">
            Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> layanan
            {activeCategory !== 'all' && ` kategori ${activeCategory}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToStandard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition shadow-2xs cursor-pointer"
              title="Reset dan terapkan 5 layanan utama cuci mobil & motor"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Terapkan 5 Layanan Utama</span>
            </button>
          </div>
        </div>

        {/* Services List Card Stack */}
        <main className="space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  {searchQuery ? 'Layanan Tidak Ditemukan' : 'Belum Ada Layanan di Kategori Ini'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada layanan yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                    : `Tambahkan layanan baru khusus untuk ${activeCategory === 'all' ? 'pencucian kendaraan' : activeCategory}.`}
                </p>
              </div>
              <div className="pt-1 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => openAddModal(activeCategory !== 'all' ? activeCategory : undefined)}
                  className="px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Tambah Layanan {activeCategory !== 'all' ? activeCategory : ''}
                </button>
                <button
                  onClick={handleResetToStandard}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Muat 5 Layanan Utama</span>
                </button>
              </div>
            </div>
          ) : (
            filteredList.map((lay, idx) => {
              const cat = resolveCategory(lay);
              const isExpress = (lay.durasi || '').toLowerCase().includes('menit') || (lay.durasi || '').toLowerCase().includes('1 jam');

              return (
                <div key={lay.id} className="flex flex-col gap-1.5 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-slate-300 transition">
                  {/* Baris 1: Kategori & Judul Layanan & Harga */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lay.urutan === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-600 text-white shadow-2xs">
                            ⭐ Urutan #1 Utama
                          </span>
                        )}
                        {lay.urutan === 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                            ⭐ Urutan #2 Utama
                          </span>
                        )}
                        {renderCategoryBadge(cat)}
                        <h4 className="font-bold text-xs text-slate-900 truncate">{lay.nama}</h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-[#800000] tracking-tight">{formatRupiah(lay.harga)}</span>
                      <span className="text-[10px] font-medium text-slate-400 ml-1">/ {lay.satuanHarga}</span>
                    </div>
                  </div>

                  {/* Baris 2: Info Durasi, Workload, dan Tombol Aksi */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Duration Pill */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                        isExpress ? 'bg-amber-100/80 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isExpress ? <Zap className="w-3 h-3 text-amber-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                        <span>{lay.durasi}</span>
                      </span>

                      {/* Staff workload indicator toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleBeban(lay)}
                        title="Klik untuk mengubah status hitungan beban kru cuci/washer"
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                          lay.hitungBebanKerja
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${lay.hitungBebanKerja ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>{lay.hitungBebanKerja ? 'Beban Kru Cuci Aktif' : 'Tanpa Beban'}</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveItem(idx, 'up')}
                          title="Pindah ke atas"
                          className="px-2 py-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition flex items-center justify-center border-r border-slate-200 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === layananList.length - 1}
                          onClick={() => moveItem(idx, 'down')}
                          title="Pindah ke bawah"
                          className="px-2 py-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 transition flex items-center justify-center cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => openEditModal(lay)}
                        className="p-1.5 rounded-xl text-slate-600 hover:text-[#800000] hover:bg-rose-50 border border-slate-200 bg-white shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Edit Layanan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Hapus Layanan',
                            message: `Yakin ingin menghapus layanan '${lay.nama}'?`,
                            confirmText: 'Ya, Hapus',
                            isDestructive: true,
                          });
                          if (ok) {
                            onDeleteLayanan(lay.id);
                            toast.success(`Layanan '${lay.nama}' berhasil dihapus.`);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 bg-white shadow-2xs transition active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#800000] text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">
                    {editingLayanan ? 'Ubah Layanan Cuci' : 'Tambah Layanan Baru'}
                  </h3>
                  <p className="text-[10px] text-white/80">
                    Kafelas Wash • Manajemen Kategori & Tarif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition active:scale-90 cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Category Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Kendaraan / Layanan *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setKategori('Cuci Mobil');
                      if (!editingLayanan && satuanHarga === 'Kg') setSatuanHarga('Unit');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      kategori === 'Cuci Mobil'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Car className="w-4 h-4 text-blue-600" />
                    <span>Cuci Mobil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKategori('Cuci Motor');
                      if (!editingLayanan && satuanHarga === 'Kg') setSatuanHarga('Unit');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      kategori === 'Cuci Motor'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span>Cuci Motor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKategori('Cuci Helm');
                      if (!editingLayanan) setSatuanHarga('Pcs');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      kategori === 'Cuci Helm'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Cuci Helm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKategori('Lainnya');
                      if (!editingLayanan) setSatuanHarga('Paket');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      kategori === 'Lainnya'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Detailing / Lainnya</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Selector filtered by selected category */}
              {!editingLayanan && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Pilihan Cepat Preset ({kategori}):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                    {PRESET_STANDAR_WASH.filter((p) => p.kategori === kategori).map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#800000] hover:text-[#800000] text-[11px] font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
                      >
                        {p.nama} ({formatRupiah(p.harga)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={
                    kategori === 'Cuci Mobil'
                      ? 'Contoh: Cuci Komplit Salju & Vacuum'
                      : kategori === 'Cuci Motor'
                      ? 'Contoh: Cuci Motor Matic Besar + Semir'
                      : kategori === 'Cuci Helm'
                      ? 'Contoh: Cuci Helm Full Face'
                      : 'Contoh: Poles Body Express'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Price & Unit Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Price Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarif Harga (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hargaStr}
                      onChange={(e) => setHargaStr(formatRibuanInput(e.target.value))}
                      placeholder="35.000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-[#800000] focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  {/* Quick increment buttons */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => addNominal(5000)}
                      className="flex-1 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition active:scale-95 cursor-pointer"
                    >
                      +5rb
                    </button>
                    <button
                      type="button"
                      onClick={() => addNominal(10000)}
                      className="flex-1 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition active:scale-95 cursor-pointer"
                    >
                      +10rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setNominal(15000)}
                      className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-[#800000] transition active:scale-95 cursor-pointer"
                    >
                      15rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setNominal(35000)}
                      className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-[#800000] transition active:scale-95 cursor-pointer"
                    >
                      35rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setNominal(50000)}
                      className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-[#800000] transition active:scale-95 cursor-pointer"
                    >
                      50rb
                    </button>
                  </div>
                </div>

                {/* Unit Select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Satuan Hitung
                  </label>
                  <select
                    value={satuanHarga}
                    onChange={(e) => setSatuanHarga(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                  >
                    <option value="Unit">Unit (Kendaraan)</option>
                    <option value="Mobil">Mobil</option>
                    <option value="Motor">Motor</option>
                    <option value="Pcs">Pcs (Helm / Satuan)</option>
                    <option value="Paket">Paket (Detailing / Full)</option>
                    <option value="Sesi">Sesi (Fogging / Treatment)</option>
                    <option value="Kg">Kg (Timbangan)</option>
                    <option value="Satuan">Satuan</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Contoh: per Unit mobil/motor yang dicuci
                  </p>
                </div>
              </div>

              {/* Duration Settings */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimasi Durasi Pengerjaan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={durasiAngka}
                      onChange={(e) => setDurasiAngka(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-center focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <select
                      value={durasiSatuan}
                      onChange={(e) => setDurasiSatuan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    >
                      <option value="Menit">Menit</option>
                      <option value="Jam">Jam</option>
                      <option value="Hari">Hari</option>
                    </select>
                  </div>
                </div>

                {/* Duration shortcut chips */}
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('20');
                      setDurasiSatuan('Menit');
                    }}
                    className="flex-1 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Zap className="w-2.5 h-2.5 text-emerald-600" />
                    <span>20 Menit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('30');
                      setDurasiSatuan('Menit');
                    }}
                    className="flex-1 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-600" />
                    <span>30 Menit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('45');
                      setDurasiSatuan('Menit');
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                  >
                    45 Menit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('1');
                      setDurasiSatuan('Jam');
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                  >
                    1 Jam
                  </button>
                </div>
              </div>

              {/* Hitung Beban Kerja Kru Cuci */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition">
                <input
                  type="checkbox"
                  checked={hitungBebanKerja}
                  onChange={(e) => setHitungBebanKerja(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#800000] rounded cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span>Hitung Beban Kerja Kru / Washer</span>
                    {settings?.hitungKerjaStaf === false && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                        Global Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Aktifkan jika pengerjaan unit kendaraan ini dihitung ke akumulasi performa kerja harian kru cuci.
                  </p>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-[#800000] hover:bg-[#660000] text-xs font-black text-white shadow-md transition active:scale-98 cursor-pointer"
                >
                  {editingLayanan ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
