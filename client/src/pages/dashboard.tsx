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
      
      <main className="flex-1 px-4 pb-20 space-y-8">
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

        <AIAssistant />
        
        <DailyGoals />

        <section className="space-y-4">
          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <i className="fas fa-chart-line text-primary mr-2"></i>
                Progresso Semanal
              </h3>
              <div className="text-2xl font-bold text-primary">
                {weeklyProgress?.dayCompleted.filter(Boolean).length || 0}/7 dias
              </div>
              <div className="text-sm text-muted-foreground">Meta desta semana</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <i className="fas fa-fire text-primary mr-2"></i>
                Sequência Atual
              </h3>
              <div className="text-2xl font-bold text-primary">
                {weeklyProgress?.currentStreak || 0} dias
              </div>
              <div className="text-sm text-muted-foreground">
                Seu recorde: {weeklyProgress?.bestStreak || 0} dias
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <i className="fas fa-trophy text-primary mr-2"></i>
                Conquistas
              </h3>
              <div className="text-sm text-muted-foreground">
                Próxima conquista em {Math.max(0, 30 - (weeklyProgress?.currentStreak || 0))} dias
              </div>
            </CardContent>
          </Card>
        </section>
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
