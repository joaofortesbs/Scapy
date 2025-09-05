import { useState } from "react";
import Header from "@/components/header";
import Timer from "@/components/timer";
import WeeklyTracker from "@/components/weekly-tracker";
import AIAssistant from "@/components/ai-assistant";
import DailyGoals from "@/components/daily-goals";
import PanicButton from "@/components/panic-button";
import BottomNavigation from "@/components/bottom-navigation";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";

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
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <ShootingStars />
      <StarsBackground />
      <div className="relative z-10">
        <Header />
      
      <main className="flex-1 px-4 pb-20 space-y-6">
        <div className="space-y-4">
          <WeeklyTracker weeklyProgress={weeklyProgress} />
          
          <section className="text-center">
            <div className="floating-avatar mb-6">
              <img 
                src="/caveman-avatar.png" 
                alt="Avatar Caveman" 
                className="w-60 h-60 object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=caveman&backgroundColor=000515";
                }}
                data-testid="avatar-image"
              />
            </div>

            <Timer user={user} />
          </section>
        </div>

        <AIAssistant />
        
        <DailyGoals />
      </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50" style={{ backgroundColor: '#000515' }}>
        <PanicButton />
        <BottomNavigation 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
    </div>
  );
}
