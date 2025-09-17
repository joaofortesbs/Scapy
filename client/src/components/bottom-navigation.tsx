import { 
  Bot, 
  BookOpen, 
  Home, 
  BarChart3, 
  Users 
} from "lucide-react";

interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function BottomNavigation({ 
  activeSection, 
  onSectionChange 
}: BottomNavigationProps) {
  const navItems = [
    { id: 'scapy-ia', label: 'Scapy IA', icon: Bot, inactive: true },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen, inactive: true },
    { id: 'painel', label: 'Painel', icon: Home, inactive: false },
    { id: 'desempenho', label: 'Desempenho', icon: BarChart3, inactive: true },
    { id: 'comunidade', label: 'Comunidade', icon: Users, inactive: true },
  ];

  return (
    <nav className="bg-transparent">
      <div className="flex justify-around py-3">
        {navItems.map(({ id, label, icon: Icon, inactive }) => (
          <button
            key={id}
            className={`nav-item transition-colors ${
              id === 'painel' ? 'active' : inactive ? 'inactive' : ''
            }`}
            onClick={() => onSectionChange(id)}
            data-testid={`nav-${id}`}
          >
            <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 font-extrabold" />
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}