import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import Restaurant from "./pages/Restaurant";
import Login from "./pages/Login";
import Offers from "./pages/Offers";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Signup from "./pages/Signup";
import CustomerDashboard from "./pages/CustomerDashboard";
import Checkout from "./pages/Checkout";
import ProtectedRoute from "./components/ProtectedRoute";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantRegistration from "./pages/RestaurantRegistration";
import AdminAccess from "./pages/AdminAccess";
import AdminPage from "./pages/AdminPage";


function App() {
  return (

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />

    <Route
      path="/restaurants"
      element={<Restaurants />}
    />

    <Route
      path="/restaurants/:restaurantId"
      element={<Restaurant />}
    />

    <Route path="/offers" element={<Offers />} />

    <Route path="/about" element={<About />} />

    <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />

    <Route path="/login" element={<Login />} />

    <Route path="/accessadmin" element={<AdminAccess />} />
    <Route
      path="/adminpage"
      element={
        <ProtectedRoute role="admin">
          <AdminPage />
        </ProtectedRoute>
      }
    />

    <Route path="/signup" element={<Signup />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute role="customer">
          <CustomerDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/restaurant-dashboard"
      element={
        <ProtectedRoute role="restaurant">
          <RestaurantDashboard />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/restaurant-registration"
      element={
        <ProtectedRoute role="restaurant">
          <RestaurantRegistration />
        </ProtectedRoute>
      }
    />

    <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>

  );
}

export default App;
