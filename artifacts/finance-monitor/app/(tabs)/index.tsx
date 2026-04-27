import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountIcon } from "@/components/AccountIcon";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fmtCompact, fmtDateLong, fmtUGX, pct } from "@/lib/format";

export default function DashboardScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { accounts, totals, loans, receivables, transactions, reports, royPayments, gbpRate, resetToSeed } =
    useFinance();
  const [active, setActive] = useState<"mtn" | "airtel" | "bank" | "all">("all");

  const filteredAccounts = useMemo(() => {
    if (active === "all") return accounts;
    if (active === "mtn") return accounts.filter((a) => a.key === "MTN");
    if (active === "airtel") return accounts.filter((a) => a.key === "Airtel");
    return accounts.filter((a) => ["Stanbic", "DFCU", "Pearl", "KCB", "NCBA"].includes(a.key));
  }, [accounts, active]);

  const monthlyFlow = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      const cur = map.get(key) ?? { in: 0, out: 0 };
      if (t.type === "in") cur.in += t.amount;
      else cur.out += t.amount;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 5)
      .map(([k, v]) => ({
        month: new Date(k + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        net: v.in - v.out,
        in: v.in,
        out: v.out,
      }));
  }, [transactions]);

  const summaryText = useMemo(() => {
    return [
      `FinanceMonitor UG`,
      `Net position: ${fmtUGX(totals.netPosition)}`,
      `Cash total: ${fmtUGX(totals.cashTotal)}`,
      `Debt total: ${fmtUGX(totals.debtTotal)}`,
      `Money in this month: ${fmtUGX(reports.incomeMonth)}`,
      `Money out this month: ${fmtUGX(reports.expenseMonth)}`,
      `Top category this month: ${reports.topCategory}`,
      `Roy phase 2 outstanding: £${totals.royPhase2Outstanding}`,
      `Rates: UGX ${gbpRate.toLocaleString()} / £`,
    ].join("\n");
  }, [totals, reports, gbpRate]);

  const exportReports = async () => {
    await Clipboard.setStringAsync(summaryText);
    if (Platform.OS === "web") {
      window.alert("Report summary copied to clipboard");
      return;
    }
    Share.share({ message: summaryText }).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}> 
      <Header
        title="FinanceMonitor UG"
        subtitle="Track money, debt, SMS and reports"
        rightIcon="settings"
        onPressRight={() => router.push("/settings")}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card elevated borderColor={totals.netPosition < 0 ? c.danger + "55" : c.primary + "55"} style={{ marginBottom: 14, paddingVertical: 22 }}>
          <Text style={[styles.heroLabel, { color: c.textMuted }]}>NET POSITION</Text>
          <Text style={[styles.heroAmt, { color: totals.netPosition < 0 ? c.danger : c.primary }]}>
            {totals.netPosition < 0 ? "−" : ""}{fmtUGX(Math.abs(totals.netPosition))}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}><Feather name="trending-up" size={13} color={c.primary} /><Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Cash</Text><Text style={[styles.heroStatVal, { color: c.text }]}>{fmtCompact(totals.cashTotal)}</Text></View>
            <View style={[styles.heroDivider, { backgroundColor: c.border }]} />
            <View style={styles.heroStat}><Feather name="trending-down" size={13} color={c.danger} /><Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Debt</Text><Text style={[styles.heroStatVal, { color: c.text }]}>{fmtCompact(totals.debtTotal)}</Text></View>
            <View style={[styles.heroDivider, { backgroundColor: c.border }]} />
            <View style={styles.heroStat}><Feather name="clock" size={13} color={c.warn} /><Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Owed</Text><Text style={[styles.heroStatVal, { color: c.text }]}>{fmtCompact(totals.receivableOutstanding)}</Text></View>
          </View>
        </Card>

        <SectionLabel>SWITCH VIEW</SectionLabel>
        <View style={styles.switchRow}>
          {([
            ["all", "All"],
            ["mtn", "MTN"],
            ["airtel", "Airtel"],
            ["bank", "Banks"],
          ] as const).map(([key, label]) => {
            const activeBtn = active === key;
            return (
              <Pressable key={key} onPress={() => setActive(key)} style={[styles.switchBtn, { backgroundColor: activeBtn ? c.primary : c.card, borderColor: activeBtn ? c.primary : c.border }]}>
                <Text style={[styles.switchText, { color: activeBtn ? c.bg : c.textMuted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel>ACCOUNTS</SectionLabel>
        <View style={styles.balanceGrid}>
          {filteredAccounts.map((a) => (
            <Card key={a.key} style={styles.balanceCard} borderColor={c.border}>
              <View style={styles.balanceHeader}><AccountIcon account={a.key} size={28} /><View style={{ flex: 1 }}><Text style={[styles.balanceLabel, { color: c.text }]}>{a.label}</Text><Text style={[styles.balanceNumber, { color: c.textDim }]}>{a.number}</Text></View></View>
              <Text style={[styles.balanceAmt, { color: c.text }]}>{fmtUGX(a.balance)}</Text>
            </Card>
          ))}
        </View>

        <SectionLabel>MONTHLY SNAPSHOT</SectionLabel>
        <Card elevated>
          <View style={styles.reportRow}><Text style={[styles.reportLabel, { color: c.textMuted }]}>This month in</Text><Text style={[styles.reportVal, { color: c.primary }]}>{fmtUGX(reports.incomeMonth)}</Text></View>
          <View style={styles.reportRow}><Text style={[styles.reportLabel, { color: c.textMuted }]}>This month out</Text><Text style={[styles.reportVal, { color: c.danger }]}>{fmtUGX(reports.expenseMonth)}</Text></View>
          <View style={styles.reportRow}><Text style={[styles.reportLabel, { color: c.textMuted }]}>Net this month</Text><Text style={[styles.reportVal, { color: reports.netMonth >= 0 ? c.primary : c.danger }]}>{fmtUGX(reports.netMonth)}</Text></View>
          <View style={[styles.reportRow, { marginTop: 6 }]}><Text style={[styles.reportLabel, { color: c.textMuted }]}>Top category</Text><Badge label={reports.topCategory} color={c.accent} /></View>
        </Card>

        <SectionLabel>REPORTS & BACKUP</SectionLabel>
        <Card>
          <Text style={[styles.summaryBody, { color: c.textMuted }]}>
            The app tracks balances, SMS-imported transactions, debts, receivables, Roy payments, and monthly reports. Your data persists locally in this device using AsyncStorage.
          </Text>
          <View style={styles.exportRow}>
            <Pressable onPress={exportReports} style={({ pressed }) => [styles.exportBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Feather name="share-2" size={14} color={c.bg} />
              <Text style={[styles.exportText, { color: c.bg }]}>Copy report</Text>
            </Pressable>
            <Pressable onPress={() => resetToSeed()} style={({ pressed }) => [styles.exportBtn, { backgroundColor: c.cardElevated, borderColor: c.border, borderWidth: 1, opacity: pressed ? 0.7 : 1 }]}>
              <Feather name="rotate-ccw" size={14} color={c.textMuted} />
              <Text style={[styles.exportText, { color: c.textMuted }]}>Reset demo</Text>
            </Pressable>
          </View>
        </Card>

        <SectionLabel>WHAT IT CAN DO</SectionLabel>
        <Card>
          {[
            "Read MTN MoMo, Airtel Money, and bank SMS messages",
            "Auto-extract amount, account, fee, balance, counterparty and reference",
            "Track cash, debt, receivables, and Roy's UK payments",
            "Generate monthly finance reports and summaries",
            "Store data locally on your phone for offline use",
            "Export/share reports for backup or GitHub syncing later",
          ].map((item) => (
            <View key={item} style={styles.featureRow}><Feather name="check" size={13} color={c.primary} /><Text style={[styles.featureText, { color: c.text }]}>{item}</Text></View>
          ))}
        </Card>

        <SectionLabel>BANKS & CASHFLOW</SectionLabel>
        {monthlyFlow.map((m) => (
          <Card key={m.month} style={{ marginBottom: 8 }}>
            <View style={styles.flowRow}><View><Text style={[styles.flowMonth, { color: c.text }]}>{m.month}</Text><Text style={[styles.flowMeta, { color: c.textMuted }]}>In {fmtCompact(m.in)} · Out {fmtCompact(m.out)}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={[styles.flowNet, { color: m.net >= 0 ? c.primary : c.danger }]}>{m.net >= 0 ? "+" : "−"}{fmtUGX(Math.abs(m.net))}</Text><Badge label={m.net >= 0 ? "POSITIVE" : "NEGATIVE"} color={m.net >= 0 ? c.primary : c.danger} /></View></View>
          </Card>
        ))}

        <SectionLabel>OWED TO YOU</SectionLabel>
        {receivables.map((r) => {
          const remaining = Math.max(0, r.total - r.paid);
          const progress = pct(r.paid, r.total);
          return (
            <Card key={r.id} style={{ marginBottom: 8 }}>
              <View style={styles.flowRow}><Text style={[styles.flowMonth, { color: c.text }]}>{r.name}</Text><Text style={[styles.flowNet, { color: c.primary }]}>{fmtUGX(remaining)}</Text></View>
              {r.notes ? <Text style={[styles.flowMeta, { color: c.textMuted, marginBottom: 8 }]}>{r.notes}</Text> : null}
              <ProgressBar value={progress} color={c.primary} />
            </Card>
          );
        })}

        <SectionLabel>ACTIVE DEBT</SectionLabel>
        <Card>
          {loans.map((l, i) => {
            const remaining = Math.max(0, l.total - l.paid);
            const progress = pct(l.paid, l.total);
            const tone = l.color === "danger" ? c.danger : l.color === "warn" ? c.warn : l.color === "primary" ? c.primary : c.textMuted;
            return (
              <View key={l.id} style={[styles.loanItem, i < loans.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                <View style={styles.flowRow}><Text style={[styles.flowMonth, { color: c.text }]}>{l.name}</Text><Text style={[styles.flowNet, { color: tone }]}>{fmtUGX(remaining)}</Text></View>
                <ProgressBar value={progress} color={tone} />
              </View>
            );
          })}
        </Card>

        <SectionLabel>ROY (UK) STATUS</SectionLabel>
        <Card borderColor={c.accent + "44"}>
          <View style={styles.flowRow}><Text style={[styles.flowMonth, { color: c.text }]}>Phase 2 outstanding</Text><Text style={[styles.flowNet, { color: c.warn }]}>£{totals.royPhase2Outstanding}</Text></View>
          <Text style={[styles.flowMeta, { color: c.textMuted }]}>~{fmtUGX((totals.royPhase1Outstanding + totals.royPhase2Outstanding) * gbpRate)}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroLabel: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.6, marginBottom: 6 },
  heroAmt: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: 0.5, marginBottom: 14 },
  heroRow: { flexDirection: "row", alignItems: "stretch" },
  heroStat: { flex: 1, alignItems: "flex-start", gap: 4 },
  heroDivider: { width: 1, marginHorizontal: 12 },
  heroStatLabel: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
  heroStatVal: { fontFamily: "Inter_700Bold", fontSize: 14 },
  switchRow: { flexDirection: "row", gap: 8 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  switchText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  balanceGrid: { gap: 10 },
  balanceCard: { padding: 14 },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  balanceLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  balanceNumber: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
  balanceAmt: { fontFamily: "Inter_700Bold", fontSize: 18 },
  reportRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  reportLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  reportVal: { fontFamily: "Inter_700Bold", fontSize: 14 },
  summaryBody: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 12 },
  exportRow: { flexDirection: "row", gap: 10 },
  exportBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  exportText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  featureRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingVertical: 6 },
  featureText: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, flex: 1 },
  flowRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flowMonth: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  flowMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  flowNet: { fontFamily: "Inter_700Bold", fontSize: 14 },
  loanItem: { paddingVertical: 10, gap: 6 },
});
