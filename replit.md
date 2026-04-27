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
    _layout.tsx              # Root layout — providers wrapped, fonts gated
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
    CategoryIcon.tsx         # Per-category icon mapping
    TransactionRow.tsx       # Row used in lists
    ui/                      # Card, Badge, ProgressBar, SectionLabel, Header
  context/
    FinanceContext.tsx       # All state + actions + computed totals
  lib/
    types.ts                 # Transaction, Loan, Receivable, RoyPayment, ParsedSms
    format.ts                # fmtUGX, fmtCompact, fmtDateShort, pct, todayISO, genId
    smsParser.ts             # parseSms(text) — confidence-scored
    seedData.ts              # SEED_* — preserves user's real numbers
  constants/colors.ts        # Dark fintech theme (#0A0E1A bg, #00C896 primary)
  hooks/useColors.ts         # Theme hook
  assets/images/icon.png     # AI-generated app icon
```

## SMS Parser

`lib/smsParser.ts` exports `parseSms(text)` returning `{type, account, amount, party, category, fee, balance, txnId, confidence, raw}`. Detection rules:

- **Account:** keyword match for MTN/momo, Airtel, Stanbic, DFCU, Pearl/HFB, KCB, NCBA.
- **Type:** `in` from "received", "credited", "deposited"; `out` from "sent", "paid", "withdrawn", "debited", "purchased".
- **Amount:** regex on `UGX|USh` prefix/suffix, with comma+decimal handling. First match that isn't the labelled balance/fee.
- **Balance/Fee:** labelled regex on "balance:|new balance:" and "fee:|charge:|tax:".
- **Party:** "from X" / "to X" capture, fallback to first uppercase block.
- **Category:** rule-based regex (Salary/Loan/Utilities/Transport/Food/etc).
- **Confidence:** high if 4 of 4 dimensions resolve, medium if ≥2, else low.

## Background SMS Reading (Android)

Silent auto-reading of incoming SMS requires Android-only `READ_SMS`/`RECEIVE_SMS` permissions and a custom native module. The parser is platform-agnostic — when the app is built as a native Android dev client, it can be plugged into a native SMS BroadcastReceiver and `addTransactionFromParsed()` called per incoming message. iOS does not allow this.

For now, paste-to-import via the Scanner tab works on every platform.

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
