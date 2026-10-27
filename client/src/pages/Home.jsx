import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedRestaurants from "../components/FeaturedRestaurants";
import PopularDishes from "../components/PopularDishes";
import FoodSaver from "../components/FoodSaver";
import HowItWorks from "../components/HowItWorks";
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
        <PopularDishes />
        <FoodSaver />
        <HowItWorks />
        <RestaurantCTA />
      </main>

      <Footer />
    </>
  );
}

export default Home;