import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const router = useRouter()
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign In to continue</Text>
        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={"#999"}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={"#999"}
            autoComplete="password"
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btn_txt}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.link_btn}>
            <Text style={styles.linkbtn_txt}>
              Don't have an account?{" "}
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.linkbtn_txt_bold}>Sign Up</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    marginLeft: 430,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: "#666",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  form: {
    width: "50%",
  },
  btn: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  btn_txt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link_btn: {
    marginTop: 24,
    alignItems: "center",
  },
  linkbtn_txt: {
    color: "#666",
    fontSize: 14,
  },
  linkbtn_txt_bold: {
    fontWeight: "600",
    color: "#000",
  },
});
