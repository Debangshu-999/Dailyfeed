import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function RouteGuard() {
  const router = useRouter();
  const { user } = useAuth();
  const segments = useSegments();

  const [isLoading, setIsLoading] = useState(true);

  const inAuthGroup = segments[0] === "(auth)";
  const inTabsGroup = segments[0] === "(tabs)";

  const isStoredTokenExpired = async (): Promise<boolean> => {
    const expiresAt = await AsyncStorage.getItem("expires_at");

    if (!expiresAt) return true;

    const expiresAtSeconds = Number(expiresAt);
    const nowSeconds = Math.floor(Date.now() / 1000);

    return nowSeconds >= expiresAtSeconds;
  };

  useEffect(() => {
    const runGuard = async () => {
      if (!segments.length) return;

      const expired = await isStoredTokenExpired();

      if (expired) {
        await AsyncStorage.removeMany(["access_token", "expires_at"]);

        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }

        setIsLoading(false);
        return;
      }

      if (!user && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (user && !inTabsGroup) {
        router.replace("/(tabs)");
      }

      setIsLoading(false);
    };

    runGuard();
  }, [user, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard />
    </AuthProvider>
  );
}
