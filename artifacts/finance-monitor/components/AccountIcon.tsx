import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { AccountKey } from "@/lib/types";

const ACCOUNT_META: Record<AccountKey, { icon: keyof typeof Feather.glyphMap | "_mtn" | "_airtel"; color: string }> = {
  MTN: { icon: "_mtn", color: "#FFCC00" },
  Airtel: { icon: "_airtel", color: "#E4003A" },
  Stanbic: { icon: "credit-card", color: "#3B82F6" },
  DFCU: { icon: "credit-card", color: "#10B981" },
  Pearl: { icon: "credit-card", color: "#A78BFA" },
  KCB: { icon: "credit-card", color: "#22C55E" },
  NCBA: { icon: "credit-card", color: "#F97316" },
  Other: { icon: "more-horizontal", color: "#94A3B8" },
};

interface AccountIconProps {
  account: AccountKey;
  size?: number;
}

export function AccountIcon({ account, size = 32 }: AccountIconProps) {
  const c = useColors();
  const meta = ACCOUNT_META[account];

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.color + "22",
          borderColor: meta.color + "55",
        },
      ]}
    >
      {meta.icon === "_mtn" || meta.icon === "_airtel" ? (
        <MaterialCommunityIcons
          name="cellphone-wireless"
          size={size * 0.55}
          color={meta.color}
        />
      ) : (
        <Feather name={meta.icon} size={size * 0.5} color={meta.color} />
      )}
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
