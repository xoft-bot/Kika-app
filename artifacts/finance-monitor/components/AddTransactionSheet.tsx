import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { todayISO } from "@/lib/format";
import type { AccountKey, Category, TxnType } from "@/lib/types";

const ACCOUNTS: AccountKey[] = ["MTN", "Airtel", "Stanbic", "DFCU", "Pearl", "Other"];
const CATEGORIES: Category[] = [
  "Salary",
  "Service",
  "Gift",
  "Loan Repayment",
  "Personal",
  "Household",
  "Transport",
  "Food",
  "Entertainment",
  "Data/Airtime",
  "Utilities",
  "School Fees",
  "Investment",
  "Withdrawal",
  "Fee",
  "Transfer",
  "Other",
];

export interface NewTransactionInput {
  type: TxnType;
  source: string;
  amount: number;
  account: AccountKey;
  category: Category;
  date: string;
}

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (txn: NewTransactionInput) => void;
  defaults?: Partial<NewTransactionInput>;
}

export function AddTransactionSheet({
  visible,
  onClose,
  onSave,
  defaults,
}: AddTransactionSheetProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TxnType>(defaults?.type ?? "out");
  const [source, setSource] = useState(defaults?.source ?? "");
  const [amount, setAmount] = useState(defaults?.amount ? String(defaults.amount) : "");
  const [account, setAccount] = useState<AccountKey>(defaults?.account ?? "MTN");
  const [category, setCategory] = useState<Category>(defaults?.category ?? "Other");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setType(defaults?.type ?? "out");
    setSource(defaults?.source ?? "");
    setAmount("");
    setAccount(defaults?.account ?? "MTN");
    setCategory(defaults?.category ?? "Other");
    setError(null);
  };

  const handleSave = () => {
    const num = parseFloat(amount.replace(/,/g, ""));
    if (!source.trim()) return setError("Add a description");
    if (!num || num <= 0) return setError("Amount must be greater than 0");
    setError(null);
    onSave({
      type,
      source: source.trim(),
      amount: num,
      account,
      category,
      date: defaults?.date ?? todayISO(),
    });
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.overlay, { paddingTop: insets.top + 40 }]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: c.border }]} />
          </View>

          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: c.text }]}>New Transaction</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Type toggle */}
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setType("in")}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: type === "in" ? c.primarySoft : c.card,
                    borderColor: type === "in" ? c.primary : c.border,
                  },
                ]}
              >
                <Feather name="arrow-down-left" size={16} color={type === "in" ? c.primary : c.textMuted} />
                <Text style={[styles.typeText, { color: type === "in" ? c.primary : c.textMuted }]}>
                  Money In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType("out")}
                style={[
                  styles.typePill,
                  {
                    backgroundColor: type === "out" ? c.dangerSoft : c.card,
                    borderColor: type === "out" ? c.danger : c.border,
                  },
                ]}
              >
                <Feather name="arrow-up-right" size={16} color={type === "out" ? c.danger : c.textMuted} />
                <Text style={[styles.typeText, { color: type === "out" ? c.danger : c.textMuted }]}>
                  Money Out
                </Text>
              </Pressable>
            </View>

            <Field label="Description">
              <TextInput
                value={source}
                onChangeText={setSource}
                placeholder="e.g. Pegasus Salary"
                placeholderTextColor={c.textDim}
                style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.border }]}
              />
            </Field>

            <Field label="Amount (UGX)">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={c.textDim}
                style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.border, fontSize: 18 }]}
              />
            </Field>

            <Field label="Account">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillRow}>
                  {ACCOUNTS.map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => setAccount(a)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: account === a ? c.primarySoft : c.card,
                          borderColor: account === a ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: account === a ? c.primary : c.textMuted },
                        ]}
                      >
                        {a}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>

            <Field label="Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillRow}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: category === cat ? c.accentSoft : c.card,
                          borderColor: category === cat ? c.accent : c.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: category === cat ? c.accent : c.textMuted },
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>

            {error ? (
              <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: c.primary,
                  opacity: pressed ? 0.85 : 1,
                  borderRadius: c.radius,
                },
              ]}
            >
              <Text style={[styles.saveText, { color: c.bg }]}>Save Transaction</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: "90%",
  },
  handle: {
    alignItems: "center",
    paddingVertical: 6,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  typePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  field: {
    marginTop: 14,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  error: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
