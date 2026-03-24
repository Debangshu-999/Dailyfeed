import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  profileImage: string;
  onboardingCompleted?: boolean;
}

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const expiresAt = await AsyncStorage.getItem("expires_at");

        if (!accessToken || !expiresAt) return;

        const expiresAtSeconds = Number(expiresAt);
        const nowSeconds = Math.floor(Date.now() / 1000);

        if (nowSeconds >= expiresAtSeconds) {
          await AsyncStorage.removeMany([
            "access_token",
            "refresh_token",
            "expires_at",
          ]);
          return;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });

        if (error || !data.user) return;

        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      await AsyncStorage.setItem("access_token", data.session.access_token);
      await AsyncStorage.setItem("refresh_token", data.session.refresh_token);
      await AsyncStorage.setItem(
        "expires_at",
        data.session.expires_at?.toString() ?? "",
      );
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        console.error("No auth user found");
        return null;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // No profile row yet (fresh signup before onboarding)
      if (!data) {
        return {
          id: authData.user.id,
          email: authData.user.email ?? "",
          name: "",
          username: "",
          profileImage: "",
          onboardingCompleted: false,
        };
      }

      return {
        id: data.id,
        email: authData.user.email ?? "",
        name: data.name,
        username: data.username,
        profileImage: data.profile_image_url,
        onboardingCompleted: data.onboarding_completed,
      };
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      await AsyncStorage.setItem("access_token", data.session.access_token);
      await AsyncStorage.setItem("refresh_token", data.session.refresh_token);
      await AsyncStorage.setItem(
        "expires_at",
        data.session.expires_at?.toString() ?? "",
      );
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.username !== undefined)
        updateData.username = userData.username;
      if (userData.profileImage !== undefined)
        updateData.profile_image_url = userData.profileImage;
      if (userData.onboardingCompleted !== undefined)
        updateData.onboarding_completed = userData.onboardingCompleted;
      console.log(updateData);
      console.log(user);
      const { error } = await supabase
        .from("profiles")
        .insert({ id: user.id, ...updateData });
      if (error) throw error;

      setUser((prev) => (prev ? { ...prev, ...userData } : null));
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeMany(["access_token", "refresh_token", "expires_at"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut, updateUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("must be used inside provider");
  }
  return context;
};
