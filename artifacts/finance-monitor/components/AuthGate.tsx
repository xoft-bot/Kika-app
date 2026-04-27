import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinDots } from "@/components/PinDots";
import { PinKeypad } from "@/components/PinKeypad";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const PIN_LENGTH = 4;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return <LoadingScreen />;
  if (status === "needs_setup") return <SetupScreen />;
  if (status === "locked") return <LockScreen />;
  return <>{children}</>;
}

function LoadingScreen() {
  const c = useColors();
  return (
    <View style={[styles.fill, { backgroundColor: c.bg }]}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}

function BrandHeader({ subtitle }: { subtitle: string }) {
  const c = useColors();
  return (
    <View style={styles.brand}>
      <View
        style={[
          styles.brandBadge,
          { backgroundColor: c.primarySoft, borderColor: c.primaryDim },
        ]}
      >
        <Text style={[styles.brandMark, { color: c.primary }]}>K</Text>
      </View>
      <Text style={[styles.brandName, { color: c.text }]}>Kika</Text>
      <Text style={[styles.brandSub, { color: c.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

function SetupScreen() {
  const c = useColors();
  const { setupPin, biometric, setBiometricEnabled } = useAuth();
  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enableBio, setEnableBio] = useState(true);

  const current = stage === "create" ? pin : confirmPin;

  const onDigit = (d: string) => {
    setError(null);
    if (current.length >= PIN_LENGTH) return;
    const next = current + d;
    if (stage === "create") setPin(next);
    else setConfirmPin(next);
  };

  const onBackspace = () => {
    setError(null);
    if (stage === "create") setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
  };

  useEffect(() => {
    if (stage === "create" && pin.length === PIN_LENGTH) {
      setTimeout(() => setStage("confirm"), 120);
    }
  }, [pin, stage]);

  useEffect(() => {
    if (stage !== "confirm" || confirmPin.length !== PIN_LENGTH) return;
    if (confirmPin !== pin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      setError("PINs don't match. Start over.");
      setTimeout(() => {
        setPin("");
        setConfirmPin("");
        setStage("create");
        setError(null);
      }, 900);
      return;
    }
    (async () => {
      setBusy(true);
      try {
        if (enableBio && biometric.available && biometric.enrolled) {
          await setBiometricEnabled(true);
        }
        await setupPin(pin);
      } catch {
        setError("Could not save PIN. Please try again.");
        setBusy(false);
      }
    })();
  }, [
    confirmPin,
    pin,
    stage,
    setupPin,
    enableBio,
    biometric,
    setBiometricEnabled,
  ]);

  const headline =
    stage === "create" ? "Create a 4-digit PIN" : "Confirm your PIN";
  const subtitle =
    stage === "create"
      ? "Used to unlock Kika on this device."
      : "Enter the same PIN once more.";

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[c.primarySoft, "transparent"]}
        style={styles.glow}
        pointerEvents="none"
      />
      <View style={styles.container}>
        <BrandHeader subtitle="Set up your secure lock" />

        <View style={styles.center}>
          <Text style={[styles.headline, { color: c.text }]}>{headline}</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{subtitle}</Text>

          <View style={styles.dotsWrap}>
            <PinDots
              length={PIN_LENGTH}
              filled={current.length}
              error={!!error}
            />
            {error ? (
              <Text style={[styles.errorText, { color: c.danger }]}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>

        {stage === "create" &&
        biometric.available &&
        biometric.enrolled ? (
          <Pressable
            onPress={() => setEnableBio((v) => !v)}
            style={[
              styles.bioRow,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.bioRowLeft}>
              <Feather name="shield" size={18} color={c.primary} />
              <Text style={[styles.bioText, { color: c.text }]}>
                Enable {biometric.label}
              </Text>
            </View>
            <Switch
              value={enableBio}
              onValueChange={setEnableBio}
              trackColor={{ false: c.border, true: c.primarySoft }}
              thumbColor={enableBio ? c.primary : c.textMuted}
            />
          </Pressable>
        ) : null}

        <View style={styles.keypadWrap}>
          {busy ? (
            <ActivityIndicator color={c.primary} />
          ) : (
            <PinKeypad onDigit={onDigit} onBackspace={onBackspace} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function LockScreen() {
  const c = useColors();
  const {
    unlockWithPin,
    unlockWithBiometric,
    biometric,
    biometricEnabled,
    resetAuth,
  } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;
  const triedBio = useRef(false);

  const triggerBio = useCallback(async () => {
    if (
      !biometric.available ||
      !biometric.enrolled ||
      !biometricEnabled
    )
      return;
    await unlockWithBiometric();
  }, [biometric, biometricEnabled, unlockWithBiometric]);

  useEffect(() => {
    if (triedBio.current) return;
    triedBio.current = true;
    triggerBio();
  }, [triggerBio]);

  const onDigit = (d: string) => {
    setError(false);
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      (async () => {
        const ok = await unlockWithPin(next);
        if (!ok) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
          setError(true);
          setAttempts((a) => a + 1);
          Animated.sequence([
            Animated.timing(shake, {
              toValue: 1,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(shake, {
              toValue: -1,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(shake, {
              toValue: 1,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(shake, {
              toValue: 0,
              duration: 60,
              useNativeDriver: true,
            }),
          ]).start();
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 500);
        }
      })();
    }
  };

  const onBackspace = () => {
    setError(false);
    setPin(pin.slice(0, -1));
  };

  const showBio =
    biometric.available && biometric.enrolled && biometricEnabled;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.bg }]} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[c.primarySoft, "transparent"]}
        style={styles.glow}
        pointerEvents="none"
      />
      <View style={styles.container}>
        <BrandHeader subtitle="Welcome back" />

        <View style={styles.center}>
          <Text style={[styles.headline, { color: c.text }]}>
            Enter your PIN
          </Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>
            {showBio
              ? `Or use ${biometric.label} to unlock`
              : "Tap a digit to begin"}
          </Text>

          <Animated.View
            style={[
              styles.dotsWrap,
              {
                transform: [
                  {
                    translateX: shake.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-12, 12],
                    }),
                  },
                ],
              },
            ]}
          >
            <PinDots length={PIN_LENGTH} filled={pin.length} error={error} />
          </Animated.View>
        </View>

        <View style={styles.keypadWrap}>
          <PinKeypad
            onDigit={onDigit}
            onBackspace={onBackspace}
            onBiometric={showBio ? triggerBio : undefined}
            biometricLabel={biometric.label}
          />

          {attempts >= 5 ? (
            <Pressable
              onPress={resetAuth}
              style={({ pressed }) => [
                styles.resetBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.resetText, { color: c.danger }]}>
                Forgot PIN? Reset (data on this device stays)
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  brand: {
    alignItems: "center",
    gap: 10,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMark: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  brandSub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  headline: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dotsWrap: {
    marginTop: 18,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  bioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  bioRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bioText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  keypadWrap: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  resetBtn: {
    paddingVertical: 10,
  },
  resetText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
