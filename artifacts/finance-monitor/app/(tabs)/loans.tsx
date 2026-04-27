import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fmtUGX, pct } from "@/lib/format";

export default function LoansScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { loans, cleared, recordLoanPayment } = useFinance();

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);

  const submitPayment = () => {
    const amt = parseFloat(payAmount.replace(/,/g, ""));
    if (!selectedLoan || !amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid payment amount.");
      return;
    }
    recordLoanPayment(selectedLoan.id, amt);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setSelectedLoanId(null);
    setPayAmount("");
    Alert.alert("Payment recorded", `${fmtUGX(amt)} towards ${selectedLoan.name}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Header
        title="Loans & Debt"
        subtitle={`${loans.length} active`}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>ACTIVE LOANS</SectionLabel>
        {loans.map((l) => {
          const remaining = Math.max(0, l.total - l.paid);
          const progress = pct(l.paid, l.total);
          const tone =
            l.color === "danger"
              ? c.danger
              : l.color === "warn"
              ? c.warn
              : l.color === "primary"
              ? c.primary
              : c.textMuted;

          return (
            <Card key={l.id} borderColor={tone + "44"} style={{ marginBottom: 12 }}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.loanName, { color: c.text }]}>{l.name}</Text>
                  <Text style={[styles.loanDue, { color: c.textMuted }]}>Due: {l.due}</Text>
                </View>
                <Badge label={l.note} color={tone} />
              </View>

              <View style={styles.statsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statLabel, { color: c.textDim }]}>REMAINING</Text>
                  <Text style={[styles.statBig, { color: tone }]}>{fmtUGX(remaining)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statLabel, { color: c.textDim }]}>PAID</Text>
                  <Text style={[styles.statBig, { color: c.text }]}>{fmtUGX(l.paid)}</Text>
                </View>
              </View>

              <ProgressBar value={progress} color={tone} height={8} />
              <View style={styles.progRow}>
                <Text style={[styles.progText, { color: c.textMuted }]}>
                  {progress}% paid
                </Text>
                <Text style={[styles.progText, { color: c.textDim }]}>
                  of {fmtUGX(l.total)}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setSelectedLoanId(l.id);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync().catch(() => {});
                  }
                }}
                style={({ pressed }) => [
                  styles.payBtn,
                  {
                    borderColor: tone,
                    backgroundColor: tone + "16",
                    opacity: pressed ? 0.7 : 1,
                    borderRadius: c.radius,
                  },
                ]}
              >
                <Feather name="plus-circle" size={14} color={tone} />
                <Text style={[styles.payBtnText, { color: tone }]}>Record Payment</Text>
              </Pressable>
            </Card>
          );
        })}

        <SectionLabel>CLEARED RECENTLY</SectionLabel>
        <Card>
          {cleared.map((name, i) => (
            <View
              key={name}
              style={[
                styles.clearedRow,
                i < cleared.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkBadge,
                  { backgroundColor: c.primarySoft, borderColor: c.primary + "55" },
                ]}
              >
                <Feather name="check" size={12} color={c.primary} />
              </View>
              <Text style={[styles.clearedText, { color: c.text }]}>{name}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <Modal
        visible={!!selectedLoan}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLoanId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.backdrop} onPress={() => setSelectedLoanId(null)} />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: c.bgElevated,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.handle}>
              <View style={[styles.handleBar, { backgroundColor: c.border }]} />
            </View>
            <Text style={[styles.modalTitle, { color: c.text }]}>Record Payment</Text>
            <Text style={[styles.modalLoan, { color: c.primary }]}>{selectedLoan?.name}</Text>
            <Text style={[styles.modalLabel, { color: c.textMuted }]}>AMOUNT (UGX)</Text>
            <TextInput
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
              placeholderTextColor={c.textDim}
              style={[
                styles.modalInput,
                { color: c.text, backgroundColor: c.card, borderColor: c.border },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSelectedLoanId(null)}
                style={({ pressed }) => [
                  styles.modalBtnGhost,
                  { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: c.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submitPayment}
                style={({ pressed }) => [
                  styles.modalBtnPrimary,
                  { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: c.bg }]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  loanName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  loanDue: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  statBig: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  progRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  payBtn: {
    marginTop: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  payBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  clearedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    paddingHorizontal: 18,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 4,
    marginTop: 8,
  },
  modalLoan: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 18,
  },
  modalLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
