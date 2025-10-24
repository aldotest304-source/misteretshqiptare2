import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"sq" | "en">("sq");

  const toggleLanguage = () => {
    setLanguage(language === "sq" ? "en" : "sq");
  };

  const navItems = {
    sq: {
      home: "Ballina",
      categories: "Kategoritë",
      about: "Rreth Nesh",
    },
    en: {
      home: "Home",
      categories: "Categories",
      about: "About",
    },
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-mystery rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-xl font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Misteret Shqiptare
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              {navItems[language].home}
            </a>
            <a href="#categories" className="text-foreground hover:text-primary transition-colors">
              {navItems[language].categories}
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              {navItems[language].about}
            </a>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="hover:bg-secondary"
            >
              <Globe className="h-5 w-5" />
              <span className="ml-2 text-sm">{language.toUpperCase()}</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground hover:text-primary"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <a
                href="#home"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {navItems[language].home}
              </a>
              <a
                href="#categories"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {navItems[language].categories}
              </a>
              <a
                href="#about"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {navItems[language].about}
              </a>
              <Button
                variant="ghost"
                onClick={toggleLanguage}
                className="justify-start hover:bg-secondary"
              >
                <Globe className="h-5 w-5 mr-2" />
                {language.toUpperCase()}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;