import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

export default function Header() {
  const handleGoalsClick = () => {
    alert("Seção de Objetivos - Em desenvolvimento");
  };

  return (
    <header className="p-4 flex items-center justify-between">
      <div className="w-34 h-34">
        <img 
          src="/logo-scapy.png" 
          alt="Logo Scapy" 
          className="w-32 h-16 object-contain"
          onError={(e) => {
            e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=scapy&backgroundColor=00F6FF&shape1Color=000515";
          }}
          data-testid="logo-scapy"
        />
      </div>

      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon"
          className="w-32 h-12 rounded-full hover:bg-primary/10 transition-colors"
          onClick={handleGoalsClick}
          data-testid="button-goals"
        >
          <Target className="w-12 h-12 text-primary" />
        </Button>

        <div className="gradient-border w-12 h-12" data-testid="profile-container">
          <div className="gradient-border-inner flex items-center justify-center">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user&backgroundColor=000515" 
              alt="Profile Picture" 
              className="w-10 h-10 rounded-full object-cover"
              data-testid="profile-image"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
