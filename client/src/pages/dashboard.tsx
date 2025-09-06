import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import { DailyGoals } from "@/components/daily-goals";
import { PanicButton } from "@/components/panic-button";
import { ParticlesBackground } from "@/components/particles-background";
import { SupabaseUsers } from "@/components/supabase-users";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("painel");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

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
      <div className="space-y-6">
            <DailyGoals />
            <PanicButton />
            <SupabaseUsers />
          </div>
    </PainelInterface>
  );
}