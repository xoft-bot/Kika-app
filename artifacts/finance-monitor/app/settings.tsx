import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PinDots } from "@/components/PinDots";
import { PinKeypad } from "@/components/PinKeypad";
import { SmsAutoImportCard } from "@/components/SmsAutoImportCard";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const PIN_LENGTH = 4;
type Stage = "menu" | "current" | "new" | "confirm";

export default function SettingsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const {
    biometric,
    biometricEnabled,
    setBiometricEnabled,
    changePin,
    lock,
  } = useAuth();

  const [stage, setStage] = useState<Stage>("menu");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bannerOk, setBannerOk] = useState<string | null>(null);

  const value =
    stage === "current" ? currentPin : stage === "new" ? newPin : confirmPin;

  const onDigit = (d: string) => {
    setError(null);
    if (value.length >= PIN_LENGTH) return;
    const next = value + d;
    if (stage === "current") setCurrentPin(next);
    else if (stage === "new") setNewPin(next);
    else if (stage === "confirm") setConfirmPin(next);
  };

  const onBackspace = () => {
    setError(null);
    if (stage === "current") setCurrentPin(currentPin.slice(0, -1));
    else if (stage === "new") setNewPin(newPin.slice(0, -1));
    else if (stage === "confirm") setConfirmPin(confirmPin.slice(0, -1));
  };

  useEffect(() => {
    if (stage === "current" && currentPin.length === PIN_LENGTH) {
      setTimeout(() => setStage("new"), 120);
    }
  }, [currentPin, stage]);

  useEffect(() => {
    if (stage === "new" && newPin.length === PIN_LENGTH) {
      setTimeout(() => setStage("confirm"), 120);
    }
  }, [newPin, stage]);

  useEffect(() => {
    if (stage !== "confirm" || confirmPin.length !== PIN_LENGTH) return;
    if (confirmPin !== newPin) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      setError("PINs don't match. Try again.");
      setTimeout(() => {
        setNewPin("");
        setConfirmPin("");
        setStage("new");
        setError(null);
      }, 900);
      return;
    }
    (async () => {
      setBusy(true);
      const ok = await changePin(currentPin, newPin);
      setBusy(false);
      if (!ok) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        ).catch(() => {});
        setError("Current PIN was wrong. Start over.");
        setTimeout(() => {
          setCurrentPin("");
          setNewPin("");
          setConfirmPin("");
          setStage("current");
          setError(null);
        }, 1100);
        return;
      }
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setStage("menu");
      setBannerOk("PIN updated");
      setTimeout(() => setBannerOk(null), 2200);
    })();
  }, [confirmPin, newPin, currentPin, stage, changePin]);

  const onToggleBio = async (next: boolean) => {
    if (next && (!biometric.available || !biometric.enrolled)) {
      Alert.alert(
        biometric.available ? "No biometrics enrolled" : "Not supported",
        biometric.available
          ? "Enroll a fingerprint or face in your device settings first."
          : "This device does not support biometric unlock.",
      );
      return;
    }
    await setBiometricEnabled(next);
    Haptics.selectionAsync().catch(() => {});
  };

  const onLockNow = () => {
    lock();
    if (router.canGoBack()) router.back();
  };

  const onCancelChange = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setStage("menu");
    setError(null);
  };

  const headlineFor = (s: Stage) => {
    if (s === "current") return "Enter your current PIN";
    if (s === "new") return "Choose a new 4-digit PIN";
    if (s === "confirm") return "Confirm your new PIN";
    return "";
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerStyle: { backgroundColor: c.bg },
          headerTitleStyle: {
            color: c.text,
            fontFamily: "Inter_600SemiBold",
          },
          headerTintColor: c.primary,
          headerShadowVisible: false,
        }}
      />

      {stage === "menu" ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {bannerOk ? (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: c.primarySoft,
                  borderColor: c.primaryDim,
                },
              ]}
            >
              <Feather name="check-circle" size={16} color={c.primary} />
              <Text style={[styles.bannerText, { color: c.primary }]}>
                {bannerOk}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.section, { color: c.textMuted }]}>SECURITY</Text>

          <Card>
            <Pressable
              onPress={() => setStage("current")}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[styles.icon, { backgroundColor: c.primarySoft }]}
                >
                  <Feather name="key" size={16} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>
                    Change PIN
                  </Text>
                  <Text style={[styles.rowSub, { color: c.textMuted }]}>
                    4-digit unlock code
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={c.textMuted} />
              </View>
            </Pressable>

            <View
              style={[styles.divider, { backgroundColor: c.border }]}
              pointerEvents="none"
            />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[styles.icon, { backgroundColor: c.accentSoft }]}
                >
                  <Feather name="shield" size={16} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>
                    {biometric.label}
                  </Text>
                  <Text style={[styles.rowSub, { color: c.textMuted }]}>
                    {biometric.available && biometric.enrolled
                      ? "Unlock without typing"
                      : biometric.available
                        ? "Enroll in device settings to enable"
                        : "Not supported on this device"}
                  </Text>
                </View>
                <Switch
                  value={
                    biometricEnabled &&
                    biometric.available &&
                    biometric.enrolled
                  }
                  onValueChange={onToggleBio}
                  disabled={!biometric.available}
                  trackColor={{ false: c.border, true: c.primarySoft }}
                  thumbColor={
                    biometricEnabled && biometric.available
                      ? c.primary
                      : c.textMuted
                  }
                />
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: c.border }]}
              pointerEvents="none"
            />

            <Pressable
              onPress={onLockNow}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[styles.icon, { backgroundColor: c.warnSoft }]}
                >
                  <Feather name="lock" size={16} color={c.warn} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>
                    Lock now
                  </Text>
                  <Text style={[styles.rowSub, { color: c.textMuted }]}>
                    Require PIN to reopen
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={c.textMuted} />
              </View>
            </Pressable>
          </Card>

          <Text style={[styles.footnote, { color: c.textDim }]}>
            Your PIN is hashed and stored in the device's secure hardware
            (Android Keystore / iOS Keychain). It never leaves this device.
          </Text>

          <Text style={[styles.section, { color: c.textMuted }]}>SMS</Text>
          <SmsAutoImportCard showRecent={false} />
        </ScrollView>
      ) : (
        <View style={[styles.pinScreen, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.pinTop}>
            <Text style={[styles.pinHeadline, { color: c.text }]}>
              {headlineFor(stage)}
            </Text>
            <View style={{ marginTop: 18 }}>
              <PinDots
                length={PIN_LENGTH}
                filled={value.length}
                error={!!error}
              />
            </View>
            {error ? (
              <Text style={[styles.errorText, { color: c.danger }]}>
                {error}
              </Text>
            ) : null}
          </View>

          <View style={styles.pinBottom}>
            {busy ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <PinKeypad onDigit={onDigit} onBackspace={onBackspace} />
            )}
            <Pressable
              onPress={onCancelChange}
              style={({ pressed }) => [
                styles.cancelBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.cancelText, { color: c.textMuted }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "web" ? 16 : 8,
    gap: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  section: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  row: {
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -16,
  },
  footnote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
    marginTop: 16,
    lineHeight: 16,
  },
  pinScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "space-between",
  },
  pinTop: {
    alignItems: "center",
    gap: 12,
  },
  pinHeadline: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  pinBottom: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
