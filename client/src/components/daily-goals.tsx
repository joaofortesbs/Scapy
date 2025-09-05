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
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        <Card className="bg-secondary/30 border-border pt-6 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 min-h-[100px]">
              <Button
                variant="ghost"
                className="flex flex-col items-center space-y-2 hover:bg-primary/10 transition-colors p-4"
                onClick={handleAddGoal}
                data-testid="button-add-goal"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground text-center">
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