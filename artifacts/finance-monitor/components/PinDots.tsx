import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface PinDotsProps {
  length: number;
  filled: number;
  error?: boolean;
}

export function PinDots({ length, filled, error }: PinDotsProps) {
  const c = useColors();
  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: error
                  ? c.danger
                  : isFilled
                    ? c.primary
                    : "transparent",
                borderColor: error
                  ? c.danger
                  : isFilled
                    ? c.primary
                    : c.borderStrong,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
