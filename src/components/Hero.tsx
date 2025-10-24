import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-mystery.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Misteret Shqiptare"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Misteret Shqiptare
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Zbulo të vërtetën pas legjendave urbane, historive të pasegurta dhe kurioziteteve globale
        </p>
        <p className="text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
          Discover the truth behind urban legends, mysterious stories and global curiosities
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="bg-gradient-mystery hover:shadow-glow transition-all">
            Eksploro Historitë
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.href = "/submit"}
          >
            Dërgo Historinë Tënde
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-glow-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;