export type AccountKey = "MTN" | "Airtel" | "Stanbic" | "DFCU" | "Pearl" | "KCB" | "NCBA" | "Other";

export type TxnType = "in" | "out";

export type Category =
  | "Salary"
  | "Service"
  | "Gift"
  | "Loan Received"
  | "Loan Repayment"
  | "Personal"
  | "Household"
  | "Transport"
  | "Food"
  | "Entertainment"
  | "Data/Airtime"
  | "Utilities"
  | "School Fees"
  | "Investment"
  | "Savings"
  | "Transfer"
  | "Withdrawal"
  | "Fee"
  | "Other";

export interface Transaction {
  id: string;
  type: TxnType;
  source: string;          // counterparty / description
  amount: number;
  account: AccountKey;
  date: string;            // ISO date
  category: Category;
  fee?: number;
  balance?: number;
  txnId?: string;
  rawSms?: string;
  autoImported?: boolean;
}

export interface Loan {
  id: string;
  name: string;
  total: number;
  paid: number;
  weekly?: number | null;
  due: string;
  note: string;
  color: "danger" | "warn" | "muted" | "primary";
  payments?: { id: string; amount: number; date: string }[];
}

export interface Receivable {
  id: string;
  name: string;
  total: number;
  paid: number;
  currency?: string;
  notes?: string;
}

export interface RoyPayment {
  id: string;
  date: string;       // ISO
  gbp: number;
  ugx: number;
  phase: 1 | 2;
  note?: string;
}

export interface AccountBalance {
  key: AccountKey;
  label: string;
  number?: string;
  balance: number;
}

export interface ParsedSms {
  type: TxnType | null;
  account: AccountKey;
  amount: number;
  party: string;
  category: Category;
  fee?: number;
  balance?: number;
  txnId?: string;
  confidence: "high" | "medium" | "low";
  raw: string;
}
