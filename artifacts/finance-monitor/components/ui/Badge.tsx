import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  label: string;
  color: string;
  bgColor?: string;
}

export function Badge({ label, color, bgColor }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor ?? color + "26",
          borderColor: color + "55",
        },
      ]}
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
