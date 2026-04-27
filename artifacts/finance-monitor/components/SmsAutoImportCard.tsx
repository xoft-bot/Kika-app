import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
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
}

export function SmsAutoImportCard({ showRecent = true }: Props) {
  const c = useColors();
  const {
    supported,
    settings,
    permission,
    lastImports,
    setEnabled,
  } = useSmsAutoImportContext();

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
});
