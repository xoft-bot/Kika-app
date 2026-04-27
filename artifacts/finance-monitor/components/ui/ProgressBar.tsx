import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color, height = 6 }: ProgressBarProps) {
  const c = useColors();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.bg, { height, backgroundColor: c.border, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color ?? c.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
