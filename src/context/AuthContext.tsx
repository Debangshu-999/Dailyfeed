import { createContext, ReactNode, useContext, useState } from "react";
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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    console.log(data);

    if (data.session) {
      const token = data.session.access_token.toString()
      const expires_at = data.session.expires_at?.toString() ?? ""
      const dataToStore = [["access_token", token], ["expires_at", expires_at]]
      await AsyncStorage.setItem("access_token", token)
      await AsyncStorage.setItem("expires_at", expires_at)
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      console.log(data);
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
    }
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      if (!data) {
        console.error("No profile data returned");
        return null;
      }

      const authUser = await supabase.auth.getUser();
      if (!authUser.data.user) {
        console.error("No auth user found");
        return null;
      }

      return {
        id: data.id,
        email: authUser.data.user.email || "",
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
        .update(updateData)
        .eq("id", user.id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, updateUser }}>
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
