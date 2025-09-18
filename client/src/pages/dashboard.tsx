import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import StartTimerButton from "@/components/start-timer-button";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("painel");

  const { data: weeklyProgress } = useQuery<WeeklyProgress>({
    queryKey: ["/api/weekly-progress"],
  });

  const handleSectionChange = (section: string) => {
    if (section !== "painel") {
      alert("Esta seção estará disponível em breve!");
      return;
    }
    setActiveSection(section);
  };

  return (
    <PainelInterface
      user={user}
      weeklyProgress={weeklyProgress}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      
    >
      <StartTimerButton />
    </PainelInterface>
  );
}