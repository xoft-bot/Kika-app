import React, { type ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderColor?: string;
  elevated?: boolean;
}

export function Card({ children, style, borderColor, elevated }: CardProps) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? c.cardElevated : c.card,
          borderColor: borderColor ?? c.border,
          borderRadius: c.radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
});
