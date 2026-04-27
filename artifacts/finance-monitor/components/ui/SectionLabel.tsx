import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SectionLabelProps {
  children: string;
  style?: ViewStyle;
  right?: React.ReactNode;
}

export function SectionLabel({ children, style, right }: SectionLabelProps) {
  const c = useColors();
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.label, { color: c.textMuted }]}>{children}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
  },
});
