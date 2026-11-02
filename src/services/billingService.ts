import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Laundry } from '../types';
import { formatRupiah } from '../utils/formatters';
import { HARGA_PREMIUM_BULANAN } from '../utils/subscription';
import {
  getActiveIdToken,
  isRunningOnBackendHost,
  resolveActiveBackendBaseUrl,
} from './midtransService';

export type ManualTransferChannel = 'BRI' | 'DANA' | 'MANUAL';
export type AdminGrantAction = 'extend_premium' | 'topup_wallet';

export interface BillingApiError extends Error {
  code?: string;
  walletBalance?: number;
  requiredCost?: number;
}

export interface ExtendSubscriptionResult {
  success: boolean;
  auditId: string;
  cost: number;
  durationDays: number;
  walletBalance: number;
  subscriptionType: string;
  subscriptionEndDate: number;
}

export interface ActivateBranchResult {
  success: boolean;
  auditId: string;
  isExtraBranch: boolean;
  cost: number;
  walletBalance: number;
  branch: Laundry;
  laundriesMap: Record<string, string>;
}

export interface BillingAuditLogItem {
  id: string;
  uid: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  channel: string;
  amount: number;
  walletDelta: number;
  walletBefore: number;
  walletAfter: number;
  durationDays?: number;
  subscriptionTypeAfter?: string;
  subscriptionEndDateAfter?: number | null;
  note?: string;
  createdAt: number;
}

export interface AdminLookedUpUser {
  uid: string;
  displayName: string;
  emailOrPhone: string;
  authEmail: string | null;
  nomorTelepon: string | null;
  role: string;
  walletBalance: number;
  subscriptionType: string;
  subscriptionEndDate: number | null;
  branches: Array<{
    id: string;
    namaLaundry: string;
    alamat: string;
  }>;
}

export interface AdminLookupResult {
  user: AdminLookedUpUser;
  suggestedAmount: number | null;
  recentLogs: BillingAuditLogItem[];
}

export interface AdminGrantResult {
  success: boolean;
  auditEntry: BillingAuditLogItem;
  user: {
    uid: string;
    displayName: string;
    walletBalance: number;
    subscriptionType: string;
    subscriptionEndDate: number | null;
  };
}

function createBackendError(
  message: string,
  extra?: { code?: string; walletBalance?: number; requiredCost?: number }
): BillingApiError {
  const err = new Error(message) as BillingApiError;
  if (extra?.code) err.code = extra.code;
  if (typeof extra?.walletBalance === 'number') err.walletBalance = extra.walletBalance;
  if (typeof extra?.requiredCost === 'number') err.requiredCost = extra.requiredCost;
  return err;
}

async function postProtectedBillingJson<T>(
  endpointPath: string,
  payload: Record<string, unknown>
): Promise<T> {
  const idToken = await getActiveIdToken();
  const baseUrl = await resolveActiveBackendBaseUrl();

  if (!baseUrl && !isRunningOnBackendHost()) {
    throw createBackendError(
      'Alamat server backend belum ditautkan untuk domain ini. Silakan hubungkan URL Cloud Run di Panel Admin Pusat atau gunakan Transfer Biasa.',
      { code: 'BACKEND_NOT_CONFIGURED' }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${endpointPath}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw createBackendError(
      'Gagal menghubungi server otorisasi billing. Periksa koneksi internet Anda lalu coba lagi.',
      { code: 'NETWORK_ERROR' }
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    throw createBackendError(
      'Layanan backend billing belum aktif pada alamat ini. Pastikan URL server Cloud Run sudah terhubung.',
      { code: 'STATIC_HOST_FALLBACK' }
    );
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw createBackendError(
      typeof data.error === 'string' && data.error
        ? data.error
        : 'Permintaan ditolak oleh validasi keamanan server.',
      {
        code: typeof data.code === 'string' ? data.code : undefined,
        walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : undefined,
        requiredCost: typeof data.requiredCost === 'number' ? data.requiredCost : undefined,
      }
    );
  }

  return data as T;
}

export async function extendSubscriptionDirectFromWallet(params?: {
  durationDays?: number;
  customCost?: number;
}): Promise<ExtendSubscriptionResult> {
  const currentUserAuth = auth.currentUser;
  if (!currentUserAuth) {
    throw createBackendError('Sesi autentikasi login tidak aktif. Silakan masuk kembali.', {
      code: 'AUTH_REQUIRED',
    });
  }

  const durationDays = params?.durationDays ? Math.round(params.durationDays) : 30;
  const authoritativeCost =
    params?.customCost !== undefined
      ? Math.round(params.customCost)
      : Math.round((durationDays / 30) * HARGA_PREMIUM_BULANAN);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', currentUserAuth.uid);
      const userSnap = await transaction.get(userDocRef);

      if (!userSnap.exists()) {
        throw createBackendError('Profil akun owner tidak ditemukan di server Firestore.', {
          code: 'USER_NOT_FOUND',
        });
      }

      const userData = userSnap.data();
      if (userData.role && userData.role !== 'owner') {
        throw createBackendError('Akses ditolak: Hanya akun dengan role owner yang dapat memperpanjang paket langganan.', {
          code: 'PERMISSION_DENIED',
        });
      }

      const walletBefore = Math.max(0, Math.floor(Number(userData.walletBalance) || 0));
      if (walletBefore < authoritativeCost) {
        throw createBackendError(
          `Saldo dompet Anda (${formatRupiah(walletBefore)}) tidak mencukupi untuk biaya ${formatRupiah(
            authoritativeCost
          )}. Silakan lakukan top-up saldo terlebih dahulu.`,
          {
            code: 'INSUFFICIENT_WALLET_BALANCE',
            walletBalance: walletBefore,
            requiredCost: authoritativeCost,
          }
        );
      }

      const now = Date.now();
      const walletAfter = walletBefore - authoritativeCost;
      const currentSubEnd =
        typeof userData.subscriptionEndDate === 'number' ? userData.subscriptionEndDate : 0;
      const baseEnd = Math.max(now, currentSubEnd);
      const nextSubEnd = baseEnd + durationDays * 24 * 60 * 60 * 1000;

      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const auditId = `AUD-DIR-${now}-${randomSuffix}`;
      const auditDocRef = doc(db, 'billing_audit_logs', auditId);

      // Primary branch document
      const primaryBranchId = userData.laundryId || `lnd-${currentUserAuth.uid}`;
      const branchDocRef = doc(db, 'laundries', primaryBranchId);
      const branchSnap = await transaction.get(branchDocRef);

      // 1. Potong saldo dompet & tambah 30 hari subscriptionEndDate di users Firestore
      transaction.update(userDocRef, {
        walletBalance: walletAfter,
        subscriptionType: 'premium',
        subscriptionEndDate: nextSubEnd,
        updatedAt: now,
      });

      // 2. Tambahkan log ke billing_audit_logs di Firestore
      transaction.set(auditDocRef, {
        id: auditId,
        uid: currentUserAuth.uid,
        actorUid: currentUserAuth.uid,
        actorEmail: currentUserAuth.email || userData.emailOrPhone || '',
        action: 'wallet_extend_premium',
        channel: 'WALLET',
        amount: authoritativeCost,
        walletDelta: -authoritativeCost,
        walletBefore,
        walletAfter,
        durationDays,
        subscriptionTypeAfter: 'premium',
        subscriptionEndDateAfter: nextSubEnd,
        note: `Perpanjangan Paket Premium (${durationDays} Hari) langsung dari saldo dompet`,
        createdAt: now,
      });

      // 3. Update status cabang utama jika ada
      if (branchSnap.exists()) {
        transaction.update(branchDocRef, {
          subscriptionType: 'premium',
          subscriptionEndDate: nextSubEnd,
          updatedAt: now,
        });
      }

      return {
        success: true,
        auditId,
        cost: authoritativeCost,
        durationDays,
        walletBalance: walletAfter,
        subscriptionType: 'premium',
        subscriptionEndDate: nextSubEnd,
        extraBranches:
          userData.laundries && typeof userData.laundries === 'object'
            ? Object.keys(userData.laundries).filter((id) => id !== primaryBranchId)
            : [],
      };
    });

    // 4. Update cabang tambahan dan owners doc (jika ada) di latar belakang
    const now = Date.now();
    if (result.extraBranches && result.extraBranches.length > 0) {
      for (const branchId of result.extraBranches) {
        try {
          await updateDoc(doc(db, 'laundries', branchId), {
            subscriptionType: 'premium',
            subscriptionEndDate: result.subscriptionEndDate,
            updatedAt: now,
          });
        } catch {
          // ignore
        }
      }
    }

    try {
      await updateDoc(doc(db, 'owners', currentUserAuth.uid), {
        paketAktif: 'premium',
        subscriptionType: 'premium',
        subscriptionEndDate: result.subscriptionEndDate,
        walletBalance: result.walletBalance,
        updatedAt: now,
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      auditId: result.auditId,
      cost: result.cost,
      durationDays: result.durationDays,
      walletBalance: result.walletBalance,
      subscriptionType: result.subscriptionType,
      subscriptionEndDate: result.subscriptionEndDate,
    };
  } catch (err: any) {
    if (err?.code === 'INSUFFICIENT_WALLET_BALANCE' || err?.code === 'PERMISSION_DENIED') {
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUserAuth.uid}`);
    }
    throw createBackendError(
      err?.message || 'Gagal memperpanjang langganan langsung dari saldo dompet. Periksa koneksi internet Anda.',
      {
        code: err?.code || 'DIRECT_EXTEND_FAILED',
        walletBalance: err?.walletBalance,
        requiredCost: err?.requiredCost,
      }
    );
  }
}

export async function extendSubscriptionViaBackend(
  durationDays: number
): Promise<ExtendSubscriptionResult> {
  return postProtectedBillingJson<ExtendSubscriptionResult>(
    '/api/billing/extend-subscription',
    { durationDays: Math.round(durationDays) }
  );
}

export async function activateBranchViaBackend(params: {
  namaLaundry: string;
  alamat?: string;
  nomorTelepon?: string;
}): Promise<ActivateBranchResult> {
  return postProtectedBillingJson<ActivateBranchResult>('/api/billing/activate-branch', {
    namaLaundry: params.namaLaundry.trim(),
    alamat: params.alamat?.trim() || '',
    nomorTelepon: params.nomorTelepon?.trim() || '',
  });
}

export async function adminLookupOwnerAccount(query: string): Promise<AdminLookupResult> {
  return postProtectedBillingJson<AdminLookupResult>('/api/admin/billing/lookup-user', {
    query: query.trim(),
  });
}

export async function adminGrantOwnerBilling(params: {
  targetUid: string;
  action: AdminGrantAction;
  channel: ManualTransferChannel;
  durationDays?: number;
  amount: number;
  note?: string;
}): Promise<AdminGrantResult> {
  return postProtectedBillingJson<AdminGrantResult>('/api/admin/billing/grant', {
    targetUid: params.targetUid.trim(),
    action: params.action,
    channel: params.channel,
    durationDays: params.durationDays ? Math.round(params.durationDays) : 0,
    amount: Math.round(params.amount),
    note: params.note?.trim() || '',
  });
}
