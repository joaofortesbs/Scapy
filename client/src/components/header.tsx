import { Button } from "@/components/ui/button";
import { User, Target, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useProfileImage } from "@/hooks/useProfileImage";

interface HeaderProps {
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    username?: string;
    profileImage?: string;
  };
  onLogout?: () => void;
}

function Header({ user, onLogout }: HeaderProps) {
  const [, setLocation] = useLocation();
  
  // Hook robusto para carregamento de imagem
  const { imageUrl } = useProfileImage(user);

  const handleProfileClick = () => {
    setLocation('/perfil-usuario');
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
        <div className="gradient-border w-12 h-12" data-testid="empty-circle-container">
          <div className="gradient-border-inner flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
        </div>

        <button 
          onClick={handleProfileClick}
          className="gradient-border w-12 h-12 hover:scale-105 transition-transform cursor-pointer" 
          data-testid="profile-container"
        >
          <div className="gradient-border-inner flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Profile Picture"
              className="w-10 h-10 rounded-full object-cover"
              data-testid="profile-image"
              onError={(e) => {
                // Fallback adicional se a imagem falhar completamente
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}&backgroundColor=000515`;
              }}
            />
          </div>
        </button>
      </div>
    </header>
  );
}

export { Header };
export default Header;