import type { Transaksi, User } from '../types';
import { IndexedDbService } from './indexedDb';
import { FirebaseSyncService } from './firebaseSync';

export interface InitializeCoreOptions {
  activeLaundryId?: string;
  currentUser?: User | null;
  onTransaksiHydrated?: (list: Transaksi[]) => void;
  onPwaUpdateAvailable?: (needRefresh: boolean) => void;
}

let isCoreInitializing = false;
let isCoreInitialized = false;

/**
 * Inisialisasi Inti (Core) Aplikasi Kafelas Laundry.
 *
 * Memindahkan semua modul berat dari jalur rendering awal (First Contentful Paint):
 * 1. PWA Service Worker (virtual:pwa-register & workbox-window)
 * 2. IndexedDB Transaction Hydration
 * 3. Cloud Outbox Synchronization
 * 4. Midtrans Gateway Configuration
 *
 * Fungsi ini dipanggil HANYA setelah Splash Screen selesai
 * (atau ditunda secara asinkron setelah render pertama selesai pada pengguna yang kembali),
 * sehingga initial boot time aplikasi POS tetap terjamin di bawah 2 detik.
 */
export async function initializeCore(options: InitializeCoreOptions = {}): Promise<void> {
  if (isCoreInitialized || isCoreInitializing) {
    // Jika branch berganti dan sudah terinisialisasi, hidrasi branch baru secara non-blocking
    if (isCoreInitialized && options.activeLaundryId && options.onTransaksiHydrated) {
      IndexedDbService.hydrateBranchTransaksi(options.activeLaundryId)
        .then((idbList) => {
          if (idbList && idbList.length > 0 && options.onTransaksiHydrated) {
            options.onTransaksiHydrated(idbList);
          }
        })
        .catch((err) => {
          console.warn('[CoreInit] Gagal hidrasi switch branch IndexedDB:', err);
        });
    }
    return;
  }

  isCoreInitializing = true;

  try {
    // 1. Inisialisasi PWA Service Worker di background (dinamis agar workbox-window tidak membebani FCP)
    import('./pwaUpdater')
      .then(({ initPWA, subscribePwaUpdate }) => {
        initPWA();
        if (options.onPwaUpdateAvailable) {
          subscribePwaUpdate(options.onPwaUpdateAvailable);
        }
      })
      .catch((err) => {
        console.warn('[CoreInit] Gagal menginisialisasi PWA Service Worker:', err);
      });

    // 2. Inisialisasi & Hidrasi Database Lokal (IndexedDB)
    if (options.activeLaundryId) {
      IndexedDbService.hydrateBranchTransaksi(options.activeLaundryId)
        .then((idbList) => {
          if (idbList && idbList.length > 0 && options.onTransaksiHydrated) {
            options.onTransaksiHydrated(idbList);
          }
        })
        .catch((err) => {
          console.warn('[CoreInit] Gagal menghidrasi transaksi IndexedDB:', err);
        });
    }

    // 3. Inisialisasi Sinkronisasi Cloud Outbox jika online & ada user aktif
    if (options.currentUser && typeof navigator !== 'undefined' && navigator.onLine) {
      FirebaseSyncService.syncPendingOutbox().catch((err) => {
        console.warn('[CoreInit] Gagal sinkronisasi outbox offline:', err);
      });
    }

    // 4. Inisialisasi Konfigurasi Payment Gateway di background
    if (options.currentUser) {
      import('../services/midtransService')
        .then(async ({ loadPaymentGatewayConfig }) => {
          await loadPaymentGatewayConfig().catch(console.warn);
        })
        .catch((err) => {
          console.warn('[CoreInit] Gagal memuat konfigurasi payment gateway:', err);
        });
    }

    isCoreInitialized = true;
  } finally {
    isCoreInitializing = false;
  }
}

export function isCoreReady(): boolean {
  return isCoreInitialized;
}
