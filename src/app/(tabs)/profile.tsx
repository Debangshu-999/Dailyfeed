import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { Switch } from "react-native";

interface Profile {
  id: string;
  name: string;
  username: string;
  profile_image_url: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, profile_image_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          {profile?.profile_image_url ? (
            <Image source={{ uri: profile.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={[styles.displayName, { color: theme.text }]}>{profile?.name || "—"}</Text>
          <Text style={[styles.usernameLabel, { color: theme.subtext }]}>@{profile?.username || "—"}</Text>
        </View>

        {/* Info rows */}
        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.subtext }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email ?? "—"}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.subtext }]}>Username</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.username ?? "—"}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.subtext }]}>Full Name</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.name || "—"}</Text>
        </View>

        {/* Dark mode toggle */}
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name={theme.dark ? "moon" : "sunny-outline"} size={16} color={theme.subtext} />
            <Text style={[styles.infoLabel, { color: theme.subtext }]}>Dark Mode</Text>
          </View>
          <Switch
            value={theme.dark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#E2E8F0", true: "#334155" }}
            thumbColor={theme.dark ? "#F1F5F9" : "#fff"}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  displayName: {
    fontSize: 17,
    fontWeight: "800",
  },
  usernameLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  signOutButton: {
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
    marginTop: 14,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
});
