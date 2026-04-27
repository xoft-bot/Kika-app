import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { TransactionRow } from "@/components/TransactionRow";
import { Header } from "@/components/ui/Header";
import { useFinance } from "@/context/FinanceContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "in", label: "In" },
  { key: "out", label: "Out" },
] as const;

export default function TransactionsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, addTransaction, deleteTransaction } = useFinance();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return (
        t.source.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, filter]);

  const handleDelete = (id: string, source: string) => {
    Alert.alert("Delete transaction?", `Remove "${source}"? This will also adjust your balance.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          }
          deleteTransaction(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Header title="Transactions" subtitle={`${transactions.length} total`} />

      <View style={styles.controls}>
        <View style={[styles.searchWrap, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search source, category, account..."
            placeholderTextColor={c.textDim}
            style={[styles.searchInput, { color: c.text }]}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Feather name="x-circle" size={16} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? c.bg : c.textMuted },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={c.textDim} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No transactions</Text>
            <Text style={[styles.emptyBody, { color: c.textMuted }]}>
              Tap + to add one, or paste an SMS in the Scanner tab.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            txn={item}
            onPress={() => handleDelete(item.id, item.source)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          setSheetOpen(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: c.primary,
            bottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="plus" size={26} color={c.bg} />
      </Pressable>

      <AddTransactionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={(t) => addTransaction(t)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    paddingBottom: 4,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  filterText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginTop: 8,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
