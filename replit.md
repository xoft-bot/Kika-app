# FinanceMonitor UG

Personal finance monitoring mobile app for Uganda. Tracks balances on MTN MoMo, Airtel Money, and major Ugandan banks (Stanbic, DFCU, Pearl/HFB, KCB, NCBA), with a smart SMS parser that extracts amount, account, party, category, fee, balance, and reference from any pasted bank/mobile money SMS.

## Architecture

- **Stack:** Expo SDK 54, expo-router, AsyncStorage, React Query, Inter fonts, react-native-keyboard-controller, expo-haptics.
- **Single artifact:** `artifacts/finance-monitor` (mobile, Expo). API server and mockup sandbox are scaffolds — not used by this product.
- **State:** All app data lives client-side in `FinanceContext` (React Context + AsyncStorage). No backend.
- **Persistence key:** `fmug.v1.state` in AsyncStorage. Hydrates on mount, auto-persists on every change.

## Code Layout

```
artifacts/finance-monitor/
  app/
    _layout.tsx              # Root layout — providers wrapped, fonts gated, AuthGate wraps RootLayoutNav
    (tabs)/
      _layout.tsx            # 5 tabs: Overview, Activity, Scanner, Loans, Roy
      index.tsx              # Dashboard — net position, balances, monthly flow, receivables
      transactions.tsx       # Search + filter + add/delete transactions
      scanner.tsx            # SMS parse + import flow with samples
      loans.tsx              # Active debts + record payment modal
      roy.tsx                # Roy UK Phase 1/2 detailed tracking
  components/
    AccountIcon.tsx          # MTN/Airtel/bank circular badges
    AddTransactionSheet.tsx  # Bottom sheet — manual entry
    AuthGate.tsx             # Renders Setup/Lock/Loading screens until unlocked
    CategoryIcon.tsx         # Per-category icon mapping
    PinDots.tsx              # 4-dot PIN indicator
    PinKeypad.tsx            # 0-9 + biometric + backspace keypad
    TransactionRow.tsx       # Row used in lists
    ui/                      # Card, Badge, ProgressBar, SectionLabel, Header
  context/
    AuthContext.tsx          # PIN setup, lock/unlock, biometric, auto-lock on background
    FinanceContext.tsx       # All state + actions + computed totals
  lib/
    types.ts                 # Transaction, Loan, Receivable, RoyPayment, ParsedSms
    format.ts                # fmtUGX, fmtCompact, fmtDateShort, pct, todayISO, genId
    smsParser.ts             # parseSms(text) — confidence-scored
    seedData.ts              # SEED_* — preserves user's real numbers
  constants/colors.ts        # Dark fintech theme (#0A0E1A bg, #00C896 primary)
  hooks/useColors.ts         # Theme hook
  assets/images/icon.png     # AI-generated app icon
  eas.json                   # EAS Build profiles — preview profile produces APK
```

## Authentication

Local device-only auth (no server, no account):

- **PIN:** 4-digit, hashed with SHA-256 + per-device random salt, stored in `expo-secure-store` (Android Keystore / iOS Keychain).
- **Biometric:** optional fingerprint/face/iris via `expo-local-authentication` — preference stored in SecureStore.
- **Auto-lock:** app re-locks if backgrounded for >60s.
- **Reset:** after 5 wrong attempts, a "Forgot PIN" link appears that clears the PIN (finance data on device is preserved — AsyncStorage is separate from SecureStore).
- **Provider order:** `AuthProvider` wraps `FinanceProvider`; `AuthGate` renders Setup/Lock/Loading until `status === "unlocked"`, then mounts the tabs.

## Building an APK (sideload to your phone)

The app is configured for EAS Build. Two paths:

### Option A — Cloud build (easiest, recommended)
1. Create a free Expo account at https://expo.dev/signup.
2. From your local machine (or this Repl shell):
   ```
   cd artifacts/finance-monitor
   npx eas-cli@latest login
   npx eas-cli@latest init           # links the project to your Expo account, writes projectId
   npx eas-cli@latest build -p android --profile preview
   ```
3. EAS uploads, builds in the cloud, and gives you a URL to download the APK. Open that URL on your Android phone (allow "Install unknown apps" for your browser) and install.

### Option B — Local build (no Expo account required)
Requires Android Studio + JDK 17 + Android SDK on your local machine (won't work inside Replit).
```
cd artifacts/finance-monitor
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK appears at android/app/build/outputs/apk/release/app-release.apk
```
For a signed release APK you'll need to generate a keystore — `npx expo run:android --variant release` walks you through it.

The `preview` profile in `eas.json` is set to `buildType: "apk"` so you get an installable APK (not an AAB bundle). Bundle id is `com.kika.app`.

## SMS Parser

`lib/smsParser.ts` exports `parseSms(text)` returning `{type, account, amount, party, category, fee, balance, txnId, confidence, raw}`. Detection rules:

- **Account:** keyword match for MTN/momo, Airtel, Stanbic, DFCU, Pearl/HFB, KCB, NCBA.
- **Type:** `in` from "received", "credited", "deposited"; `out` from "sent", "paid", "withdrawn", "debited", "purchased".
- **Amount:** regex on `UGX|USh` prefix/suffix, with comma+decimal handling. First match that isn't the labelled balance/fee.
- **Balance/Fee:** labelled regex on "balance:|new balance:" and "fee:|charge:|tax:".
- **Party:** "from X" / "to X" capture, fallback to first uppercase block.
- **Category:** rule-based regex (Salary/Loan/Utilities/Transport/Food/etc).
- **Confidence:** high if 4 of 4 dimensions resolve, medium if ≥2, else low.

## Auto-import SMS (Android)

Live foreground SMS auto-import is wired up via `react-native-android-sms-listener`:

- **Permissions:** `RECEIVE_SMS` + `READ_SMS` declared in `app.json` under `android.permissions`.
- **Hook:** `hooks/useSmsAutoImport.ts` requests permission via `PermissionsAndroid`, attaches a listener while `enabled && permission === "granted"`, and routes incoming messages through `lib/smsAutoImport.ts → tryImport()`.
- **Provider:** `context/SmsAutoImportContext.tsx` exposes the hook to both the Settings screen and the Scanner tab so they share one listener instance.
- **UI:** `components/SmsAutoImportCard.tsx` — toggle, status dot (off / listening / blocked / unsupported), and the last 4 import attempts. Lives at the top of Scanner and inside Settings.
- **Dedup:** message bodies are fingerprinted (cheap hash) and the last 200 fingerprints are kept in AsyncStorage under `kika.sms.recent.v1`.
- **Confidence gate:** only `medium`/`high` confidence parses are imported automatically; `low` are skipped and shown as such.
- **Settings:** persisted in AsyncStorage under `kika.sms.autoimport.v1`. Off by default.

### Limitations

- **Expo Go:** SMS listening doesn't work in Expo Go — needs a custom dev build or installed APK because the native module isn't bundled in Expo Go.
- **Foreground only:** the listener is alive while the app is open. Silent processing when the app is fully closed would need a static manifest-registered BroadcastReceiver (not yet built).
- **iOS:** Apple does not allow SMS reading. Card shows "ANDROID ONLY".

### Inbox backfill scan

Powered by `react-native-get-sms-android`. Lazy-loaded the same way as the listener so iOS/web never resolves it.

- **API:** `scanInbox(daysBack, settings, addFn)` in `lib/smsAutoImport.ts` returns `{ total, imported, duplicates, lowConfidence, attempts }`.
- **UI:** "Scan inbox" button on the auto-import card → expands a 7/30/90 day picker. After a scan finishes, an alert summarises the result and the recent imports list updates.
- **Dedup:** uses the same `markSeen` fingerprint store as the live listener, so re-scanning never doubles up transactions. Running the listener and then a backfill is safe.
- **Confidence:** same gate as the live import. Low-confidence messages are skipped (and remembered so the next scan doesn't re-process them).
- **Cap:** `maxCount: 500` per scan to keep memory bounded.

Manual paste-to-import via the Scanner tab continues to work on every platform.

## Seed Data Preserved

- MTN MoMo balance UGX 153,980 (0788 177 913)
- Airtel Money balance UGX 506,509 (0701 276 337)
- Active loans: Timothy (UGX 2.8M, 100K paid, weekly UGX 200K), Pearl Bank UGX 115K, MoKash UGX 25K
- Cleared loans list (Jumoworld, Kwasa, HFB, Neria, Pearl Xtra Cash, school fees, Wewole)
- Roy Mbahira UK: 16 payments logged across Phase 1 (£730 cleared) and Phase 2 (£1,260 agreed). GBP→UGX rate 4,730. Tutor Robyn Jennings, reg HABC4271333.
- Winnie Namara receivable: UGX 200K total, 110K paid.

## Design Notes

- Theme: deep navy `#0A0E1A` background, emerald `#00C896` primary, electric blue `#60A5FA` accent.
- Tabs use NativeTabs with liquid glass on iOS 26+, classic Tabs with BlurView on iOS<26, opaque bar on Android/web.
- Inter font family loaded with SplashScreen gating.
- Haptic feedback on all key interactions (native only).
- All amounts in UGX with thousand separators.

## User

Ugandan freelancer on MTN MoMo + Airtel Money. Tracks debts (loans owed) and receivables (Roy UK diploma, sister gifts, sales). Wants quick SMS scan-to-import to avoid manual entry.
