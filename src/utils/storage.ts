import {
  User,
  Laundry,
  Layanan,
  Transaksi,
  Pelanggan,
  Pengeluaran,
  JenisPengeluaran,
  JenisPemasukan,
  SettingsData,
  SubscriptionHistory,
} from '../types';

const STORAGE_KEY_PREFIX = 'laundry_suci_';

// Initial default settings matching SettingsManager.kt
// Initial default settings for Kafelas Wash
export const defaultSettings: SettingsData = {
  appTitle: 'Kafelas Wash',
  printerName: 'RPP02N',
  headerStruk: 'KAFELAS WASH',
  address: 'Jl. Raya Otomotif No. 88',
  phoneNumber: '081234567890',
  footerStruk: 'Harap periksa barang berharga sebelum meninggalkan tempat cuci. Terima kasih atas kunjungan Anda!',
  chattyFooter: 'Kendaraan Kinclong, Perjalanan Tenang!',
  useLogo: false,
  logoPath: null,
  logoSize: 'sedang',
  estimasiDisplayMode: 0, // 0 = per item, 1 = single line
  pengambilanTanpaSelesai: true,
  tampilkanTombolCetak: true,
  tampilkanRincianBayar: true,
  selesaikanSaatDitugaskan: true,
  poinSystemEnabled: false,
  rupiahPerPoin: 10,
  nilaiTukarPoin: 1,
  pemasukanManualEnabled: true,
  waNotificationEnabled: true,
  tampilkanTombolAmbilNotaLama: false,
  hitungKerjaStaf: true,
};

// 5 Layanan Utama Sederhana (Fokus Cuci Mobil & Motor)
export const defaultLayananList: Layanan[] = [
  // 1. Layanan Utama: Cuci Mobil
  { id: 'lay-1', laundryId: 'lnd-1', nama: 'Cuci Mobil', harga: 35000, satuanHarga: 'Unit', durasi: '30 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, urutan: 0, kategori: 'Cuci Mobil' },

  // 2. Layanan Utama: Cuci Motor
  { id: 'lay-2', laundryId: 'lnd-1', nama: 'Cuci Motor', harga: 15000, satuanHarga: 'Unit', durasi: '20 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, urutan: 1, kategori: 'Cuci Motor' },

  // 3. Cuci Mobil Komplit (Vacuum + Semir)
  { id: 'lay-3', laundryId: 'lnd-1', nama: 'Cuci Mobil Komplit (+ Vacuum & Semir)', harga: 50000, satuanHarga: 'Unit', durasi: '45 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, urutan: 2, kategori: 'Cuci Mobil' },

  // 4. Cuci Motor Matic Besar / Sport
  { id: 'lay-4', laundryId: 'lnd-1', nama: 'Cuci Motor Matic Besar (NMAX/PCX)', harga: 20000, satuanHarga: 'Unit', durasi: '25 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, urutan: 3, kategori: 'Cuci Motor' },

  // 5. Cuci Kolong Hidrolik Mobil
  { id: 'lay-5', laundryId: 'lnd-1', nama: 'Cuci Kolong Hidrolik Mobil', harga: 65000, satuanHarga: 'Unit', durasi: '45 Menit', satuanDurasi: 'Menit', hitungBebanKerja: true, urutan: 4, kategori: 'Cuci Mobil' },
];

// Master Jenis Pengeluaran Cuci Kendaraan
export const defaultJenisPengeluaran: JenisPengeluaran[] = [
  { id: 'jp-1', nama: 'Shampo Salju & Snow Foam', harga: 95000, laundryId: 'lnd-1' },
  { id: 'jp-2', nama: 'Semir Ban Silicone Gel', harga: 75000, laundryId: 'lnd-1' },
  { id: 'jp-3', nama: 'Lap Kanebo & Microfiber', harga: 50000, laundryId: 'lnd-1' },
  { id: 'jp-4', nama: 'Pembersih Jamur Kaca & Tar Remover', harga: 60000, laundryId: 'lnd-1' },
  { id: 'jp-5', nama: 'Listrik Pompa Steam & Kompresor', harga: 150000, laundryId: 'lnd-1' },
  { id: 'jp-6', nama: 'Air Bersih Tangki / PDAM', harga: 80000, laundryId: 'lnd-1' },
];

// Master Jenis Pemasukan Manual
export const defaultJenisPemasukan: JenisPemasukan[] = [
  { id: 'jpm-1', nama: 'Penjualan Parfum Mobil / Gantung', harga: 25000, laundryId: 'lnd-1' },
  { id: 'jpm-2', nama: 'Penjualan Kanebo / Lap Baru', harga: 20000, laundryId: 'lnd-1' },
  { id: 'jpm-3', nama: 'Tip Kru Cuci', harga: 10000, laundryId: 'lnd-1' },
];

export const defaultOwnerUser: User = {
  uid: 'own-1',
  emailOrPhone: 'owner@kafelaswash.com',
  displayName: 'Kafelas Wash',
  nomorTelepon: '081234567890',
  role: 'owner',
  laundryId: 'lnd-1',
  laundries: {
    'lnd-1': 'Kafelas Wash',
  },
  walletBalance: 0,
  subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  subscriptionType: 'premium',
  createdAt: Date.now(),
};

export const defaultLaundries: Laundry[] = [
  {
    id: 'lnd-1',
    ownerId: 'own-1',
    namaLaundry: "-",
    alamat: '-',
    nomorTelepon: '-',
  },
];

// Default Customers (Empty as requested)
export const defaultPelangganList: Pelanggan[] = [];

// Helper to seed initial sample transactions (Empty as requested)
export function getInitialTransactions(): Transaksi[] {
  return [];
}

// Initial Sample Pengeluaran (Empty as requested)
export function getInitialPengeluaran(): Pengeluaran[] {
  return [];
}

export function getInitialSubscriptionHistory(): SubscriptionHistory[] {
  return [];
}

// LocalStorage Helper wrapper
export class StorageService {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (!data) return defaultValue;
      const parsed = JSON.parse(data);

      if (key === 'laundries' && Array.isArray(parsed)) {
        return parsed.map((l: any) => {
          let name = l?.namaLaundry;
          while (typeof name === 'object' && name !== null) {
            name = name.namaLaundry || name.name || "Kafelas Wash";
          }
          return {
            ...l,
            namaLaundry: typeof name === 'string' && name.trim() ? name : "Kafelas Wash",
            alamat: typeof l?.alamat === 'string' ? l.alamat : '',
            nomorTelepon: typeof l?.nomorTelepon === 'string' ? l.nomorTelepon : '',
          };
        }) as T;
      }

      if (key === 'active_user' && parsed && typeof parsed === 'object') {
        let name = (parsed as any).displayName;
        while (typeof name === 'object' && name !== null) {
          name = name.namaLaundry || name.displayName || name.name || 'Owner';
        }
        return {
          ...parsed,
          displayName: typeof name === 'string' && name.trim() ? name : 'Owner',
        } as T;
      }

      if (key === 'settings' && parsed && typeof parsed === 'object') {
        let header = (parsed as any).headerStruk;
        while (typeof header === 'object' && header !== null) {
          header = header.namaLaundry || header.headerStruk || "Kafelas Wash";
        }
        const hasCustomized = Boolean(localStorage.getItem(STORAGE_KEY_PREFIX + 'has_customized_settings'));
        const rawLogoPath = typeof (parsed as any).logoPath === 'string' ? (parsed as any).logoPath.trim() : null;
        const cleanLogoPath =
          !hasCustomized && rawLogoPath === '/logo-kafela.png' ? null : (rawLogoPath || null);
        return {
          ...parsed,
          headerStruk: typeof header === 'string' && header.trim() ? header : "KAFELAS WASH",
          logoPath: cleanLogoPath,
          useLogo: Boolean((parsed as any).useLogo && cleanLogoPath),
        } as T;
      }

      return parsed as T;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error (mungkin kuota localStorage penuh):', e);
      if (key === 'transaksi' && Array.isArray(value)) {
        try {
          const trimmed = (value as any[]).slice(0, 60);
          localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(trimmed));
        } catch {
          // Abaikan jika masih penuh
        }
      }
    }
  }

  static clearAllDummyData() {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'transaksi');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'pelanggan');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'pengeluaran');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'staff');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'manual_cash_logs');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'transaksi', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'pelanggan', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'pengeluaran', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'laundries', JSON.stringify(defaultLaundries));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(defaultSettings));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized_v3', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'wash_migrated_v3', 'true');
    } catch (e) {
      console.error('Clear dummy error:', e);
    }
  }

  static initData() {
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'initialized_v3')) {
      StorageService.set('settings', defaultSettings);
      StorageService.set('layanan', defaultLayananList);
      StorageService.set('jenis_pengeluaran', defaultJenisPengeluaran);
      StorageService.set('jenis_pemasukan', defaultJenisPemasukan);
      StorageService.set('pelanggan', []);
      StorageService.set('staff', []);
      StorageService.set('owner', defaultOwnerUser);
      StorageService.set('laundries', defaultLaundries);
      StorageService.set('current_laundry_id', 'lnd-1');
      StorageService.set('transaksi', []);
      StorageService.set('pengeluaran', []);
      StorageService.set('manual_cash_logs', []);
      StorageService.set('subscription_history', []);
      StorageService.set('initialized_v3', true);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'wash_migrated_v3', 'true');
    }

    // Auto-migration: Purge any lingering old laundry services, settings, and expense masters
    try {
      const isWashMigrated = localStorage.getItem(STORAGE_KEY_PREFIX + 'wash_migrated_v3');
      const existingLayanan = StorageService.get<Layanan[]>('layanan', []);
      
      const hasOldLaundryTerms = existingLayanan.some((l) => {
        const nameLower = (l.nama || '').toLowerCase();
        const unitLower = (l.satuanHarga || '').toLowerCase();
        return (
          nameLower.includes('setrika') ||
          nameLower.includes('bedcover') ||
          nameLower.includes('lipat') ||
          nameLower.includes('kiloan') ||
          nameLower.includes('sprei') ||
          nameLower.includes('selimut') ||
          nameLower.includes('gordyn') ||
          unitLower === 'kg'
        );
      });

      if (!isWashMigrated || hasOldLaundryTerms || existingLayanan.length === 0) {
        // Clean out laundry items, ensure vehicle wash items are active
        const nonLaundryItems = existingLayanan.filter((l) => {
          const nameLower = (l.nama || '').toLowerCase();
          const unitLower = (l.satuanHarga || '').toLowerCase();
          return (
            !nameLower.includes('setrika') &&
            !nameLower.includes('bedcover') &&
            !nameLower.includes('lipat') &&
            !nameLower.includes('kiloan') &&
            !nameLower.includes('sprei') &&
            !nameLower.includes('selimut') &&
            !nameLower.includes('gordyn') &&
            unitLower !== 'kg'
          );
        });

        // If all items were old laundry, reset to defaultLayananList
        if (nonLaundryItems.length === 0) {
          StorageService.set('layanan', defaultLayananList);
        } else {
          // Merge default vehicle wash services if not present
          const existingIds = new Set(nonLaundryItems.map((l) => l.id));
          const merged = [...nonLaundryItems];
          for (const defItem of defaultLayananList) {
            if (!existingIds.has(defItem.id)) {
              merged.push(defItem);
            }
          }
          StorageService.set('layanan', merged);
        }

        // Clean settings if headerStruk still has Laundry
        const existingSettings = StorageService.get<SettingsData>('settings', defaultSettings);
        if (
          existingSettings.headerStruk?.toLowerCase().includes('laundry') ||
          existingSettings.appTitle?.toLowerCase().includes('laundry')
        ) {
          StorageService.set('settings', {
            ...existingSettings,
            appTitle: 'Kafelas Wash',
            headerStruk: 'KAFELAS WASH',
            chattyFooter: 'Kendaraan Kinclong, Perjalanan Tenang!',
          });
        }

        // Clean expense categories if containing detergent/laundry items
        const existingExpenses = StorageService.get<JenisPengeluaran[]>('jenis_pengeluaran', []);
        const hasLaundryExpenses = existingExpenses.some((e) => {
          const name = (e.nama || '').toLowerCase();
          return name.includes('deterjen') || name.includes('pewangi') || name.includes('plastik laundry');
        });
        if (hasLaundryExpenses || existingExpenses.length === 0) {
          StorageService.set('jenis_pengeluaran', defaultJenisPengeluaran);
          StorageService.set('jenis_pemasukan', defaultJenisPemasukan);
        }

        localStorage.setItem(STORAGE_KEY_PREFIX + 'wash_migrated_v3', 'true');
      }

      // v4 Focus Migration: Ensure Cuci Mobil and Cuci Motor are prioritized at the very beginning (urutan awal)
      const isWashFocusMigrated = localStorage.getItem(STORAGE_KEY_PREFIX + 'wash_focus_v4');
      if (!isWashFocusMigrated) {
        const currentList = StorageService.get<Layanan[]>('layanan', []);
        if (currentList.length === 0) {
          StorageService.set('layanan', defaultLayananList);
        } else {
          // Check if default or custom list has Cuci Mobil and Cuci Motor in the beginning
          let carMain = currentList.find(
            (l) => l.id === 'lay-c1' || l.nama.toLowerCase() === 'cuci mobil' || l.nama.toLowerCase().startsWith('cuci mobil reguler')
          );
          let motorMain = currentList.find(
            (l) => l.id === 'lay-m1' || l.nama.toLowerCase() === 'cuci motor' || l.nama.toLowerCase().startsWith('cuci motor bebek')
          );

          if (!carMain) {
            carMain = defaultLayananList[0];
          } else {
            carMain = { ...carMain, nama: 'Cuci Mobil', kategori: 'Cuci Mobil', urutan: 0 };
          }

          if (!motorMain) {
            motorMain = defaultLayananList[1];
          } else {
            motorMain = { ...motorMain, nama: 'Cuci Motor', kategori: 'Cuci Motor', urutan: 1 };
          }

          const others = currentList.filter(
            (l) => l.id !== carMain!.id && l.id !== motorMain!.id
          );

          const reorganized: Layanan[] = [
            { ...carMain, urutan: 0 },
            { ...motorMain, urutan: 1 },
            ...others.map((it, idx) => ({ ...it, urutan: idx + 2 })),
          ];

          StorageService.set('layanan', reorganized);
        }
        localStorage.setItem(STORAGE_KEY_PREFIX + 'wash_focus_v4', 'true');
      }

      // v6 Simple 5 Services Migration: Reset or simplify to exactly 5 core services
      const is5ServicesMigrated = localStorage.getItem(STORAGE_KEY_PREFIX + 'wash_5_services_v6');
      if (!is5ServicesMigrated) {
        StorageService.set('layanan', defaultLayananList);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'wash_5_services_v6', 'true');
      }
    } catch (migErr) {
      console.warn('Wash migration error:', migErr);
    }
  }
}
