"use client";

import type { User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { postSocialLogin, SocialLoginError } from "@/utils/socialLogin";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

type FirebaseRuntime = {
  auth: import("firebase/auth").Auth | undefined;
  onAuthStateChanged: typeof import("firebase/auth").onAuthStateChanged;
  signOut: typeof import("firebase/auth").signOut;
  clearFirebaseSession: typeof import("@/lib/firebase").clearFirebaseSession;
  resetFirebase: typeof import("@/lib/firebase").resetFirebase;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
let firebaseRuntimePromise: Promise<FirebaseRuntime> | null = null;

function loadFirebaseRuntime() {
  if (!firebaseRuntimePromise) {
    firebaseRuntimePromise = Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]).then(([firebaseModule, authModule]) => ({
      auth: firebaseModule.auth,
      onAuthStateChanged: authModule.onAuthStateChanged,
      signOut: authModule.signOut,
      clearFirebaseSession: firebaseModule.clearFirebaseSession,
      resetFirebase: firebaseModule.resetFirebase,
    }));
  }

  return firebaseRuntimePromise;
}

async function hasPersistedFirebaseSession() {
  if (sessionStorage.getItem("google_login_in_progress") === "true") {
    return true;
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("firebase:authUser:")) return true;
  }

  if (
    typeof indexedDB !== "undefined" &&
    typeof indexedDB.databases === "function"
  ) {
    try {
      const databases = await indexedDB.databases();
      const hasFirebaseDatabase = databases.some(
        (database) => database.name === "firebaseLocalStorageDb",
      );
      if (!hasFirebaseDatabase) return false;

      return await new Promise<boolean>((resolve) => {
        const request = indexedDB.open("firebaseLocalStorageDb");

        request.onerror = () => resolve(true);
        request.onsuccess = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("firebaseLocalStorage")) {
            database.close();
            resolve(false);
            return;
          }

          const transaction = database.transaction(
            "firebaseLocalStorage",
            "readonly",
          );
          const keysRequest = transaction
            .objectStore("firebaseLocalStorage")
            .getAllKeys();

          keysRequest.onerror = () => resolve(true);
          keysRequest.onsuccess = () => {
            database.close();
            resolve(
              keysRequest.result.some((key) =>
                String(key).startsWith("firebase:authUser:"),
              ),
            );
          };
        };
      });
    } catch {
      return true;
    }
  }

  // Older browsers cannot inspect IndexedDB safely, so preserve the old
  // eager restoration behavior there.
  return true;
}

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    setAuthFromApi,
    isAuthenticated,
    registerFirebaseLogout,
  } = useAuth();
  const { language } = useLanguage();

  const runtimeRef = useRef<FirebaseRuntime | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isLoggingOut = useRef(false);
  const autoLoginBlocked = useRef(false);
  const logoutInProgress = useRef(false);
  const languageRef = useRef(language);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const setAuthFromApiRef = useRef(setAuthFromApi);

  languageRef.current = language;
  isAuthenticatedRef.current = isAuthenticated;
  setAuthFromApiRef.current = setAuthFromApi;

  const firebaseLogout = useCallback(async () => {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    autoLoginBlocked.current = true;
    isLoggingOut.current = true;

    try {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setUser(null);

      let runtime = runtimeRef.current;
      if (!runtime && (await hasPersistedFirebaseSession())) {
        runtime = await loadFirebaseRuntime();
        runtimeRef.current = runtime;
      }

      if (!runtime) return;

      if (runtime.auth) {
        try {
          await runtime.signOut(runtime.auth);
        } catch {
          // API logout must still complete if Firebase is unavailable.
        }
      }

      void runtime.clearFirebaseSession();
      runtime.resetFirebase();
    } finally {
      logoutInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    registerFirebaseLogout?.(firebaseLogout);
  }, [firebaseLogout, registerFirebaseLogout]);

  useEffect(() => {
    let cancelled = false;

    async function restoreFirebaseSession() {
      const shouldInitialize = await hasPersistedFirebaseSession();
      if (!shouldInitialize || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const runtime = await loadFirebaseRuntime();
        if (cancelled || !runtime.auth) {
          if (!cancelled) setLoading(false);
          return;
        }

        runtimeRef.current = runtime;
        unsubscribeRef.current?.();
        unsubscribeRef.current = runtime.onAuthStateChanged(
          runtime.auth,
          async (firebaseUser) => {
            if (
              cancelled ||
              logoutInProgress.current ||
              isLoggingOut.current ||
              autoLoginBlocked.current
            ) {
              if (!cancelled) setUser(null);
              return;
            }

            setUser(firebaseUser);
            setLoading(false);

            const localToken = localStorage.getItem("auth_token");
            const googleLoginInProgress =
              sessionStorage.getItem("google_login_in_progress") === "true";

            if (
              !firebaseUser ||
              isAuthenticatedRef.current ||
              localToken ||
              googleLoginInProgress
            ) {
              return;
            }

            try {
              const data = await postSocialLogin(
                {
                  provider: "google",
                  provider_id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name: firebaseUser.displayName || "User",
                  image: firebaseUser.photoURL || "",
                },
                languageRef.current || "ar",
              );

              if (data.data?.token) {
                setAuthFromApiRef.current(
                  {
                    token: data.data.token,
                    name:
                      data.data.user?.name ||
                      firebaseUser.displayName ||
                      "مستخدم",
                    email:
                      data.data.user?.email || firebaseUser.email || "",
                    image:
                      data.data.user?.image || firebaseUser.photoURL || "",
                    fullName:
                      data.data.user?.name ||
                      firebaseUser.displayName ||
                      "مستخدم",
                  },
                  false,
                );
              }
            } catch (error) {
              if (error instanceof SocialLoginError) {
                autoLoginBlocked.current = true;
                setUser(null);

                if (runtime.auth) {
                  void runtime.signOut(runtime.auth);
                }
              }
            }
          },
        );
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreFirebaseSession();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  const getIdToken = useCallback(async () => {
    if (
      !user ||
      autoLoginBlocked.current ||
      isLoggingOut.current ||
      logoutInProgress.current
    ) {
      return null;
    }

    return user.getIdToken();
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      logout: firebaseLogout,
      getIdToken,
    }),
    [firebaseLogout, getIdToken, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return context;
};
