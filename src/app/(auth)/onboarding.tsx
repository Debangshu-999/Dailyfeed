import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { supabase } from "@/lib/supabase/client";
import { uploadProfileImage } from "@/lib/supabase/storage";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const { user, updateUser } = useAuth();
  const router = useRouter();

  // Auto-close modal after 3 seconds
  useEffect(() => {
    if (!showUsernameModal) return;

    const timer = setTimeout(() => {
      setShowUsernameModal(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showUsernameModal]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (asset?.uri) setProfileImage(asset.uri);
  };

  const handleComplete = async () => {
    setLoading(true);

    if (!username.trim()) {
      setShowUsernameModal(true);
      setLoading(false);
      return;
    }

    try {
      //check existing username
      if (!user) {
        throw new Error("User is not authenticated");
      }
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user?.id)
        .single(); //returns existing

      if (existingUser) {
        Alert.alert("Error", "Username is taken");
        return;
      }

      //upload profile image
      let profileImageUrl: string | undefined;
      //   if (profileImage) {
      //     profileImageUrl = await uploadProfileImage(user?.id, profileImage);
      //   }

      //update user profile
      await updateUser({
        name,
        username,
        profileImage: profileImageUrl,
        onboardingCompleted: true,
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to complete the onboarding. Please try again.",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>Add your information to get started</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.avatarButton}
          onPress={pickImage}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarPlus}>+</Text>
            </View>
          )}

          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>Edit</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g., user123"
            placeholderTextColor="#9AA3AF"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., John Doe"
            placeholderTextColor="#9AA3AF"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          disabled={loading}
          onPress={handleComplete}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.secondaryButton}
          onPress={() => {
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showUsernameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Username required</Text>
            <Text style={styles.modalMessage}>
              Please enter a username to continue
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    alignItems: "center",
  },

  header: {
    width: "100%",
    maxWidth: 720,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748B",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },

  avatarButton: {
    marginBottom: 18,
    position: "relative",
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  avatarPlus: {
    fontSize: 44,
    color: "#94A3B8",
    marginTop: Platform.OS === "android" ? -2 : 0,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  field: {
    width: "100%",
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    color: "#334155",
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  primaryButton: {
    marginTop: 18,
    height: 50,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalMessage: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
``;
