import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { useFinance } from "@/context/FinanceContext";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  SUPPORTED,
  tryImport,
  type ImportAttempt,
  type SmsAutoImportSettings,
} from "@/lib/smsAutoImport";

type SmsListener = {
  addListener: (
    cb: (msg: { originatingAddress?: string; body: string }) => void,
  ) => { remove: () => void };
};

let cachedListener: SmsListener | null | undefined;
function getListener(): SmsListener | null {
  if (cachedListener !== undefined) return cachedListener;
  if (!SUPPORTED) {
    cachedListener = null;
    return null;
  }
  try {
    // Loaded lazily so iOS / web bundles never reach for the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-android-sms-listener");
    cachedListener = (mod?.default ?? mod) as SmsListener;
  } catch {
    cachedListener = null;
  }
  return cachedListener;
}

export type PermissionState =
  | "unknown"
  | "granted"
  | "denied"
  | "blocked"
  | "unsupported";

export interface UseSmsAutoImportApi {
  supported: boolean;
  settings: SmsAutoImportSettings;
  permission: PermissionState;
  lastImports: ImportAttempt[];
  setEnabled: (next: boolean) => Promise<boolean>;
  setMinConfidence: (c: "high" | "medium") => Promise<void>;
  requestPermission: () => Promise<PermissionState>;
  clearLastImports: () => void;
}

const RECENT_BUFFER = 8;

export function useSmsAutoImport(): UseSmsAutoImportApi {
  const { addTransactionFromParsed } = useFinance();
  const [settings, setSettings] = useState<SmsAutoImportSettings>(
    DEFAULT_SETTINGS,
  );
  const [permission, setPermission] = useState<PermissionState>(
    SUPPORTED ? "unknown" : "unsupported",
  );
  const [lastImports, setLastImports] = useState<ImportAttempt[]>([]);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (Platform.OS !== "android") return "unsupported";
    try {
      const has = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      );
      const state: PermissionState = has ? "granted" : "denied";
      setPermission(state);
      return state;
    } catch {
      setPermission("denied");
      return "denied";
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (Platform.OS !== "android") {
      setPermission("unsupported");
      return "unsupported";
    }
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);
      const recv = result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
      let state: PermissionState = "denied";
      if (recv === PermissionsAndroid.RESULTS.GRANTED) state = "granted";
      else if (recv === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
        state = "blocked";
      setPermission(state);
      return state;
    } catch {
      setPermission("denied");
      return "denied";
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadSettings();
      if (!mounted) return;
      setSettings(s);
      await checkPermission();
    })();
    return () => {
      mounted = false;
    };
  }, [checkPermission]);

  // Attach / detach native listener as enabled+granted toggles.
  useEffect(() => {
    const detach = () => {
      if (subRef.current) {
        try {
          subRef.current.remove();
        } catch {
          /* ignore */
        }
        subRef.current = null;
      }
    };

    if (!settings.enabled || permission !== "granted") {
      detach();
      return detach;
    }
    const listener = getListener();
    if (!listener) {
      detach();
      return detach;
    }

    subRef.current = listener.addListener(async (msg) => {
      if (!msg?.body) return;
      try {
        const attempt = await tryImport(
          msg.body,
          settingsRef.current,
          addTransactionFromParsed,
        );
        if (attempt.reason !== "duplicate") {
          setLastImports((prev) =>
            [attempt, ...prev].slice(0, RECENT_BUFFER),
          );
        }
      } catch {
        /* swallow — don't crash on malformed SMS */
      }
    });

    return detach;
  }, [settings.enabled, permission, addTransactionFromParsed]);

  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (next) {
        let perm = permission;
        if (perm !== "granted") perm = await requestPermission();
        if (perm !== "granted") {
          // Persist the user's intent; we still flip enabled off so UI matches reality.
          const saved = { ...settingsRef.current, enabled: false };
          await saveSettings(saved);
          setSettings(saved);
          return false;
        }
      }
      const saved = { ...settingsRef.current, enabled: next };
      await saveSettings(saved);
      setSettings(saved);
      return true;
    },
    [permission, requestPermission],
  );

  const setMinConfidence = useCallback(
    async (c: "high" | "medium") => {
      const saved = { ...settingsRef.current, minConfidence: c };
      await saveSettings(saved);
      setSettings(saved);
    },
    [],
  );

  const clearLastImports = useCallback(() => setLastImports([]), []);

  return {
    supported: SUPPORTED,
    settings,
    permission,
    lastImports,
    setEnabled,
    setMinConfidence,
    requestPermission,
    clearLastImports,
  };
}
