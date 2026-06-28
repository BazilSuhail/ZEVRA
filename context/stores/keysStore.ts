import { create } from "zustand";
import { deriveKEK, unsealPrivateKey } from "../../utils/crypto";
import type { MyKeys } from "../../utils/types";

const STORAGE_KEY_SEALED = "zevra_sealed_keys";
const STORAGE_KEY_KEK = "zevra_kek";
const STORAGE_KEY_KEK_SIGN = "zevra_kek_sign";

function saveSealedKeys(keys: MyKeys) {
  try {
    localStorage.setItem(STORAGE_KEY_SEALED, JSON.stringify(keys));
  } catch {}
}

function loadSealedKeys(): MyKeys | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEALED);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveKEK(kek: Uint8Array, kekSign: Uint8Array) {
  try {
    sessionStorage.setItem(STORAGE_KEY_KEK, btoa(String.fromCharCode(...kek)));
    sessionStorage.setItem(STORAGE_KEY_KEK_SIGN, btoa(String.fromCharCode(...kekSign)));
  } catch {}
}

function loadKEK(): { kek: Uint8Array; kekSign: Uint8Array } | null {
  try {
    const kekB64 = sessionStorage.getItem(STORAGE_KEY_KEK);
    const kekSignB64 = sessionStorage.getItem(STORAGE_KEY_KEK_SIGN);
    if (!kekB64 || !kekSignB64) return null;

    const kek = Uint8Array.from(atob(kekB64), (c) => c.charCodeAt(0));
    const kekSign = Uint8Array.from(atob(kekSignB64), (c) => c.charCodeAt(0));
    return { kek, kekSign };
  } catch {
    return null;
  }
}

function clearKeys() {
  try {
    localStorage.removeItem(STORAGE_KEY_SEALED);
    sessionStorage.removeItem(STORAGE_KEY_KEK);
    sessionStorage.removeItem(STORAGE_KEY_KEK_SIGN);
  } catch {}
}

interface KeysState {
  privateKey: Uint8Array | null;
  privateKeySign: Uint8Array | null;
  publicKey: string;
  publicKeySign: string;
  keyVersion: number;
  isUnlocked: boolean;

  groupKeyCache: Record<string, Uint8Array>;

  unlock: (sealedKeys: MyKeys, password: string) => Promise<boolean>;
  restoreFromSession: () => Promise<boolean>;
  lock: () => void;
  getGroupKey: (channelId: string, epoch: number) => Uint8Array | undefined;
  setGroupKey: (channelId: string, epoch: number, key: Uint8Array) => void;
}

export const useKeys = create<KeysState>((set, get) => ({
  privateKey: null,
  privateKeySign: null,
  publicKey: "",
  publicKeySign: "",
  keyVersion: 0,
  isUnlocked: false,
  groupKeyCache: {},

  unlock: async (sealedKeys, password) => {
    try {
      const kek = await deriveKEK(password, sealedKeys.keySalt);
      const kekSign = await deriveKEK(password, sealedKeys.keySaltSign);

      const privateKey = await unsealPrivateKey(sealedKeys.encryptedPrivateKey, kek);
      const privateKeySign = await unsealPrivateKey(sealedKeys.encryptedPrivateKeySign, kekSign);

      // Persist sealed keys + KEK for session restore
      saveSealedKeys(sealedKeys);
      saveKEK(kek, kekSign);

      set({
        privateKey,
        privateKeySign,
        publicKey: sealedKeys.publicKey,
        publicKeySign: sealedKeys.publicKeySign,
        keyVersion: sealedKeys.keyVersion,
        isUnlocked: true,
      });

      return true;
    } catch (err) {
      console.error("Key unlock failed:", err);
      return false;
    }
  },

  restoreFromSession: async () => {
    try {
      const keks = loadKEK();
      const sealed = loadSealedKeys();
      if (!keks || !sealed) return false;

      const privateKey = await unsealPrivateKey(sealed.encryptedPrivateKey, keks.kek);
      const privateKeySign = await unsealPrivateKey(sealed.encryptedPrivateKeySign, keks.kekSign);

      set({
        privateKey,
        privateKeySign,
        publicKey: sealed.publicKey,
        publicKeySign: sealed.publicKeySign,
        keyVersion: sealed.keyVersion,
        isUnlocked: true,
      });

      return true;
    } catch {
      clearKeys();
      return false;
    }
  },

  lock: () => {
    clearKeys();
    set({
      privateKey: null,
      privateKeySign: null,
      publicKey: "",
      publicKeySign: "",
      keyVersion: 0,
      isUnlocked: false,
      groupKeyCache: {},
    });
  },

  getGroupKey: (channelId, epoch) => {
    return get().groupKeyCache[`${channelId}:${epoch}`];
  },

  setGroupKey: (channelId, epoch, key) => {
    set((state) => ({
      groupKeyCache: {
        ...state.groupKeyCache,
        [`${channelId}:${epoch}`]: key,
      },
    }));
  },
}));
