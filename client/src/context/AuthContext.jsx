import {
  createContext,
  useContext,
  useEffect,
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
      const storedUser = localStorage.getItem("foodease_user");
      const storedToken = localStorage.getItem("foodease_token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
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

  function getErrorMessage(error, fallback) {
    if (error.response) {
      return error.response.data?.message || fallback;
    }

    if (error.request) {
      return "Cannot connect to FoodEase server. Please try again later.";
    }

    return error.message || fallback;
  }

  async function signup(input, emailArg, passwordArg) {
    const credentials =
      typeof input === "object" && input !== null
        ? input
        : {
            username: input,
            email: emailArg,
            password: passwordArg,
          };

    let response;

    try {
      response = await api.post("/auth/signup", {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        role: credentials.role === "restaurant" ? "restaurant" : "customer",
      });
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Unable to create your account.")
      );
    }

    const data = response.data;

    if (!data.user || !data.token) {
      throw new Error(
        data.message || "The server did not return a valid user session."
      );
    }

    saveSession(data.user, data.token);

    return data;
  }

  async function login(email, password, role = "customer") {
    let response;

    try {
      response = await api.post("/auth/login", {
        email,
        password,
        role: role === "restaurant" ? "restaurant" : "customer",
      });
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Unable to log in.")
      );
    }

    const data = response.data;

    if (!data.user || !data.token) {
      throw new Error(
        data.message || "The server did not return a valid user session."
      );
    }

    saveSession(data.user, data.token);

    return data;
  }

  async function adminLogin(password) {
    let response;
    try {
      response = await api.post("/auth/admin-login", { password });
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to sign in as admin."));
    }
    const data = response.data;
    if (data.user?.role !== "admin" || !data.token) {
      throw new Error(data.message || "The server did not return a valid admin session.");
    }
    saveSession(data.user, data.token);
    return data;
  }

  function logout() {
    localStorage.removeItem("foodease_user");
    localStorage.removeItem("foodease_token");

    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        login,
        adminLogin,
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
