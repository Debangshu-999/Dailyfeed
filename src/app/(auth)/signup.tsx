import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
    email: string,
    password: string
}

const ERR_FORM: FormError = {
    email: "",
    password:""
}


export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState(ERR_FORM)

  const validateForm = () => {
    let tempErr: FormError = {...ERR_FORM}
    if(!form.email.trim()){
        tempErr.email = "Email is required"
    }

    if(!form.password.trim()){
        tempErr.password = "Password is required"
    }

    setErrors(tempErr)

    return Object.keys(tempErr).length === 0
  }

  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSignup = async() => {
    if(!validateForm){
        Alert.alert("Error", "Please fill up the form")
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign Up to get started</Text>
        <View style={styles.form}>
          {/* <TextInput
            placeholder="Name"
            placeholderTextColor={"#999"}
            keyboardType="default"
            autoComplete="username"
            autoCapitalize="none"
            value=""
            style={styles.input}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor={"#999"}
            keyboardType="numeric"
            autoComplete="tel-device"
            autoCapitalize="none"
            style={styles.input}
          /> */}
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
          <TextInput
            placeholder="Password"
            placeholderTextColor={"#999"}
            autoComplete="password"
            secureTextEntry
            style={styles.input}
            value={form.password}
            onChangeText={(text) => handleChange("email", text)}
          />

          <TouchableOpacity style={styles.btn} onPress={handleSignup}>
            <Text style={styles.btn_txt}>Sign Up</Text>
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
