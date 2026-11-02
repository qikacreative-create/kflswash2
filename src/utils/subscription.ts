export type LaundryTier = 'newcomer' | 'premium';

export interface LaundrySubscriptionLimits {
  tier: LaundryTier;
  label: string;
  tagline: string;
  badgeText: string;
  priceMonthly: number;
  maxBranches: number;
  pricePerExtraBranch?: number;
  maxCashiers: number;
  maxAdminPerOutlet: number;
  maxOwnerPerOutlet: number;
  maxCustomers: number;
  maxMonthlyTransactions: number;
  maxServices: number;
  canAssignStaff: boolean;
  canExportExcel: boolean;
  canExportOfficialPdf: boolean;
  canViewComparisonGrowth: boolean;
  canUseCustomLogoOnReceipt: boolean;
  canUseSignatureOnReceipt: boolean;
  highlights: string[];
}

export const EXTRA_BRANCH_PRICE = 25000;
export const HARGA_Premium_BULANAN = 27000;
export const HARGA_PREMIUM_BULANAN = 27000;
export const UNLIMITED_QUOTA = Number.MAX_SAFE_INTEGER;

const PREMIUM_LIMITS: LaundrySubscriptionLimits = {
  tier: 'premium',
  label: 'Paket Premium',
  tagline: 'Akses penuh tanpa batas kuota transaksi bulanan, kasir lintas HP & pembukuan lengkap',
  badgeText: 'Paket Premium',
  priceMonthly: 27000,
  maxBranches: 1,
  pricePerExtraBranch: 25000,
  maxCashiers: 1,
  maxAdminPerOutlet: 1,
  maxOwnerPerOutlet: 1,
  maxCustomers: UNLIMITED_QUOTA,
  maxMonthlyTransactions: UNLIMITED_QUOTA,
  maxServices: UNLIMITED_QUOTA,
  canAssignStaff: true,
  canExportExcel: true,
  canExportOfficialPdf: true,
  canViewComparisonGrowth: true,
  canUseCustomLogoOnReceipt: true,
  canUseSignatureOnReceipt: true,
  highlights: [
    'Tanpa Batas Kuota Nota Transaksi Bulanan (Unlimited)',
    'Tanpa Batas Data Pelanggan & Jenis Layanan Cuci Kendaraan',
    '1 Cabang Outlet Utama (Bisa Tambah Cabang Rp 25.000/cabang)',
    '1 Akun Login Kasir (Sinkron Beda HP) & 1 Owner per Outlet',
    'Penugasan Staf Pengerjaan Cuci (Cuci, Detailing, Poles)',
    'Ekspor Pembukuan Lengkap ke Excel Spreadsheet (.xlsx)',
    'Cetak Dokumen Laporan Keuangan Resmi A4 Siap Audit (.pdf)',
    'Grafik Analisis Komparasi Pertumbuhan Omzet & Laba (MoM & YoY)',
    'Kustomisasi Logo Toko di Struk Thermal',
  ],
};

export const NEWCOMER_TRIAL_DAYS = 7;

export const LAUNDRY_TIER_CONFIG: Record<LaundryTier | 'Premium', LaundrySubscriptionLimits> = {
  newcomer: {
    tier: 'newcomer',
    label: 'Paket Newcomer (Trial 7 Hari)',
    tagline: 'Masa uji coba gratis 7 hari tanpa batas kuota nota & layanan (tidak dapat diperpanjang)',
    badgeText: 'Trial 7 Hari',
    priceMonthly: 0,
    maxBranches: 1,
    pricePerExtraBranch: 25000,
    maxCashiers: 0,
    maxAdminPerOutlet: 0,
    maxOwnerPerOutlet: 1,
    maxCustomers: UNLIMITED_QUOTA,
    maxMonthlyTransactions: UNLIMITED_QUOTA,
    maxServices: UNLIMITED_QUOTA,
    canAssignStaff: false,
    canExportExcel: false,
    canExportOfficialPdf: false,
    canViewComparisonGrowth: false,
    canUseCustomLogoOnReceipt: true,
    canUseSignatureOnReceipt: false,
    highlights: [
      'Masa Uji Coba Gratis 7 Hari Sejak Mendaftar',
      'Tidak Dapat Diperpanjang (Upgrade ke Premium setelah 7 hari)',
      'Tanpa Batas Kuota Nota Transaksi Bulanan',
      'Tanpa Batas Jenis Layanan Cuci Kendaraan',
      'Tanpa Batas Data Pelanggan',
      '1 Cabang Outlet & 1 Owner (Tanpa Akun Kasir)',
      'Cetak Struk Thermal Standar & Bagikan WhatsApp',
      'Tingkatkan ke Paket Premium untuk Multi-Kasir & Pembukuan Lengkap',
    ],
  },
  premium: PREMIUM_LIMITS,
  Premium: PREMIUM_LIMITS,
};

export function normalizeTier(rawTier?: string | null): LaundryTier {
  if (!rawTier) return 'newcomer';
  const clean = rawTier.toLowerCase().trim();
  if (
    clean === 'newcomer' ||
    clean === 'pemula' ||
    clean === 'gratis' ||
    clean === 'free' ||
    clean === 'trial' ||
    clean === 'starter'
  ) {
    return 'newcomer';
  }
  return 'premium';
}

export function canDowngradeToNewcomer(): boolean {
  return false;
}

export function canExtendNewcomer(): boolean {
  return false;
}

export function getLaundryLimits(rawTier?: string | null): LaundrySubscriptionLimits {
  const tier = normalizeTier(rawTier);
  return LAUNDRY_TIER_CONFIG[tier] || LAUNDRY_TIER_CONFIG.premium;
}

export function isProTier(_rawTier?: string | null): boolean {
  return false;
}

export function isNewcomerTier(rawTier?: string | null): boolean {
  return normalizeTier(rawTier) === 'newcomer';
}

export function canAddBranch(
  currentBranchCount: number,
  rawTier?: string | null
): { allowed: boolean; requiresPayment?: boolean; cost?: number; reason?: string } {
  const limits = getLaundryLimits(rawTier);
  const requiresPayment = currentBranchCount >= limits.maxBranches;
  return {
    allowed: true,
    requiresPayment,
    cost: EXTRA_BRANCH_PRICE,
    reason: requiresPayment
      ? `Cabang tambahan diaktifkan dengan biaya Rp ${EXTRA_BRANCH_PRICE.toLocaleString('id-ID')} per cabang.`
      : undefined,
  };
}

export function canAddCashierToBranch(
  branchId: string,
  staffList: { laundryId?: string | null; role: string }[],
  rawTier?: string | null
): { allowed: boolean; reason?: string } {
  const limits = getLaundryLimits(rawTier);

  if (limits.tier === 'newcomer' || limits.maxCashiers <= 0) {
    return {
      allowed: false,
      reason: 'Paket Newcomer (Trial) hanya untuk 1 Owner tanpa akun kasir. Tingkatkan ke Paket Premium untuk membuat akun kasir.',
    };
  }

  const branchCashiers = staffList.filter(
    (s) => s.laundryId === branchId && (s.role === 'admin' || s.role === 'karyawan')
  );
  if (branchCashiers.length >= limits.maxAdminPerOutlet) {
    return {
      allowed: false,
      reason: 'Cabang outlet ini sudah memiliki 1 admin kasir aktif.',
    };
  }

  return { allowed: true };
}

export function canAddCustomer(_currentCustomerCount: number, _rawTier?: string | null): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

export function canAddService(_currentServiceCount: number, _rawTier?: string | null): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

export function canAddMonthlyTransaction(_monthlyTransactionCount: number, _rawTier?: string | null): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

export type SubscriptionLimits = {
  maxSchedulesPerMonth: number;
  maxAdmins: number;
  maxCrew: number;
  canAccessWebsiteSettings: boolean;
  canAccessBookingLink: boolean;
  canManageTeam: boolean;
  canChangeTheme: boolean;
  maxWebsites: number;
  maxDailyActions: number;
  maxDailyVisits: number;
};

export const SUBSCRIPTION_CONFIG: Record<string, SubscriptionLimits> = {
  standar: {
    maxSchedulesPerMonth: 100,
    maxAdmins: 1,
    maxCrew: 0,
    canAccessWebsiteSettings: false,
    canAccessBookingLink: false,
    canManageTeam: false,
    canChangeTheme: false,
    maxWebsites: 0,
    maxDailyActions: 0,
    maxDailyVisits: 10,
  },
  Premium: {
    maxSchedulesPerMonth: UNLIMITED_QUOTA,
    maxAdmins: 3,
    maxCrew: 0,
    canAccessWebsiteSettings: true,
    canAccessBookingLink: true,
    canManageTeam: true,
    canChangeTheme: true,
    maxWebsites: 1,
    maxDailyActions: 5,
    maxDailyVisits: 50,
  },
};

export const getLimits = (tier: string): SubscriptionLimits => {
  const normalizedTier = tier.toLowerCase();
  return SUBSCRIPTION_CONFIG[normalizedTier] || SUBSCRIPTION_CONFIG.standar;
};
