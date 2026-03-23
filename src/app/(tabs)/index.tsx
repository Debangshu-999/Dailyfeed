import { Text, View, StyleSheet, TextInput, ActivityIndicator, Button} from "react-native";
import { Link, useRouter } from "expo-router";

export default function Index() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.Helloworldtitle}>Hello World.</Text>
      <Link href={"/about"}>Go to Image</Link>
      <TextInput placeholder="Email"/>
      <Button title="Naviagate to Image" onPress={() => router.push("/about")}/>
      <ActivityIndicator/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  Helloworldtitle: {
    color: "red",
  },
  image: {
    width: 200,
    height: 200,
  },
});
