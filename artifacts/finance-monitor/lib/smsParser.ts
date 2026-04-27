import type { AccountKey, Category, ParsedSms, TxnType } from "./types";

/**
 * SMS parser tuned for Ugandan bank and mobile money formats.
 * Handles MTN MoMo, Airtel Money, Stanbic, DFCU, Pearl Bank, KCB, NCBA.
 */

const ACCOUNT_PATTERNS: { key: AccountKey; rx: RegExp }[] = [
  { key: "MTN", rx: /\b(mtn|momo|mobile\s*money)\b/i },
  { key: "Airtel", rx: /\bairtel\b/i },
  { key: "Stanbic", rx: /\bstanbic\b/i },
  { key: "DFCU", rx: /\bdfcu\b/i },
  { key: "Pearl", rx: /\bpearl\s*bank|hfb|housing\s*finance\b/i },
  { key: "KCB", rx: /\bkcb\b/i },
  { key: "NCBA", rx: /\bncba\b/i },
];

const IN_KEYWORDS = [
  "received from",
  "you have received",
  "credited",
  "deposited",
  "paid to you",
  "paid you",
  "has been credited",
  "transferred to your account",
  "received ugx",
  "received money",
];

const OUT_KEYWORDS = [
  "sent to",
  "paid to",
  "you have sent",
  "withdrawn",
  "withdrawal",
  "debited",
  "transferred to",
  "purchased",
  "bought airtime",
  "bought data",
  "bought bundle",
  "loan repayment",
  "you paid",
  "spent",
  "charged",
];

const CATEGORY_RULES: { cat: Category; rx: RegExp }[] = [
  { cat: "Salary", rx: /\b(pegasus|salary|payroll|wages|hr)\b/i },
  { cat: "Loan Repayment", rx: /\b(loan|repay|repayment|installment|hfb|jumo|kwasa|wewole|mokash|xtra\s*cash)\b/i },
  { cat: "School Fees", rx: /\b(school|tuition|fees|university|college)\b/i },
  { cat: "Data/Airtime", rx: /\b(airtime|data|bundle|mb|gb|minutes|sms)\b/i },
  { cat: "Utilities", rx: /\b(umeme|yaka|nwsc|electricity|water|gotv|dstv|startimes|zuku)\b/i },
  { cat: "Transport", rx: /\b(faras|safeboda|uber|bolt|taxify|fuel|petrol|shell|total)\b/i },
  { cat: "Food", rx: /\b(jumia|glovo|chowdeck|restaurant|cafe|kfc|pizza)\b/i },
  { cat: "Entertainment", rx: /\b(mimosa|lemon|club|bar|nightlife|cinema|netflix|spotify)\b/i },
  { cat: "Withdrawal", rx: /\bwithdraw|withdrawal|cash\s*out\b/i },
  { cat: "Fee", rx: /\b(fee|charge|tax|excise|levy)\b/i },
  { cat: "Transfer", rx: /\btransfer|sent\s*to|to\s*account\b/i },
  { cat: "Service", rx: /\b(interswitch|ivan|service|consult|invoice)\b/i },
  { cat: "Gift", rx: /\b(gift|donation|present)\b/i },
];

function detectAccount(text: string): AccountKey {
  for (const a of ACCOUNT_PATTERNS) if (a.rx.test(text)) return a.key;
  return "Other";
}

function detectType(text: string): TxnType | null {
  const lower = text.toLowerCase();
  for (const k of IN_KEYWORDS) if (lower.includes(k)) return "in";
  for (const k of OUT_KEYWORDS) if (lower.includes(k)) return "out";
  // Fallback heuristics
  if (/\bpaid\b/i.test(lower) && /\bto\b/i.test(lower)) return "out";
  if (/\breceived\b/i.test(lower)) return "in";
  return null;
}

function detectCategory(text: string, type: TxnType | null): Category {
  for (const r of CATEGORY_RULES) if (r.rx.test(text)) return r.cat;
  return type === "in" ? "Other" : "Other";
}

function parseAmount(text: string): { amount: number; balance?: number; fee?: number } {
  // Look for amount immediately following "UGX" or preceding "UGX"
  // Common formats: "UGX 25,000", "UGX25,000.00", "25,000 UGX", "25000UGX"
  const amtRx = /(?:UGX|USh|Ush)\s*([0-9][0-9,]*(?:\.[0-9]+)?)|([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:UGX|USh|Ush)/gi;

  const matches: number[] = [];
  let m;
  while ((m = amtRx.exec(text)) !== null) {
    const raw = (m[1] ?? m[2] ?? "").replace(/,/g, "");
    const n = parseFloat(raw);
    if (!Number.isNaN(n) && n > 0) matches.push(n);
  }

  // Try to find labelled balance & fee
  const balRx = /(?:balance|new\s*balance|bal)[:\s]+(?:UGX|USh)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i;
  const feeRx = /(?:fee|charge|tax)[:\s]+(?:UGX|USh)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i;

  const bm = text.match(balRx);
  const fm = text.match(feeRx);

  const balance = bm ? parseFloat(bm[1].replace(/,/g, "")) : undefined;
  const fee = fm ? parseFloat(fm[1].replace(/,/g, "")) : undefined;

  // Primary amount is the first match that isn't the balance/fee
  let amount = 0;
  for (const v of matches) {
    if (balance !== undefined && Math.abs(v - balance) < 0.01) continue;
    if (fee !== undefined && Math.abs(v - fee) < 0.01) continue;
    amount = v;
    break;
  }
  if (!amount && matches.length) amount = matches[0];

  return { amount, balance, fee };
}

function parseParty(text: string, type: TxnType | null): string {
  // Patterns like "from JOHN DOE", "to JOHN DOE 077..", "by JOHN DOE"
  const fromRx = /(?:from|by)\s+([A-Z][A-Za-z .'\-/]{2,60}?)(?=\s+(?:on|at|via|ref|trans|txn|with|tel|phone|mobile|account|\d|\.|$))/i;
  const toRx = /(?:to|paid)\s+([A-Z][A-Za-z .'\-/]{2,60}?)(?=\s+(?:on|at|via|ref|trans|txn|with|tel|phone|mobile|account|\d|\.|$))/i;

  if (type === "in") {
    const m = text.match(fromRx);
    if (m) return m[1].trim();
  }
  if (type === "out") {
    const m = text.match(toRx);
    if (m) return m[1].trim();
  }
  // Generic uppercase chunk fallback
  const upper = text.match(/([A-Z][A-Z0-9 &.\-/']{4,40})/);
  if (upper) return upper[1].trim();
  return "Unknown";
}

function parseTxnId(text: string): string | undefined {
  const idRx = /(?:txn[\s#:id]*|trans(?:action)?[\s#:id]*|ref(?:erence)?[\s#:]*|id[\s#:]+)([A-Z0-9.\-]{6,})/i;
  const m = text.match(idRx);
  return m ? m[1] : undefined;
}

export function parseSms(input: string): ParsedSms {
  const text = (input || "").trim();
  const account = detectAccount(text);
  const type = detectType(text);
  const { amount, balance, fee } = parseAmount(text);
  const party = parseParty(text, type);
  const category = detectCategory(text, type);
  const txnId = parseTxnId(text);

  let confidence: ParsedSms["confidence"] = "low";
  const hits = [type !== null, amount > 0, account !== "Other", party !== "Unknown"].filter(Boolean).length;
  if (hits >= 4) confidence = "high";
  else if (hits >= 2) confidence = "medium";

  return {
    type,
    account,
    amount,
    party,
    category,
    fee,
    balance,
    txnId,
    confidence,
    raw: text,
  };
}
