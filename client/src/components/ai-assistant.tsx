import { Sparkles, Frown, Meh, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AIAssistant() {
  const moodOptions = [
    { id: 'medo', label: 'Medo', icon: Frown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'estavel', label: 'Estável', icon: Meh, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'feliz', label: 'Feliz', icon: Smile, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
  ];

  const handleMoodSelect = (mood: string) => {
    alert(`Você selecionou: ${mood}`);
  };

  return (
    <section className="mb-8">
      <Card className="bg-secondary/30 border-border mb-3">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">Como você está se sentindo hoje?</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2">
        {moodOptions.map(({ id, label, icon: Icon, color }) => (
          <Button
            key={id}
            variant="outline"
            className={`flex-1 h-12 border ${color} hover:opacity-80 transition-opacity`}
            onClick={() => handleMoodSelect(label)}
            data-testid={`mood-${id}`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          </Button>
        ))}
      </div>
    </section>
  );
}