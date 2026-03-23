import { AuthProvider } from "@/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  let isAuth: boolean = false;
  const router = useRouter();
  useEffect(() => {
    if (!isAuth) {
      router.replace("/(auth)/login");
    }

    if (isAuth) {
      router.replace("/(tabs)");
    }
  });

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </AuthProvider>
  );
}
