import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "@/components/CategoryIcon";
import { useColors } from "@/hooks/useColors";
import { fmtDateShort, fmtUGX } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface TransactionRowProps {
  txn: Transaction;
  onPress?: () => void;
}

export function TransactionRow({ txn, onPress }: TransactionRowProps) {
  const c = useColors();
  const isIn = txn.type === "in";
  const amountColor = isIn ? c.primary : c.danger;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderRadius: c.radius,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <CategoryIcon category={txn.category} size={40} />
      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {txn.source}
          </Text>
          {txn.autoImported ? (
            <Feather name="zap" size={11} color={c.accent} style={{ marginLeft: 4 }} />
          ) : null}
        </View>
        <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
          {fmtDateShort(txn.date)} · {txn.account} · {txn.category}
        </Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isIn ? "+" : "−"}
          {fmtUGX(txn.amount)}
        </Text>
        {txn.balance ? (
          <Text style={[styles.balance, { color: c.textDim }]}>
            bal {fmtUGX(txn.balance)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flexShrink: 1,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: "flex-end",
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  balance: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 2,
  },
});
