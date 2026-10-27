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

    <Route path="/cart" element={<Cart />} />

    <Route path="/login" element={<Login />} />

    <Route path="/signup" element={<Signup />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <CustomerDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/restaurant-dashboard"
      element={
        <ProtectedRoute>
          <RestaurantDashboard />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/restaurant-registration"
      element={
        <ProtectedRoute>
          <RestaurantRegistration />
        </ProtectedRoute>
      }
    />

    <Route path="/checkout" element={<Checkout />} />
  </Routes>
</BrowserRouter>

  );
}

export default App;