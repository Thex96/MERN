import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const adminUser = sessionStorage.getItem("foodease_admin_user");
      const adminToken = sessionStorage.getItem("foodease_admin_token");
      const isAdminSession = Boolean(adminUser && adminToken);
      const storedUser = adminUser || localStorage.getItem("foodease_user");
      const storedToken = adminToken || localStorage.getItem("foodease_token");

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);

        if (userData.role !== "admin" || isAdminSession) {
          setUser(userData);
          setToken(storedToken);
        } else {
          localStorage.removeItem("foodease_user");
          localStorage.removeItem("foodease_token");
        }
      }
    } catch {
      localStorage.removeItem("foodease_user");
      localStorage.removeItem("foodease_token");
    } finally {
      setLoading(false);
    }
  }, []);

  function saveSession(userData, authToken) {
    localStorage.setItem("foodease_user", JSON.stringify(userData));
    localStorage.setItem("foodease_token", authToken);
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
      throw new Error(errorMessage(error, "Could not send the code."));
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
      throw new Error(errorMessage(error, "Could not verify the code."));
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

      saveSession(data.user, data.token);
      return data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not create your account."));
    }
  }

  async function login(email, password, role = "customer") {
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

      saveSession(data.user, data.token);
      return data;
    } catch (error) {
      throw new Error(errorMessage(error, "Unable to log in."));
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
      throw new Error(errorMessage(error, "Unable to sign in as admin."));
    }
  }

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem("foodease_admin_user");
    sessionStorage.removeItem("foodease_admin_token");

    try {
      const savedUser = localStorage.getItem("foodease_user");
      const savedToken = localStorage.getItem("foodease_token");

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
    setUser(null);
    setToken(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("foodease_user");
    localStorage.removeItem("foodease_token");
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

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;