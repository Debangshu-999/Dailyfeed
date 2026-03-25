import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { useFocusEffect } from "expo-router";

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
  if (!url) return "text post";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function StoryImage({ url, height }: { url?: string; height: number }) {
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

  if (!imageUrl) return <View style={[styles.imagePlaceholder, { height }]} />;
  return <Image source={{ uri: imageUrl }} style={[styles.storyImage, { height }]} contentFit="cover" />;
}

export default function SavedScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [stories, setStories] = useState<HNStory[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const PADDING = 16;
  const GAP = 12;
  const COLUMNS = width > 600 ? 3 : 2;
  const cardWidth = (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const imageHeight = cardWidth * 0.65;

  async function fetchSaved() {
    if (!user?.id) return;
    const { data } = await supabase
      .from("saved")
      .select("saved_news")
      .eq("id", user.id)
      .single();

    const ids: number[] = data?.saved_news ?? [];
    setSavedIds(ids);

    if (ids.length === 0) {
      setStories([]);
      return;
    }

    const items: HNStory[] = await Promise.all(
      ids.map((id) => fetch(`${BASE}/item/${id}.json`).then((r) => r.json()))
    );
    setStories(items.filter(Boolean));
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSaved().finally(() => setLoading(false));
    }, [user?.id])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }

  async function unsave(storyId: number) {
    if (!user?.id) return;
    const newSaved = savedIds.filter((id) => id !== storyId);
    setSavedIds(newSaved);
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    await supabase
      .from("saved")
      .upsert({ id: user.id, saved_news: newSaved });
  }

  function renderItem({ item }: { item: HNStory }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, width: cardWidth }]}
        activeOpacity={0.8}
        onPress={() => item.url && Linking.openURL(item.url)}
      >
        <StoryImage url={item.url} height={imageHeight} />
        <View style={styles.cardContent}>
          <Text style={[styles.domain, { color: theme.subtext }]} numberOfLines={1}>
            {getDomain(item.url)}
          </Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {item.title}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-up" size={11} color="coral" />
              <Text style={[styles.metaText, { color: theme.subtext }]}>{item.score}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={11} color={theme.subtext} />
              <Text style={[styles.metaText, { color: theme.subtext }]}>{timeAgo(item.time)}</Text>
            </View>
            <TouchableOpacity onPress={() => unsave(item.id)} hitSlop={8} style={styles.bookmark}>
              <Ionicons name="bookmark" size={16} color="coral" />
            </TouchableOpacity>
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
        numColumns={COLUMNS}
        key={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={[styles.header, { color: theme.text }]}>Saved</Text>
            <Text style={[styles.headerSub, { color: theme.subtext }]}>Your bookmarked stories</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={52} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No saved stories yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                Tap the bookmark icon on any story in Feed to save it here
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  row: { gap: 12 },
  headerBlock: { marginBottom: 8 },
  header: { fontSize: 28, fontWeight: "800" },
  headerSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  storyImage: { width: "100%" },
  imagePlaceholder: { width: "100%", backgroundColor: "#E2E8F0" },
  cardContent: { padding: 10 },
  domain: { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  title: { fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, fontWeight: "500" },
  bookmark: { marginLeft: "auto" },
  emptyContainer: { alignItems: "center", marginTop: 100, gap: 12 },
  emptyText: { fontSize: 17, fontWeight: "700" },
  emptySubtext: { fontSize: 13, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
});
