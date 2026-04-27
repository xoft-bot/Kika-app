import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

const PIN_HASH_KEY = "kika.auth.pin_hash";
const PIN_SALT_KEY = "kika.auth.pin_salt";
const BIOMETRIC_PREF_KEY = "kika.auth.biometric_enabled";
const AUTO_LOCK_MS = 60_000;

type AuthStatus = "loading" | "needs_setup" | "locked" | "unlocked";

interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  label: string;
}

interface AuthContextValue {
  status: AuthStatus;
  biometric: BiometricCapability;
  biometricEnabled: boolean;
  setupPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lock: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  resetAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [biometric, setBiometric] = useState<BiometricCapability>({
    available: false,
    enrolled: false,
    label: "Biometrics",
  });
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const lastActiveAt = useRef<number>(Date.now());

  const detectBiometric = useCallback(async () => {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = available
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      let label = "Biometrics";
      if (available) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          label = "Face Unlock";
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          label = "Fingerprint";
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          label = "Iris";
        }
      }
      setBiometric({ available, enrolled, label });
    } catch {
      setBiometric({ available: false, enrolled: false, label: "Biometrics" });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await detectBiometric();
      const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
      const bioPref = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY);
      if (!mounted) return;
      setBiometricEnabledState(bioPref === "1");
      setStatus(hash ? "locked" : "needs_setup");
    })();
    return () => {
      mounted = false;
    };
  }, [detectBiometric]);

  // Auto-lock when app goes to background for >AUTO_LOCK_MS
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === "active") {
        if (
          status === "unlocked" &&
          Date.now() - lastActiveAt.current > AUTO_LOCK_MS
        ) {
          setStatus("locked");
        }
      } else {
        lastActiveAt.current = Date.now();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [status]);

  const setupPin = useCallback(async (pin: string) => {
    const salt = await generateSalt();
    const hash = await hashPin(pin, salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
    setStatus("unlocked");
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
    const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
    if (!salt || !stored) return false;
    const hash = await hashPin(pin, salt);
    if (hash === stored) {
      setStatus("unlocked");
      return true;
    }
    return false;
  }, []);

  const unlockWithBiometric = useCallback(async () => {
    if (!biometric.available || !biometric.enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Kika",
      fallbackLabel: "Use PIN",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });
    if (result.success) {
      setStatus("unlocked");
      return true;
    }
    return false;
  }, [biometric]);

  const lock = useCallback(() => {
    setStatus((s) => (s === "unlocked" ? "locked" : s));
  }, []);

  const changePin = useCallback(
    async (currentPin: string, newPin: string) => {
      const ok = await unlockWithPin(currentPin);
      if (!ok) return false;
      const salt = await generateSalt();
      const hash = await hashPin(newPin, salt);
      await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
      await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
      return true;
    },
    [unlockWithPin],
  );

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, enabled ? "1" : "0");
    setBiometricEnabledState(enabled);
  }, []);

  const resetAuth = useCallback(async () => {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
    await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_PREF_KEY);
    setBiometricEnabledState(false);
    setStatus("needs_setup");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      biometric,
      biometricEnabled,
      setupPin,
      unlockWithPin,
      unlockWithBiometric,
      lock,
      changePin,
      setBiometricEnabled,
      resetAuth,
    }),
    [
      status,
      biometric,
      biometricEnabled,
      setupPin,
      unlockWithPin,
      unlockWithBiometric,
      lock,
      changePin,
      setBiometricEnabled,
      resetAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
