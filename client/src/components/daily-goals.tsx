
import { Target, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DailyGoals() {
  const handleAddGoal = () => {
    alert("Adicionar nova meta - Em desenvolvimento");
  };

  return (
    <section className="mb-8 relative">
      <div className="relative">
        {/* Ícone de alvo no topo do card */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)', borderColor: 'rgba(0, 5, 21, 0.73)' }}>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Target className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl pt-6" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleAddGoal}
          data-testid="daily-goals-card"
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 min-h-[120px]">
              <Button
                variant="ghost"
                className="flex flex-col items-center space-y-3 hover:bg-primary/10 transition-colors p-6"
                onClick={handleAddGoal}
                data-testid="button-add-goal"
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-primary" />
                </div>
                <span className="text-lg text-muted-foreground text-center font-medium">
                  Adicione suas próprias metas!
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
