import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { parseSms } from "@/lib/smsParser";
import type { ParsedSms, Transaction } from "@/lib/types";

const SETTINGS_KEY = "kika.sms.autoimport.v1";
const RECENT_HASHES_KEY = "kika.sms.recent.v1";
const MAX_RECENT = 200;

export interface SmsAutoImportSettings {
  enabled: boolean;
  minConfidence: "high" | "medium";
}

export const DEFAULT_SETTINGS: SmsAutoImportSettings = {
  enabled: false,
  minConfidence: "medium",
};

export async function loadSettings(): Promise<SmsAutoImportSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: SmsAutoImportSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function fingerprint(body: string): string {
  // Light hash so we can dedupe SMS we've seen before.
  let h = 0;
  for (let i = 0; i < body.length; i++) {
    h = (h * 31 + body.charCodeAt(i)) | 0;
  }
  return String(h);
}

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_HASHES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveRecent(arr: string[]): Promise<void> {
  const trimmed = arr.slice(-MAX_RECENT);
  await AsyncStorage.setItem(RECENT_HASHES_KEY, JSON.stringify(trimmed));
}

export async function isDuplicate(body: string): Promise<boolean> {
  const fp = fingerprint(body);
  const recent = await loadRecent();
  return recent.includes(fp);
}

export async function markSeen(body: string): Promise<void> {
  const fp = fingerprint(body);
  const recent = await loadRecent();
  if (!recent.includes(fp)) {
    recent.push(fp);
    await saveRecent(recent);
  }
}

export interface ImportAttempt {
  parsed: ParsedSms;
  imported: boolean;
  reason?: "low_confidence" | "duplicate" | "ok";
  txn?: Transaction;
}

const confidenceRank = { low: 0, medium: 1, high: 2 } as const;

export async function tryImport(
  body: string,
  settings: SmsAutoImportSettings,
  add: (p: ParsedSms) => Transaction,
): Promise<ImportAttempt> {
  const parsed = parseSms(body);

  if (await isDuplicate(body)) {
    return { parsed, imported: false, reason: "duplicate" };
  }

  const min = confidenceRank[settings.minConfidence];
  const got = confidenceRank[parsed.confidence];
  if (got < min) {
    await markSeen(body);
    return { parsed, imported: false, reason: "low_confidence" };
  }

  const txn = add(parsed);
  await markSeen(body);
  return { parsed, imported: true, reason: "ok", txn };
}

export const SUPPORTED = Platform.OS === "android";

// ---------- SMS history scan (one-shot) ----------

export interface ScanInboxResult {
  total: number;
  imported: number;
  duplicates: number;
  lowConfidence: number;
  attempts: ImportAttempt[];
}

interface RawSms {
  _id?: number;
  address?: string;
  body?: string;
  date?: number;
}

type SmsAndroidModule = {
  list: (
    filter: string,
    fail: (err: string) => void,
    success: (count: number, smsList: string) => void,
  ) => void;
};

let cachedSmsAndroid: SmsAndroidModule | null | undefined;
function getSmsAndroid(): SmsAndroidModule | null {
  if (cachedSmsAndroid !== undefined) return cachedSmsAndroid;
  if (!SUPPORTED) {
    cachedSmsAndroid = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-get-sms-android");
    cachedSmsAndroid = (mod?.default ?? mod) as SmsAndroidModule;
  } catch {
    cachedSmsAndroid = null;
  }
  return cachedSmsAndroid;
}

export function isHistoryScanSupported(): boolean {
  return SUPPORTED && getSmsAndroid() !== null;
}

export async function scanInbox(
  daysBack: number,
  settings: SmsAutoImportSettings,
  add: (p: ParsedSms) => Transaction,
): Promise<ScanInboxResult> {
  const mod = getSmsAndroid();
  if (!mod) {
    return {
      total: 0,
      imported: 0,
      duplicates: 0,
      lowConfidence: 0,
      attempts: [],
    };
  }

  const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const filter = JSON.stringify({
    box: "inbox",
    minDate,
    maxCount: 500,
  });

  const messages = await new Promise<RawSms[]>((resolve) => {
    try {
      mod.list(
        filter,
        () => resolve([]),
        (_count, smsList) => {
          try {
            const parsed = JSON.parse(smsList);
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch {
            resolve([]);
          }
        },
      );
    } catch {
      resolve([]);
    }
  });

  const attempts: ImportAttempt[] = [];
  let imported = 0;
  let duplicates = 0;
  let lowConfidence = 0;

  for (const m of messages) {
    if (!m?.body) continue;
    const attempt = await tryImport(m.body, settings, add);
    attempts.push(attempt);
    if (attempt.imported) imported += 1;
    else if (attempt.reason === "duplicate") duplicates += 1;
    else if (attempt.reason === "low_confidence") lowConfidence += 1;
  }

  return {
    total: messages.length,
    imported,
    duplicates,
    lowConfidence,
    attempts,
  };
}
