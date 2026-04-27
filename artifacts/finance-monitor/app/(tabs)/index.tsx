import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
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
  const { accounts, totals, loans, receivables, transactions, royPayments, gbpRate } =
    useFinance();

  const monthlyFlow = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    for (const t of transactions) {
      const key = t.date.slice(0, 7); // YYYY-MM
      const cur = map.get(key) ?? { in: 0, out: 0 };
      if (t.type === "in") cur.in += t.amount;
      else cur.out += t.amount;
      map.set(key, cur);
    }
    const out = Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 5)
      .map(([k, v]) => ({
        month: new Date(k + "-01").toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        net: v.in - v.out,
        in: v.in,
        out: v.out,
      }));
    return out;
  }, [transactions]);

  const recentRoy = royPayments[royPayments.length - 1];
  const royOutstandingUgx =
    (totals.royPhase1Outstanding + totals.royPhase2Outstanding) * gbpRate;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Header
        title="FinanceMonitor UG"
        subtitle={`Updated ${fmtDateLong(new Date().toISOString())}`}
        rightIcon="bell"
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
        {/* Net Position Hero */}
        <Card
          elevated
          borderColor={totals.netPosition < 0 ? c.danger + "55" : c.primary + "55"}
          style={{ marginBottom: 14, paddingVertical: 22 }}
        >
          <Text style={[styles.heroLabel, { color: c.textMuted }]}>NET POSITION</Text>
          <Text
            style={[
              styles.heroAmt,
              { color: totals.netPosition < 0 ? c.danger : c.primary },
            ]}
          >
            {totals.netPosition < 0 ? "−" : ""}
            {fmtUGX(Math.abs(totals.netPosition))}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Feather name="trending-up" size={13} color={c.primary} />
              <Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Cash</Text>
              <Text style={[styles.heroStatVal, { color: c.text }]}>
                {fmtCompact(totals.cashTotal)}
              </Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: c.border }]} />
            <View style={styles.heroStat}>
              <Feather name="trending-down" size={13} color={c.danger} />
              <Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Debt</Text>
              <Text style={[styles.heroStatVal, { color: c.text }]}>
                {fmtCompact(totals.debtTotal)}
              </Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: c.border }]} />
            <View style={styles.heroStat}>
              <Feather name="clock" size={13} color={c.warn} />
              <Text style={[styles.heroStatLabel, { color: c.textMuted }]}>Owed</Text>
              <Text style={[styles.heroStatVal, { color: c.text }]}>
                {fmtCompact(totals.receivableOutstanding)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Balances */}
        <SectionLabel>BALANCES</SectionLabel>
        <View style={styles.balanceGrid}>
          {accounts.map((a) => (
            <Card key={a.key} style={[styles.balanceCard]} borderColor={c.border}>
              <View style={styles.balanceHeader}>
                <AccountIcon account={a.key} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.balanceLabel, { color: c.text }]}>{a.label}</Text>
                  {a.number ? (
                    <Text style={[styles.balanceNumber, { color: c.textDim }]}>
                      {a.number}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.balanceAmt, { color: c.text }]}>{fmtUGX(a.balance)}</Text>
            </Card>
          ))}
        </View>

        {/* Monthly Flow */}
        <SectionLabel>MONTHLY FLOW</SectionLabel>
        {monthlyFlow.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              No activity yet. Add or import a transaction to see your flow.
            </Text>
          </Card>
        ) : (
          monthlyFlow.map((m) => {
            const positive = m.net >= 0;
            return (
              <Card key={m.month} style={{ marginBottom: 8 }}>
                <View style={styles.flowRow}>
                  <View>
                    <Text style={[styles.flowMonth, { color: c.text }]}>{m.month}</Text>
                    <Text style={[styles.flowMeta, { color: c.textMuted }]}>
                      In {fmtCompact(m.in)} · Out {fmtCompact(m.out)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.flowNet,
                        { color: positive ? c.primary : c.danger },
                      ]}
                    >
                      {positive ? "+" : "−"}
                      {fmtUGX(Math.abs(m.net))}
                    </Text>
                    <Badge
                      label={positive ? "POSITIVE" : "NEGATIVE"}
                      color={positive ? c.primary : c.danger}
                    />
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* Receivables */}
        <SectionLabel>OWED TO YOU</SectionLabel>
        {receivables.map((r) => {
          const remaining = Math.max(0, r.total - r.paid);
          const progress = pct(r.paid, r.total);
          return (
            <Card key={r.id} style={{ marginBottom: 8 }}>
              <View style={styles.flowRow}>
                <Text style={[styles.flowMonth, { color: c.text }]}>{r.name}</Text>
                <Text style={[styles.flowNet, { color: c.primary }]}>
                  {fmtUGX(remaining)}
                </Text>
              </View>
              {r.notes ? (
                <Text style={[styles.flowMeta, { color: c.textMuted, marginBottom: 8 }]}>
                  {r.notes}
                </Text>
              ) : null}
              <ProgressBar value={progress} color={c.primary} />
              <Text style={[styles.flowMeta, { color: c.textDim, marginTop: 6 }]}>
                {progress}% received · {fmtUGX(r.paid)} of {fmtUGX(r.total)}
              </Text>
            </Card>
          );
        })}

        {/* Loans Summary */}
        <SectionLabel>ACTIVE DEBT</SectionLabel>
        <Card>
          {loans.map((l, i) => {
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
              <View
                key={l.id}
                style={[
                  styles.loanItem,
                  i < loans.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  },
                ]}
              >
                <View style={styles.flowRow}>
                  <Text style={[styles.flowMonth, { color: c.text }]}>{l.name}</Text>
                  <Text style={[styles.flowNet, { color: tone }]}>{fmtUGX(remaining)}</Text>
                </View>
                <View style={[styles.flowRow, { marginBottom: 6 }]}>
                  <Text style={[styles.flowMeta, { color: c.textMuted }]}>{l.note}</Text>
                  <Text style={[styles.flowMeta, { color: c.textDim }]}>{progress}%</Text>
                </View>
                <ProgressBar value={progress} color={tone} />
              </View>
            );
          })}
        </Card>

        {/* Roy Quick Status */}
        <SectionLabel>ROY (UK) STATUS</SectionLabel>
        <Card borderColor={c.accent + "44"}>
          <View style={styles.flowRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.flowMonth, { color: c.text }]}>
                Phase 2 Outstanding
              </Text>
              <Text style={[styles.flowMeta, { color: c.textMuted }]}>
                Last payment{" "}
                {recentRoy ? fmtDateLong(recentRoy.date) : "—"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.flowNet, { color: c.warn }]}>
                £{totals.royPhase2Outstanding}
              </Text>
              <Text style={[styles.flowMeta, { color: c.textDim }]}>
                ~{fmtUGX(royOutstandingUgx)}
              </Text>
            </View>
          </View>
        </Card>

        <Pressable
          style={({ pressed }) => [
            styles.tipCard,
            {
              borderColor: c.border,
              backgroundColor: c.card,
              borderRadius: c.radius,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="zap" size={18} color={c.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: c.text }]}>SMS Auto-Import</Text>
            <Text style={[styles.tipBody, { color: c.textMuted }]}>
              Tap the Scanner tab to paste any bank or mobile money SMS. Detected
              transactions update your balances instantly.
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  heroAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroStat: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  heroDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  heroStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  heroStatVal: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 10,
  },
  balanceCard: {
    flex: 1,
    padding: 14,
    marginBottom: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  balanceLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  balanceNumber: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 2,
  },
  balanceAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  flowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flowMonth: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  flowMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  flowNet: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  loanItem: {
    paddingVertical: 10,
    gap: 6,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  tipCard: {
    marginTop: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  tipTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  tipBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
