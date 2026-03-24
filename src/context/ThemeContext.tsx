import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "app_theme";

export const lightTheme = {
  dark: false,
  background: "#F6F7FB",
  card: "#ffffff",
  text: "#0F172A",
  subtext: "#64748B",
  input: "#f5f5f5",
  inputBorder: "#ddd",
  border: "#E2E8F0",
  banner: "#0F172A",
  placeholder: "#999",
};

export const darkTheme = {
  dark: true,
  background: "#0F172A",
  card: "#1E293B",
  text: "#F1F5F9",
  subtext: "#94A3B8",
  input: "#0F172A",
  inputBorder: "#334155",
  border: "#334155",
  banner: "#020617",
  placeholder: "#64748B",
};

type Theme = typeof lightTheme;

interface ThemeContext {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContext | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "dark") setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
