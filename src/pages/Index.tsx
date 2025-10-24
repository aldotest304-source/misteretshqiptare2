import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedStories from "@/components/FeaturedStories";
import About from "@/components/About";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Categories />
      <FeaturedStories />
      <About />
      <Footer />
    </div>
  );
};

export default Index;