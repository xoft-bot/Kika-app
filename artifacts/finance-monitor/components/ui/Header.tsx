import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onPressRight?: () => void;
}

export function Header({ title, subtitle, rightIcon, onPressRight }: HeaderProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad + 8,
          backgroundColor: c.bg,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.primary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
        {rightIcon ? (
          <Pressable
            onPress={onPressRight}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: c.cardElevated,
                borderColor: c.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name={rightIcon} size={18} color={c.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
