import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { genId } from "@/lib/format";
import {
  GBP_TO_UGX,
  ROY_PHASE1_AGREED,
  ROY_PHASE2_AGREED,
  SEED_ACCOUNTS,
  SEED_CLEARED,
  SEED_LOANS,
  SEED_RECEIVABLES,
  SEED_ROY_PAYMENTS,
  SEED_TRANSACTIONS,
} from "@/lib/seedData";
import type {
  AccountBalance,
  AccountKey,
  Loan,
  ParsedSms,
  Receivable,
  RoyPayment,
  Transaction,
} from "@/lib/types";

interface FinanceState {
  ready: boolean;
  accounts: AccountBalance[];
  transactions: Transaction[];
  loans: Loan[];
  cleared: string[];
  receivables: Receivable[];
  royPayments: RoyPayment[];
  gbpRate: number;
}

interface FinanceActions {
  addTransaction: (t: Omit<Transaction, "id">) => void;
  addTransactionFromParsed: (p: ParsedSms) => Transaction;
  deleteTransaction: (id: string) => void;
  updateAccountBalance: (key: AccountKey, balance: number) => void;
  recordLoanPayment: (loanId: string, amount: number) => void;
  addLoan: (loan: Omit<Loan, "id">) => void;
  setGbpRate: (rate: number) => void;
  resetToSeed: () => Promise<void>;
}

type FinanceContextValue = FinanceState & FinanceActions & {
  totals: {
    cashTotal: number;
    debtTotal: number;
    netPosition: number;
    receivableOutstanding: number;
    royPhase1Paid: number;
    royPhase2Paid: number;
    royPhase1Outstanding: number;
    royPhase2Outstanding: number;
  };
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const STORAGE_KEY = "fmug.v1.state";

interface PersistedState {
  accounts: AccountBalance[];
  transactions: Transaction[];
  loans: Loan[];
  cleared: string[];
  receivables: Receivable[];
  royPayments: RoyPayment[];
  gbpRate: number;
}

const seedState: PersistedState = {
  accounts: SEED_ACCOUNTS,
  transactions: SEED_TRANSACTIONS,
  loans: SEED_LOANS,
  cleared: SEED_CLEARED,
  receivables: SEED_RECEIVABLES,
  royPayments: SEED_ROY_PAYMENTS,
  gbpRate: GBP_TO_UGX,
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(seedState);
  const [ready, setReady] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          setState({ ...seedState, ...parsed });
        }
      } catch {
        // Ignore — fall back to seed
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on changes (after hydration)
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setState((s) => {
      const newTxn: Transaction = { id: genId(), ...t };
      const next = { ...s, transactions: [newTxn, ...s.transactions] };
      // Auto-update account balance
      next.accounts = s.accounts.map((a) =>
        a.key === t.account
          ? { ...a, balance: a.balance + (t.type === "in" ? t.amount : -t.amount) }
          : a,
      );
      return next;
    });
  }, []);

  const addTransactionFromParsed = useCallback((p: ParsedSms): Transaction => {
    const txn: Transaction = {
      id: genId(),
      type: p.type ?? "out",
      source: p.party === "Unknown" ? "SMS Import" : p.party,
      amount: p.amount,
      account: p.account === "Other" ? "MTN" : p.account,
      date: new Date().toISOString().slice(0, 10),
      category: p.category,
      fee: p.fee,
      balance: p.balance,
      txnId: p.txnId,
      rawSms: p.raw,
      autoImported: true,
    };
    setState((s) => {
      const accounts = s.accounts.map((a) => {
        if (a.key !== txn.account) return a;
        // If the SMS reported a balance, trust it; otherwise apply delta
        if (typeof p.balance === "number" && p.balance > 0) {
          return { ...a, balance: p.balance };
        }
        const delta = txn.type === "in" ? txn.amount : -txn.amount;
        return { ...a, balance: a.balance + delta };
      });
      return { ...s, transactions: [txn, ...s.transactions], accounts };
    });
    return txn;
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => {
      const txn = s.transactions.find((t) => t.id === id);
      if (!txn) return s;
      const accounts = s.accounts.map((a) =>
        a.key === txn.account
          ? { ...a, balance: a.balance + (txn.type === "in" ? -txn.amount : txn.amount) }
          : a,
      );
      return {
        ...s,
        transactions: s.transactions.filter((t) => t.id !== id),
        accounts,
      };
    });
  }, []);

  const updateAccountBalance = useCallback((key: AccountKey, balance: number) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.key === key ? { ...a, balance } : a)),
    }));
  }, []);

  const recordLoanPayment = useCallback((loanId: string, amount: number) => {
    setState((s) => ({
      ...s,
      loans: s.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              paid: Math.min(l.total, l.paid + amount),
              payments: [
                ...(l.payments ?? []),
                { id: genId(), amount, date: new Date().toISOString().slice(0, 10) },
              ],
            }
          : l,
      ),
    }));
  }, []);

  const addLoan = useCallback((loan: Omit<Loan, "id">) => {
    setState((s) => ({ ...s, loans: [...s.loans, { id: genId(), ...loan }] }));
  }, []);

  const setGbpRate = useCallback((rate: number) => {
    setState((s) => ({ ...s, gbpRate: rate }));
  }, []);

  const resetToSeed = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(seedState);
  }, []);

  const totals = useMemo(() => {
    const cashTotal = state.accounts.reduce((sum, a) => sum + a.balance, 0);
    const debtTotal = state.loans.reduce((sum, l) => sum + Math.max(0, l.total - l.paid), 0);
    const netPosition = cashTotal - debtTotal;
    const receivableOutstanding = state.receivables.reduce(
      (sum, r) => sum + Math.max(0, r.total - r.paid),
      0,
    );

    const royPhase1Paid = state.royPayments.filter((p) => p.phase === 1).reduce((s, p) => s + p.gbp, 0);
    const royPhase2Paid = state.royPayments.filter((p) => p.phase === 2).reduce((s, p) => s + p.gbp, 0);
    const royPhase1Outstanding = Math.max(0, ROY_PHASE1_AGREED - royPhase1Paid);
    const royPhase2Outstanding = Math.max(0, ROY_PHASE2_AGREED - royPhase2Paid);

    return {
      cashTotal,
      debtTotal,
      netPosition,
      receivableOutstanding,
      royPhase1Paid,
      royPhase2Paid,
      royPhase1Outstanding,
      royPhase2Outstanding,
    };
  }, [state]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      ...state,
      totals,
      addTransaction,
      addTransactionFromParsed,
      deleteTransaction,
      updateAccountBalance,
      recordLoanPayment,
      addLoan,
      setGbpRate,
      resetToSeed,
    }),
    [
      ready,
      state,
      totals,
      addTransaction,
      addTransactionFromParsed,
      deleteTransaction,
      updateAccountBalance,
      recordLoanPayment,
      addLoan,
      setGbpRate,
      resetToSeed,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
