import { Button } from "@/components/ui/button";
import { User, Target, LogOut } from "lucide-react";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
  };
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {

  return (
    <header className="w-full bg-transparent backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-white">Scapy</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="hidden md:flex flex-col text-right text-sm">
              <span className="text-white font-medium">{user.fullName}</span>
              <span className="text-slate-400 text-xs">{user.email}</span>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:text-cyan-400 hover:bg-white/10"
          >
            <User className="w-4 h-4 mr-2" />
            Perfil
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:text-cyan-400 hover:bg-white/10"
          >
            <Target className="w-4 h-4 mr-2" />
            Metas
          </Button>

          {onLogout && (
            <Button 
              onClick={onLogout}
              variant="ghost" 
              size="sm" 
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}