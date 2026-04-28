import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useSmsAutoImportContext } from "@/context/SmsAutoImportContext";
import { useColors } from "@/hooks/useColors";
import { fmtUGX } from "@/lib/format";

interface Props {
  showRecent?: boolean;
  showHistoryScan?: boolean;
}

const SCAN_OPTIONS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export function SmsAutoImportCard({
  showRecent = true,
  showHistoryScan = true,
}: Props) {
  const c = useColors();
  const {
    supported,
    settings,
    permission,
    lastImports,
    scanning,
    lastScan,
    historyScanSupported,
    setEnabled,
    scanHistory,
  } = useSmsAutoImportContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const onToggle = async (next: boolean) => {
    const ok = await setEnabled(next);
    if (next && !ok) {
      if (permission === "blocked") {
        Alert.alert(
          "Permission blocked",
          "You previously denied SMS access. Open the system settings for Kika and grant the SMS permission.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open settings",
              onPress: () => Linking.openSettings().catch(() => {}),
            },
          ],
        );
      } else if (permission !== "granted") {
        Alert.alert(
          "Permission needed",
          "Auto-import needs the SMS permission to listen for incoming messages.",
        );
      }
    }
  };

  const runScan = async (days: number) => {
    setPickerOpen(false);
    if (!historyScanSupported) {
      Alert.alert(
        "Not available",
        "Inbox scan needs the Android build of Kika. It does not work in Expo Go.",
      );
      return;
    }
    const result = await scanHistory(days);
    if (!result) {
      Alert.alert(
        "Permission needed",
        "Allow SMS access first to scan your inbox.",
      );
      return;
    }
    Alert.alert(
      "Inbox scan complete",
      `Read ${result.total} messages.\n` +
        `Imported: ${result.imported}\n` +
        `Already in Kika: ${result.duplicates}\n` +
        `Couldn't parse: ${result.lowConfidence}`,
    );
  };

  const isOn =
    settings.enabled && permission === "granted" && supported;
  const statusLabel = !supported
    ? "iOS / web · not supported"
    : permission === "blocked"
      ? "Blocked in system settings"
      : permission === "denied"
        ? "Permission needed"
        : isOn
          ? "Listening for new SMS"
          : "Off";
  const statusColor = !supported
    ? c.textDim
    : isOn
      ? c.primary
      : permission === "blocked"
        ? c.danger
        : c.warn;

  return (
    <Card borderColor={isOn ? c.primary + "55" : undefined} elevated>
      <View style={styles.headRow}>
        <View style={styles.headLeft}>
          <Feather name="radio" size={18} color={isOn ? c.primary : c.textMuted} />
          <Text style={[styles.title, { color: c.text }]}>Auto-import SMS</Text>
        </View>
        <Badge label={Platform.OS === "android" ? "ANDROID" : "ANDROID ONLY"} color={c.warn} />
      </View>

      <Text style={[styles.body, { color: c.textMuted }]}>
        When on, every incoming MTN, Airtel and bank SMS that arrives while Kika
        is open is parsed and added automatically. Nothing leaves your phone.
      </Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel}
        </Text>
        <View style={{ flex: 1 }} />
        <Switch
          value={isOn}
          onValueChange={onToggle}
          disabled={!supported}
          trackColor={{ false: c.border, true: c.primarySoft }}
          thumbColor={isOn ? c.primary : c.textMuted}
        />
      </View>

      {showHistoryScan && supported ? (
        <View style={[styles.scanWrap, { borderTopColor: c.border }]}>
          <View style={styles.scanRow}>
            <Feather name="clock" size={14} color={c.textMuted} />
            <Text style={[styles.scanLabel, { color: c.textMuted }]}>
              Backfill from inbox
            </Text>
            <View style={{ flex: 1 }} />
            {scanning ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <Pressable
                onPress={() => setPickerOpen((v) => !v)}
                style={({ pressed }) => [
                  styles.scanBtn,
                  {
                    backgroundColor: c.cardElevated,
                    borderColor: c.border,
                    borderRadius: c.radius,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name={pickerOpen ? "chevron-up" : "download"}
                  size={13}
                  color={c.text}
                />
                <Text style={[styles.scanBtnText, { color: c.text }]}>
                  Scan inbox
                </Text>
              </Pressable>
            )}
          </View>
          {pickerOpen ? (
            <View style={styles.optionRow}>
              {SCAN_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.days}
                  onPress={() => runScan(opt.days)}
                  style={({ pressed }) => [
                    styles.optionPill,
                    {
                      backgroundColor: c.primarySoft,
                      borderRadius: c.radius,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.optionPillText, { color: c.primary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {lastScan && !scanning ? (
            <Text style={[styles.scanResult, { color: c.textDim }]}>
              Last scan: read {lastScan.total} · imported {lastScan.imported} · skipped{" "}
              {lastScan.duplicates + lastScan.lowConfidence}
            </Text>
          ) : null}
        </View>
      ) : null}

      {showRecent && lastImports.length > 0 ? (
        <View style={[styles.recentWrap, { borderTopColor: c.border }]}>
          <Text style={[styles.recentLabel, { color: c.textDim }]}>
            RECENT
          </Text>
          {lastImports.slice(0, 4).map((a, i) => {
            const okay = a.imported;
            return (
              <View key={i} style={styles.recentRow}>
                <Feather
                  name={okay ? "check-circle" : "alert-circle"}
                  size={14}
                  color={okay ? c.primary : c.warn}
                />
                <Text
                  style={[styles.recentText, { color: c.text }]}
                  numberOfLines={1}
                >
                  {okay
                    ? `${a.parsed.party || a.parsed.account} · ${fmtUGX(a.parsed.amount)}`
                    : `Skipped: ${a.reason === "low_confidence" ? "couldn't parse cleanly" : "duplicate"}`}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  recentWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  recentLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  scanWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  scanBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  scanResult: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    fontStyle: "italic",
  },
});
