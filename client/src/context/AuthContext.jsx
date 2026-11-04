import {
  useCallback,
  useState,
} from "react";
import api from "../api/axios";
import { AuthContext } from "./authContext";

function readStoredSession() {
  const sessions = [
    [sessionStorage, "foodease_admin_user", "foodease_admin_token", true],
    [sessionStorage, "foodease_user", "foodease_token", false],
    [localStorage, "foodease_user", "foodease_token", false],
  ];

  for (const [storage, userKey, tokenKey, isAdminSession] of sessions) {
    try {
      const storedUser = storage.getItem(userKey);
      const storedToken = storage.getItem(tokenKey);
      if (!storedUser || !storedToken) continue;
      const userData = JSON.parse(storedUser);
      if (userData.role === "admin" && !isAdminSession) continue;
      return { user: userData, token: storedToken };
    } catch {
      storage.removeItem(userKey);
      storage.removeItem(tokenKey);
    }
  }

  sessionStorage.removeItem("foodease_admin_user");
  sessionStorage.removeItem("foodease_admin_token");
  sessionStorage.removeItem("foodease_user");
  sessionStorage.removeItem("foodease_token");
  localStorage.removeItem("foodease_user");
  localStorage.removeItem("foodease_token");
  return { user: null, token: null };
}

function AuthProvider({ children }) {
  const [initialSession] = useState(readStoredSession);
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const loading = false;

  function saveSession(userData, authToken, remember = true) {
    sessionStorage.removeItem("foodease_admin_user");
    sessionStorage.removeItem("foodease_admin_token");
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem("foodease_user");
    otherStorage.removeItem("foodease_token");
    storage.setItem("foodease_user", JSON.stringify(userData));
    storage.setItem("foodease_token", authToken);
    setUser(userData);
    setToken(authToken);
  }

  function errorMessage(error, fallback) {
    return error.response?.data?.message || fallback;
  }

  async function requestSignupCode({ username, email, role }) {
    try {
      const response = await api.post("/auth/signup/send-code", {
        username,
        email,
        role,
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not send the code."), { cause: error });
    }
  }

  async function verifySignupCode({ email, code }) {
    try {
      const response = await api.post("/auth/signup/verify-code", {
        email,
        code,
      });
      return response.data.signupToken;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not verify the code."), { cause: error });
    }
  }

  async function completeSignup(signupToken, password) {
    try {
      const response = await api.post("/auth/signup/complete", {
        signupToken,
        password,
      });

      const data = response.data;
      if (!data.user || !data.token) {
        throw new Error("The server did not return a valid user session.");
      }

      saveSession(data.user, data.token, true);
      return data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not create your account."), { cause: error });
    }
  }

  async function login(email, password, role = "customer", remember = false) {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        role: role === "restaurant" ? "restaurant" : "customer",
      });

      const data = response.data;
      if (!data.user || !data.token) {
        throw new Error("The server did not return a valid user session.");
      }

      saveSession(data.user, data.token, remember);
      return data;
    } catch (error) {
      throw new Error(errorMessage(error, "Unable to log in."), { cause: error });
    }
  }

  async function adminLogin(password) {
    try {
      const response = await api.post("/auth/admin-login", { password });
      const data = response.data;

      if (data.user?.role !== "admin" || !data.token) {
        throw new Error("The server did not return a valid admin session.");
      }

      sessionStorage.setItem("foodease_admin_user", JSON.stringify(data.user));
      sessionStorage.setItem("foodease_admin_token", data.token);
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(errorMessage(error, "Unable to sign in as admin."), { cause: error });
    }
  }

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem("foodease_admin_user");
    sessionStorage.removeItem("foodease_admin_token");

    try {
      const savedSessionUser = sessionStorage.getItem("foodease_user");
      const savedSessionToken = sessionStorage.getItem("foodease_token");
      const savedLocalUser = localStorage.getItem("foodease_user");
      const savedLocalToken = localStorage.getItem("foodease_token");
      const savedUser = savedSessionUser && savedSessionToken ? savedSessionUser : savedLocalUser;
      const savedToken = savedSessionUser && savedSessionToken ? savedSessionToken : savedLocalToken;

      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        if (userData.role !== "admin") {
          setUser(userData);
          setToken(savedToken);
          return;
        }
      }
    } catch {
      // Clear the invalid session below.
    }

    localStorage.removeItem("foodease_user");
    localStorage.removeItem("foodease_token");
    sessionStorage.removeItem("foodease_user");
    sessionStorage.removeItem("foodease_token");
    setUser(null);
    setToken(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("foodease_user");
    localStorage.removeItem("foodease_token");
    sessionStorage.removeItem("foodease_user");
    sessionStorage.removeItem("foodease_token");
    sessionStorage.removeItem("foodease_admin_user");
    sessionStorage.removeItem("foodease_admin_token");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        requestSignupCode,
        verifySignupCode,
        completeSignup,
        login,
        adminLogin,
        logoutAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
