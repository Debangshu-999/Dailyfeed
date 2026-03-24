import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface WeatherData {
  current: {
    temperature_2m: number;
    weathercode: number;
    windspeed_10m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

function getWMOInfo(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear Sky", icon: "sunny" };
  if (code <= 3) return { label: "Partly Cloudy", icon: "cloud-outline" };
  if (code <= 48) return { label: "Fog", icon: "cloudy" };
  if (code <= 57) return { label: "Drizzle", icon: "rainy-outline" };
  if (code <= 67) return { label: "Rain", icon: "rainy" };
  if (code <= 77) return { label: "Snow", icon: "snow" };
  if (code <= 82) return { label: "Showers", icon: "rainy" };
  if (code <= 86) return { label: "Snow Showers", icon: "snow" };
  if (code <= 99) return { label: "Thunderstorm", icon: "thunderstorm" };
  return { label: "Unknown", icon: "cloudy" };
}

function shortDay(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherScreen() {
  const { theme } = useTheme();
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadWeather() {
    setError(null);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;

            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            ).then((r) => r.json());
            setCity(
              geoRes.address?.city ??
              geoRes.address?.town ??
              geoRes.address?.county ??
              "Your Location"
            );

            const weatherRes: WeatherData = await fetch(
              `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${latitude}&longitude=${longitude}` +
              `&current=temperature_2m,weathercode,windspeed_10m` +
              `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
              `&timezone=auto&forecast_days=5`
            ).then((r) => r.json());
            setWeather(weatherRes);
          } catch {
            setError("Could not load weather. Pull down to retry.");
          } finally {
            resolve();
          }
        },
        () => {
          setError("Location access denied.");
          resolve();
        }
      );
    });
  }

  useEffect(() => {
    loadWeather().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  }

  const wmo = weather ? getWMOInfo(weather.current.weathercode) : null;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="location-outline" size={48} color={theme.subtext} />
            <Text style={[styles.errorText, { color: theme.subtext }]}>{error}</Text>
            {error.includes("denied") && (
              <TouchableOpacity
                style={[styles.settingsButton, { borderColor: theme.border }]}
                onPress={() => Linking.openSettings()}
              >
                <Text style={[styles.settingsButtonText, { color: theme.text }]}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : weather && wmo ? (
          <>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Weather</Text>
            <Text style={[styles.city, { color: theme.subtext }]}>{city}</Text>

            {/* Current weather card */}
            <View style={[styles.currentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name={wmo.icon as any} size={56} color={theme.text} />
              <Text style={[styles.currentTemp, { color: theme.text }]}>
                {Math.round(weather.current.temperature_2m)}°C
              </Text>
              <Text style={[styles.currentCondition, { color: theme.subtext }]}>{wmo.label}</Text>
              <View style={styles.windRow}>
                <Ionicons name="navigate-outline" size={14} color={theme.subtext} />
                <Text style={[styles.windText, { color: theme.subtext }]}>
                  {Math.round(weather.current.windspeed_10m)} km/h
                </Text>
              </View>
            </View>

            {/* 5-day forecast */}
            <Text style={[styles.forecastTitle, { color: theme.text }]}>5-Day Forecast</Text>
            <View style={styles.forecastRow}>
              {weather.daily.time.map((date, i) => {
                const dayWmo = getWMOInfo(weather.daily.weathercode[i]);
                return (
                  <View
                    key={date}
                    style={[styles.forecastCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.forecastDay, { color: theme.subtext }]}>{shortDay(date)}</Text>
                    <Ionicons name={dayWmo.icon as any} size={22} color={theme.text} />
                    <Text style={[styles.forecastHigh, { color: theme.text }]}>
                      {Math.round(weather.daily.temperature_2m_max[i])}°
                    </Text>
                    <Text style={[styles.forecastLow, { color: theme.subtext }]}>
                      {Math.round(weather.daily.temperature_2m_min[i])}°
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, flexGrow: 1 },
  pageTitle: { fontSize: 26, fontWeight: "800", marginBottom: 2 },
  city: { fontSize: 15, fontWeight: "500", marginBottom: 20 },
  currentCard: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 28,
    shadowColor: "#0B1220",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  currentTemp: { fontSize: 64, fontWeight: "800", lineHeight: 76, marginTop: 8 },
  currentCondition: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  windRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  windText: { fontSize: 13, fontWeight: "500" },
  forecastTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  forecastRow: { flexDirection: "row", gap: 8 },
  forecastCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  forecastDay: { fontSize: 11, fontWeight: "600" },
  forecastHigh: { fontSize: 13, fontWeight: "700" },
  forecastLow: { fontSize: 12, fontWeight: "500" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  errorText: { fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
  settingsButton: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  settingsButtonText: { fontSize: 14, fontWeight: "600" },
});
