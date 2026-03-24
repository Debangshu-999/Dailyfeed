import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FormData {
  email: string;
  password: string;
}

const DEFAULT_FORM: FormData = {
  email: "",
  password: "",
};

interface FormError {
  email: string;
  password: string;
}

const ERR_FORM: FormError = {
  email: "",
  password: "",
};

export default function LoginScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState(ERR_FORM);

//   useEffect(()=>{
//     router.push("/(auth)/onboarding")
//   }, [])

  const validateForm = () => {
    let tempErr: FormError = { ...ERR_FORM };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim()) {
      tempErr.email = "Email is required";
    }

    if (!emailRegex.test(form.email)) {
      tempErr.email = "Invalid email format";
    }

    if (!form.password.trim()) {
      tempErr.password = "Password is required";
    }

    setErrors(tempErr);

    return Object.values(tempErr).every((value) => value === "");
  };

  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSignup = async () => {
    setLoading(true);

    if (!validateForm()) {
      console.log("Error: Please fill up the form");
      setLoading(false);
      return;
    }

    try {
      console.log(form);
      await signUp(form.email, form.password);
      router.push("/(auth)/onboarding")
    } catch (err) {
      alert("Signup failed");
      console.log("Signup failed");
    } finally {
      setLoading(false);
      setForm(DEFAULT_FORM);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign Up to get started</Text>
        <View style={styles.form}>

          <TextInput
            placeholder="Email"
            placeholderTextColor={"#999"}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            style={styles.input}
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <TextInput
            placeholder="Password"
            placeholderTextColor={"#999"}
            autoComplete="password"
            secureTextEntry
            style={styles.input}
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={handleSignup}>
            {isLoading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.btn_txt}>Sign Up</Text>
                <ActivityIndicator size={16} color={"#fff"} />
              </View>
            ) : (
              <Text style={styles.btn_txt}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.link_btn}>
            <Text style={styles.linkbtn_txt}>
              Already have an account?{" "}
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.linkbtn_txt_bold}>Log In</Text>
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
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", // centers horizontally
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
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
    flexDirection: "row",
    justifyContent: "center",
  },
  linkbtn_txt: {
    color: "#666",
    fontSize: 14,
  },
  linkbtn_txt_bold: {
    fontWeight: "600",
    color: "#000",
  },
  errorText: {
    color: "red",
  },
});
