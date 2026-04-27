import type { AccountBalance, Loan, Receivable, RoyPayment, Transaction } from "./types";

export const SEED_ACCOUNTS: AccountBalance[] = [
  { key: "MTN", label: "MTN MoMo", number: "0788 177 913", balance: 153_980 },
  { key: "Airtel", label: "Airtel Money", number: "0701 276 337", balance: 506_509 },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "in",  source: "Pegasus Technologies", amount: 476_000, account: "MTN",    date: "2026-04-23", category: "Salary" },
  { id: "t2", type: "in",  source: "Ivan (Interswitch)",   amount: 804_000, account: "Airtel", date: "2026-04-22", category: "Service" },
  { id: "t3", type: "out", source: "Timothy Loan",         amount: 200_000, account: "MTN",    date: "2026-04-21", category: "Loan Repayment" },
  { id: "t4", type: "out", source: "Tracy Nakandi",        amount:  50_000, account: "MTN",    date: "2026-04-20", category: "Personal" },
  { id: "t5", type: "in",  source: "Debbie (Sister)",      amount: 200_000, account: "MTN",    date: "2026-04-13", category: "Gift" },
  { id: "t6", type: "out", source: "Document Bank",        amount: 100_000, account: "MTN",    date: "2026-04-10", category: "Investment" },
  { id: "t7", type: "out", source: "Faras Technologies",   amount:  33_000, account: "Airtel", date: "2026-04-09", category: "Transport" },
  { id: "t8", type: "out", source: "Cohen Nimusiima",      amount:  60_000, account: "MTN",    date: "2026-04-08", category: "Household" },
  { id: "t9", type: "in",  source: "NCBA Bank Uganda",     amount: 500_000, account: "MTN",    date: "2026-04-07", category: "Gift" },
  { id: "t10", type: "in", source: "Belina Nabuwala",      amount:  41_000, account: "Airtel", date: "2026-04-10", category: "Gift" },
];

export const SEED_LOANS: Loan[] = [
  {
    id: "l1",
    name: "Timothy",
    total: 2_800_000,
    paid: 100_000,
    weekly: 200_000,
    due: "Weekly",
    note: "In arrears",
    color: "danger",
  },
  {
    id: "l2",
    name: "Pearl Bank (MTN)",
    total: 115_000,
    paid: 0,
    weekly: null,
    due: "02 May 2026",
    note: "9% interest",
    color: "warn",
  },
  {
    id: "l3",
    name: "MoKash Overdraft",
    total: 25_000,
    paid: 0,
    weekly: null,
    due: "Rolling",
    note: "Auto-savings",
    color: "muted",
  },
];

export const SEED_CLEARED = [
  "Jumoworld (full)",
  "Kwasa Kwasa",
  "HFB loans",
  "Neria Natuhwera (200K)",
  "Pearl Bank Xtra Cash (37,060)",
  "School fees (201,050)",
  "Wewole",
];

export const SEED_RECEIVABLES: Receivable[] = [
  { id: "r1", name: "Roy Mbahira (UK)", total: 3_069_770, paid: 2_825_967, currency: "£", notes: "Phase 2 outstanding" },
  { id: "r2", name: "Winnie Namara",   total: 200_000,   paid: 110_000,   notes: "Item sale" },
];

export const SEED_ROY_PAYMENTS: RoyPayment[] = [
  { id: "rp1", date: "2025-11-16", gbp:  50, ugx: 236_500, phase: 1 },
  { id: "rp2", date: "2025-11-28", gbp:  50, ugx: 237_728, phase: 1 },
  { id: "rp3", date: "2025-12-05", gbp:  49, ugx: 232_837, phase: 1 },
  { id: "rp4", date: "2025-12-11", gbp:  50, ugx: 236_506, phase: 1 },
  { id: "rp5", date: "2025-12-19", gbp: 100, ugx: 471_811, phase: 1 },
  { id: "rp6", date: "2025-12-22", gbp: 254, ugx: 1_200_000, phase: 1 },
  { id: "rp7", date: "2025-12-31", gbp:  86, ugx: 406_376, phase: 1 },
  { id: "rp8", date: "2026-01-19", gbp: 107, ugx: 506_571, phase: 1 },
  { id: "rp9", date: "2026-01-19", gbp:  16, ugx:  75_712, phase: 2, note: "P1 spill" },
  { id: "rp10", date: "2026-01-23", gbp:  25, ugx: 118_947, phase: 2 },
  { id: "rp11", date: "2026-01-26", gbp: 101, ugx: 480_034, phase: 2 },
  { id: "rp12", date: "2026-02-06", gbp: 101, ugx: 479_839, phase: 2 },
  { id: "rp13", date: "2026-02-13", gbp: 101, ugx: 476_192, phase: 2 },
  { id: "rp14", date: "2026-02-28", gbp: 101, ugx: 479_358, phase: 2 },
  { id: "rp15", date: "2026-03-15", gbp: 100, ugx: 479_385, phase: 2 },
  { id: "rp16", date: "2026-03-28", gbp: 106, ugx: 502_096, phase: 2, note: "High rate" },
];

export const ROY_PHASE1_AGREED = 730;
export const ROY_PHASE2_AGREED = 1_260;
export const GBP_TO_UGX = 4_730;
