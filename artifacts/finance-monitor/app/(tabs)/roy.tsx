import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";
import { fmtDateLong, fmtUGX, pct } from "@/lib/format";
import { ROY_PHASE1_AGREED, ROY_PHASE2_AGREED } from "@/lib/seedData";

export default function RoyScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { royPayments, totals, gbpRate } = useFinance();

  const sortedPayments = useMemo(
    () =>
      [...royPayments].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [royPayments],
  );

  const lastPayment = sortedPayments[0];
  const daysSinceLast = lastPayment
    ? Math.floor((Date.now() - new Date(lastPayment.date).getTime()) / 86_400_000)
    : null;

  const phase2OutUgx = totals.royPhase2Outstanding * gbpRate;
  const phase2OutFavour = Math.max(0, ROY_PHASE2_AGREED - 100 * 10.5 - totals.royPhase2Paid);
  const phase2OutFavourUgx = phase2OutFavour * gbpRate;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Header title="Roy Mbahira" subtitle="UK · Diploma Phase 2" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <Card borderColor={c.accent + "55"}>
          <View style={styles.idHead}>
            <View style={[styles.flag, { backgroundColor: c.accent + "22", borderColor: c.accent + "55" }]}>
              <Text style={[styles.flagText, { color: c.accent }]}>UK</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]}>Roy Mbahira</Text>
              <Text style={[styles.metaRow, { color: c.textMuted }]}>
                Reg HABC4271333 · Tutor Robyn Jennings
              </Text>
              <Text style={[styles.metaRow, { color: c.textDim }]}>
                Level 3 Diploma — Residential Childcare (England)
              </Text>
            </View>
          </View>
          {lastPayment ? (
            <View style={[styles.lastPay, { borderTopColor: c.border }]}>
              <Feather
                name={daysSinceLast && daysSinceLast > 21 ? "alert-circle" : "check-circle"}
                size={14}
                color={daysSinceLast && daysSinceLast > 21 ? c.warn : c.primary}
              />
              <Text style={[styles.lastPayText, { color: c.textMuted }]}>
                Last payment {fmtDateLong(lastPayment.date)} ·{" "}
                <Text style={{ color: daysSinceLast && daysSinceLast > 21 ? c.warn : c.text }}>
                  {daysSinceLast} days ago
                </Text>
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Phase 1 */}
        <SectionLabel right={<Badge label="CLEARED" color={c.primary} />}>
          PHASE 1 · £{ROY_PHASE1_AGREED} AGREED
        </SectionLabel>
        <Card borderColor={c.primary + "55"}>
          <View style={styles.bigRow}>
            <Text style={[styles.bigLabel, { color: c.textMuted }]}>Total Received</Text>
            <Text style={[styles.bigVal, { color: c.primary }]}>£{totals.royPhase1Paid}</Text>
          </View>
          <Text style={[styles.smallNote, { color: c.textDim }]}>
            ~{fmtUGX(totals.royPhase1Paid * gbpRate)} · Fully cleared
          </Text>
          <View style={{ marginTop: 10 }}>
            <ProgressBar value={100} color={c.primary} />
          </View>
        </Card>

        {/* Phase 2 */}
        <SectionLabel>PHASE 2 · £{ROY_PHASE2_AGREED} AGREED</SectionLabel>
        <Card>
          <View style={styles.bigRow}>
            <Text style={[styles.bigLabel, { color: c.textMuted }]}>Total Paid</Text>
            <Text style={[styles.bigVal, { color: c.text }]}>£{totals.royPhase2Paid}</Text>
          </View>
          <View style={styles.bigRow}>
            <Text style={[styles.bigLabel, { color: c.textMuted }]}>Outstanding (£120/unit)</Text>
            <Text style={[styles.bigVal, { color: c.danger }]}>
              £{totals.royPhase2Outstanding}
            </Text>
          </View>
          <Text style={[styles.smallNote, { color: c.textDim }]}>
            ~{fmtUGX(phase2OutUgx)} at agreed rate
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.bigRow}>
            <Text style={[styles.bigLabel, { color: c.textMuted }]}>Outstanding (£100/unit)</Text>
            <Text style={[styles.bigVal, { color: c.warn }]}>£{phase2OutFavour}</Text>
          </View>
          <Text style={[styles.smallNote, { color: c.textDim }]}>
            ~{fmtUGX(phase2OutFavourUgx)} at favour rate
          </Text>
          <View style={{ marginTop: 14 }}>
            <ProgressBar value={pct(totals.royPhase2Paid, ROY_PHASE2_AGREED)} color={c.accent} />
            <Text style={[styles.progText, { color: c.textDim }]}>
              {pct(totals.royPhase2Paid, ROY_PHASE2_AGREED)}% complete
            </Text>
          </View>
        </Card>

        {/* Payment Log */}
        <SectionLabel>PAYMENT LOG</SectionLabel>
        {sortedPayments.map((p) => (
          <Card key={p.id} style={{ marginBottom: 8 }}>
            <View style={styles.payRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payDate, { color: c.text }]}>
                  {fmtDateLong(p.date)}
                </Text>
                <View style={styles.payMetaRow}>
                  <Badge
                    label={`PHASE ${p.phase}`}
                    color={p.phase === 1 ? c.primary : c.accent}
                  />
                  {p.note ? (
                    <Text style={[styles.payNote, { color: c.textMuted }]}>{p.note}</Text>
                  ) : null}
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.payGbp, { color: c.primary }]}>£{p.gbp}</Text>
                <Text style={[styles.payUgx, { color: c.textDim }]}>{fmtUGX(p.ugx)}</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Talking Points */}
        <SectionLabel>VISIT TALKING POINTS</SectionLabel>
        <Card borderColor={c.warn + "44"}>
          {[
            `Last payment was ${daysSinceLast ?? "?"} days ago`,
            `Phase 2 agreed at £${ROY_PHASE2_AGREED} (£120/unit × 10.5 units)`,
            `You have received £${totals.royPhase2Paid} so far`,
            `Balance due: £${totals.royPhase2Outstanding} agreed OR £${phase2OutFavour} favour`,
            "Pegasus Technologies sends payments on MTN MoMo",
            `Exchange rate ~UGX ${gbpRate.toLocaleString()}/£`,
          ].map((p, i) => (
            <View key={i} style={styles.tpRow}>
              <View style={[styles.tpDot, { backgroundColor: c.warn }]} />
              <Text style={[styles.tpText, { color: c.text }]}>{p}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  idHead: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  flag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  flagText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  metaRow: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  lastPay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  lastPayText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  bigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  bigLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  bigVal: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  smallNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  progText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 6,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  payMetaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  payNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  payGbp: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  payUgx: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  tpRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  tpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  tpText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
