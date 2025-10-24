import { Facebook, Instagram, Mail, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          {/* Brand */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-mystery rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-xl font-bold text-primary-foreground">M</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Misteret Shqiptare
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Nëse dëshironi të ndani historinë tuaj mistike, na kontaktoni nëpërmjet rrjeteve sociale.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex justify-center gap-4 mb-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.tiktok.com/@misteret.shqiptare?_t=ZM-90p0dE6Z8Zf&_r=1" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="TikTok">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="mailto:misteretshqiptare@gmail.com" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Email">
              <Mail className="h-5 w-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="border-t border-border pt-6 text-muted-foreground">
            <p>© 2025 Misteret Shqiptare. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
