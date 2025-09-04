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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-transparent">
      <div className="flex justify-around py-3">
        {navItems.map(({ id, label, icon: Icon, inactive }) => (
          <button
            key={id}
            className={`nav-item flex items-center justify-center p-2 transition-colors ${
              activeSection === id ? 'active' : inactive ? 'inactive' : ''
            }`}
            onClick={() => onSectionChange(id)}
            data-testid={`nav-${id}`}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </nav>
  );
}
