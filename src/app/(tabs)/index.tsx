import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const BASE = "https://hacker-news.firebaseio.com/v0";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
}

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getDomain(url?: string): string {
  if (!url) return "text";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function StoryImage({ url }: { url?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.image?.url) setImageUrl(data.data.image.url);
      })
      .catch(() => {});
  }, [url]);

  if (!imageUrl) return null;

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.storyImage}
      contentFit="cover"
    />
  );
}

export default function FeedScreen() {
  const { theme } = useTheme();
  const [stories, setStories] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStories() {
    try {
      setError(null);
      const ids: number[] = await fetch(`${BASE}/topstories.json`).then((r) => r.json());
      const top20 = ids.slice(0, 20);
      const items: HNStory[] = await Promise.all(
        top20.map((id: number) => fetch(`${BASE}/item/${id}.json`).then((r) => r.json()))
      );
      setStories(items.filter(Boolean));
    } catch {
      setError("Failed to load stories. Pull down to retry.");
    }
  }

  useEffect(() => {
    fetchStories().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchStories();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: HNStory }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.75}
        onPress={() => item.url && Linking.openURL(item.url)}
      >
        <StoryImage url={item.url} />
        <View style={styles.cardContent}>
          <Text style={[styles.domain, { color: theme.subtext }]}>{getDomain(item.url)}</Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {item.title}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="arrow-up-outline" size={13} color={theme.subtext} />
            <Text style={[styles.metaText, { color: theme.subtext }]}>{item.score}</Text>
            <Ionicons name="chatbubble-outline" size={13} color={theme.subtext} />
            <Text style={[styles.metaText, { color: theme.subtext }]}>{item.descendants ?? 0}</Text>
            <Text style={[styles.metaText, { color: theme.subtext }]}>by {item.by}</Text>
            <Text style={[styles.metaText, { color: theme.subtext }]}>{timeAgo(item.time)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={stories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text style={[styles.header, { color: theme.text }]}>Feed</Text>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={[styles.errorText, { color: theme.subtext }]}>{error}</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  header: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  storyImage: {
    width: "100%",
    height: 180,
  },
  cardContent: {
    padding: 14,
  },
  domain: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 21, marginBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaText: { fontSize: 12, fontWeight: "500" },
  errorText: { textAlign: "center", marginTop: 40, fontSize: 14, paddingHorizontal: 24 },
});
