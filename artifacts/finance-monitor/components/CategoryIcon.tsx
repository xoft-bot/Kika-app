import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import type { Category } from "@/lib/types";

const CATEGORY_META: Record<
  Category,
  { lib: "feather" | "mci"; name: string; color: string }
> = {
  Salary:        { lib: "feather", name: "briefcase",      color: "#10B981" },
  Service:       { lib: "feather", name: "tool",           color: "#06B6D4" },
  Gift:          { lib: "feather", name: "gift",           color: "#A78BFA" },
  "Loan Received":{ lib: "feather", name: "download",      color: "#F59E0B" },
  "Loan Repayment":{ lib: "mci",    name: "bank-transfer-out", color: "#EF4444" },
  Personal:      { lib: "feather", name: "heart",          color: "#EC4899" },
  Household:     { lib: "feather", name: "home",           color: "#06B6D4" },
  Transport:     { lib: "feather", name: "navigation",     color: "#8B5CF6" },
  Food:          { lib: "mci",     name: "food",           color: "#F97316" },
  Entertainment: { lib: "feather", name: "music",          color: "#EC4899" },
  "Data/Airtime":{ lib: "feather", name: "wifi",           color: "#818CF8" },
  Utilities:     { lib: "feather", name: "zap",            color: "#3B82F6" },
  "School Fees": { lib: "feather", name: "book-open",      color: "#14B8A6" },
  Investment:    { lib: "feather", name: "trending-up",    color: "#7C3AED" },
  Savings:       { lib: "feather", name: "shield",         color: "#10B981" },
  Transfer:      { lib: "feather", name: "repeat",         color: "#94A3B8" },
  Withdrawal:    { lib: "feather", name: "arrow-down-circle", color: "#6B7280" },
  Fee:           { lib: "feather", name: "percent",        color: "#9CA3AF" },
  Other:         { lib: "feather", name: "more-horizontal",color: "#64748B" },
};

interface CategoryIconProps {
  category: Category;
  size?: number;
}

export function CategoryIcon({ category, size = 36 }: CategoryIconProps) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.Other;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.color + "1F",
          borderColor: meta.color + "44",
        },
      ]}
    >
      {meta.lib === "feather" ? (
        <Feather name={meta.name as keyof typeof Feather.glyphMap} size={size * 0.45} color={meta.color} />
      ) : (
        <MaterialCommunityIcons
          name={meta.name as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size * 0.55}
          color={meta.color}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
