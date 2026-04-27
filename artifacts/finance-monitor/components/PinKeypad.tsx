import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onBiometric?: () => void;
  biometricLabel?: string;
}

const KEYS: (string | "back" | "bio" | "")[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["bio", "0", "back"],
];

export function PinKeypad({
  onDigit,
  onBackspace,
  onBiometric,
  biometricLabel,
}: PinKeypadProps) {
  const c = useColors();

  const handlePress = (key: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (key === "back") onBackspace();
    else if (key === "bio") onBiometric?.();
    else if (key) onDigit(key);
  };

  return (
    <View style={styles.pad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => {
            const isAction = key === "back" || key === "bio";
            const isEmpty = key === "" || (key === "bio" && !onBiometric);
            return (
              <Pressable
                key={`${ri}-${ki}`}
                disabled={isEmpty}
                onPress={() => handlePress(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: isEmpty
                      ? "transparent"
                      : isAction
                        ? "transparent"
                        : pressed
                          ? c.cardElevated
                          : c.card,
                    borderColor: isEmpty || isAction ? "transparent" : c.border,
                  },
                ]}
              >
                {key === "back" ? (
                  <Feather name="delete" size={26} color={c.textMuted} />
                ) : key === "bio" ? (
                  onBiometric ? (
                    <Feather
                      name={
                        biometricLabel?.toLowerCase().includes("face")
                          ? "smile"
                          : "unlock"
                      }
                      size={26}
                      color={c.primary}
                    />
                  ) : null
                ) : (
                  <Text style={[styles.keyText, { color: c.text }]}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    gap: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  key: {
    flex: 1,
    aspectRatio: 1.3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
  },
  keyText: {
    fontSize: 28,
    fontFamily: "Inter_500Medium",
  },
});
