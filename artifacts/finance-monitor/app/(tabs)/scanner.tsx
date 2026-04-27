import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fmtUGX } from "@/lib/format";
import { parseSms } from "@/lib/smsParser";
import type { ParsedSms } from "@/lib/types";

const SAMPLE_SMS = [
  {
    label: "MTN Receive",
    text:
      "Y'ello, You have received UGX 476,000 from PEGASUS TECHNOLOGIES 256772123456 on 23/04/2026 at 10:42. New balance: UGX 629,980. TID: 12345678901",
  },
  {
    label: "Airtel Send",
    text:
      "You have sent UGX 50,495 to JUMOWORLD 256755987654 on 22/04/2026. Fee: UGX 1,000. New balance: UGX 456,014. Ref: AT9988776",
  },
  {
    label: "Pearl Bank",
    text:
      "Pearl Bank: Loan of UGX 115,000 disbursed to your MTN MoMo on 02/04/2026. Repayment due 02/05/2026 at 9% interest. Ref PRL2026-0402.",
  },
];

export default function ScannerScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { addTransactionFromParsed } = useFinance();

  const [sms, setSms] = useState("");
  const [parsed, setParsed] = useState<ParsedSms | null>(null);

  const handleParse = (text?: string) => {
    const input = text ?? sms;
    if (!input.trim()) return;
    const result = parseSms(input);
    setParsed(result);
    if (text) setSms(text);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleImport = () => {
    if (!parsed) return;
    if (parsed.amount <= 0 || !parsed.type) {
      Alert.alert(
        "Cannot import",
        "We couldn't detect the amount or direction. Try editing in the Transactions tab.",
      );
      return;
    }
    const txn = addTransactionFromParsed(parsed);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setSms("");
    setParsed(null);
    Alert.alert("Imported", `${txn.source} · ${fmtUGX(txn.amount)}`);
  };

  const confidenceColor =
    parsed?.confidence === "high"
      ? c.primary
      : parsed?.confidence === "medium"
      ? c.warn
      : c.danger;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Header
        title="SMS Scanner"
        subtitle="Paste any bank or mobile money message"
        rightIcon="info"
        onPressRight={() =>
          Alert.alert(
            "About SMS Auto-Import",
            "Silent background SMS reading requires Android-only permissions and a custom build. " +
              "For now, paste any SMS here and the parser will detect amount, account, party and category. " +
              "On a native Android build, this same parser will run automatically on every incoming SMS.",
          )
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
          }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View style={styles.smsHead}>
              <MaterialCommunityIcons name="message-text-outline" size={18} color={c.accent} />
              <Text style={[styles.smsHeadText, { color: c.textMuted }]}>SMS BODY</Text>
            </View>
            <TextInput
              value={sms}
              onChangeText={setSms}
              multiline
              placeholder="Paste full message text here..."
              placeholderTextColor={c.textDim}
              style={[
                styles.smsInput,
                {
                  color: c.text,
                  backgroundColor: c.cardElevated,
                  borderColor: c.border,
                },
              ]}
              textAlignVertical="top"
            />
            <View style={styles.actions}>
              <Pressable
                onPress={() => handleParse()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: c.primary,
                    opacity: pressed ? 0.85 : 1,
                    borderRadius: c.radius,
                  },
                ]}
              >
                <Feather name="zap" size={16} color={c.bg} />
                <Text style={[styles.primaryBtnText, { color: c.bg }]}>Parse SMS</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSms("");
                  setParsed(null);
                }}
                style={({ pressed }) => [
                  styles.ghostBtn,
                  {
                    backgroundColor: c.cardElevated,
                    borderColor: c.border,
                    opacity: pressed ? 0.7 : 1,
                    borderRadius: c.radius,
                  },
                ]}
              >
                <Feather name="x" size={16} color={c.textMuted} />
                <Text style={[styles.ghostBtnText, { color: c.textMuted }]}>Clear</Text>
              </Pressable>
            </View>
          </Card>

          {parsed ? (
            <>
              <SectionLabel
                right={
                  <Badge
                    label={`${parsed.confidence.toUpperCase()} CONFIDENCE`}
                    color={confidenceColor}
                  />
                }
              >
                DETECTED
              </SectionLabel>
              <Card borderColor={confidenceColor + "55"}>
                <DetailRow
                  label="Type"
                  valueNode={
                    <Badge
                      label={parsed.type === "in" ? "MONEY IN" : parsed.type === "out" ? "MONEY OUT" : "UNKNOWN"}
                      color={parsed.type === "in" ? c.primary : parsed.type === "out" ? c.danger : c.textMuted}
                    />
                  }
                />
                <Divider />
                <DetailRow label="Amount">
                  <Text
                    style={[
                      styles.amountVal,
                      { color: parsed.type === "in" ? c.primary : c.danger },
                    ]}
                  >
                    {fmtUGX(parsed.amount)}
                  </Text>
                </DetailRow>
                {parsed.fee ? (
                  <>
                    <Divider />
                    <DetailRow label="Fee">
                      <Text style={[styles.detailVal, { color: c.warn }]}>{fmtUGX(parsed.fee)}</Text>
                    </DetailRow>
                  </>
                ) : null}
                {parsed.balance ? (
                  <>
                    <Divider />
                    <DetailRow label="New Balance">
                      <Text style={[styles.detailVal, { color: c.text }]}>{fmtUGX(parsed.balance)}</Text>
                    </DetailRow>
                  </>
                ) : null}
                <Divider />
                <DetailRow label="Account">
                  <Text style={[styles.detailVal, { color: c.text }]}>{parsed.account}</Text>
                </DetailRow>
                <Divider />
                <DetailRow label="Counterparty">
                  <Text style={[styles.detailVal, { color: c.text }]} numberOfLines={1}>
                    {parsed.party}
                  </Text>
                </DetailRow>
                <Divider />
                <DetailRow label="Category">
                  <Badge label={parsed.category} color={c.accent} />
                </DetailRow>
                {parsed.txnId ? (
                  <>
                    <Divider />
                    <DetailRow label="Reference">
                      <Text style={[styles.detailVal, { color: c.textMuted, fontSize: 11 }]} numberOfLines={1}>
                        {parsed.txnId}
                      </Text>
                    </DetailRow>
                  </>
                ) : null}

                <Pressable
                  onPress={handleImport}
                  disabled={parsed.amount <= 0 || !parsed.type}
                  style={({ pressed }) => [
                    styles.importBtn,
                    {
                      backgroundColor:
                        parsed.amount > 0 && parsed.type ? c.primary : c.cardElevated,
                      opacity: pressed ? 0.85 : 1,
                      borderRadius: c.radius,
                    },
                  ]}
                >
                  <Feather
                    name="check"
                    size={16}
                    color={parsed.amount > 0 && parsed.type ? c.bg : c.textMuted}
                  />
                  <Text
                    style={[
                      styles.importBtnText,
                      {
                        color: parsed.amount > 0 && parsed.type ? c.bg : c.textMuted,
                      },
                    ]}
                  >
                    Import & Update Balance
                  </Text>
                </Pressable>
              </Card>
            </>
          ) : null}

          <SectionLabel>QUICK SAMPLES</SectionLabel>
          {SAMPLE_SMS.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => handleParse(s.text)}
              style={({ pressed }) => [
                styles.sampleCard,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  borderRadius: c.radius,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.sampleHead}>
                <Text style={[styles.sampleLabel, { color: c.accent }]}>{s.label}</Text>
                <Feather name="play" size={12} color={c.accent} />
              </View>
              <Text style={[styles.sampleText, { color: c.textMuted }]} numberOfLines={2}>
                {s.text}
              </Text>
            </Pressable>
          ))}

          <SectionLabel>SUPPORTED FORMATS</SectionLabel>
          <Card>
            {[
              { name: "MTN Mobile Money", icon: "cellphone-wireless" as const, color: c.mtn },
              { name: "Airtel Money", icon: "cellphone-wireless" as const, color: c.airtel },
              { name: "Stanbic Bank", icon: "bank" as const, color: c.bank },
              { name: "DFCU Bank", icon: "bank" as const, color: c.bank },
              { name: "Pearl Bank / HFB", icon: "bank" as const, color: c.bank },
              { name: "KCB Bank", icon: "bank" as const, color: c.bank },
              { name: "NCBA Bank", icon: "bank" as const, color: c.bank },
            ].map((b) => (
              <View key={b.name} style={styles.bankRow}>
                <MaterialCommunityIcons name={b.icon} size={16} color={b.color} />
                <Text style={[styles.bankText, { color: c.text }]}>{b.name}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function DetailRow({
  label,
  children,
  valueNode,
}: {
  label: string;
  children?: React.ReactNode;
  valueNode?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <View style={{ flexShrink: 1, alignItems: "flex-end" }}>{valueNode ?? children}</View>
    </View>
  );
}

function Divider() {
  const c = useColors();
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  smsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  smsHeadText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
  },
  smsInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    minHeight: 130,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  ghostBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  detailVal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  amountVal: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  divider: {
    height: 1,
  },
  importBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  importBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  sampleCard: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  sampleHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sampleLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  sampleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  bankText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
