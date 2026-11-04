import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedRestaurants from "../components/FeaturedRestaurants";
import RestaurantCTA from "../components/RestaurantCTA";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Categories />
        <FeaturedRestaurants />
        <RestaurantCTA />
      </main>

      <Footer />
    </>
  );
}

export default Home;
