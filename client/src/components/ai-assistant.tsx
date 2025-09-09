import { Sparkles, Frown, Meh, Smile, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  fullName: string;
}

export default function AIAssistant() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const moodOptions = [
    { id: 'medo', label: 'Medo', icon: Frown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'estavel', label: 'Estável', icon: Meh, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'feliz', label: 'Feliz', icon: Smile, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
  ];

  // Carregar dados do usuário
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Verificar se já selecionou humor hoje
        checkTodayMood(userData.id);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  const checkTodayMood = async (userId: number) => {
    try {
      const response = await apiRequest('GET', `/api/today-mood/${userId}`);
      const data = await response.json();
      if (data) {
        setTodayMood(data.mood);
      }
    } catch (error) {
      console.error('Erro ao verificar humor de hoje:', error);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (isGenerating) return; // Evitar cliques duplos

    setIsGenerating(true);
    setSelectedMood(mood);

    try {
      console.log(`🎯 Selecionando humor: ${mood} para usuário ${user.id}`);

      // 1. Registrar seleção de humor
      await apiRequest('POST', '/api/mood-selection', {
        userId: user.id.toString(),
        mood: mood.toLowerCase()
      });

      console.log(`💭 Humor registrado com sucesso`);

      // 2. Gerar sugestões personalizadas
      toast({
        title: "Analisando seu perfil...",
        description: "Nossa IA está criando atividades personalizadas para você!",
      });

      const suggestionResponse = await apiRequest('POST', '/api/generate-suggestions', {
        userId: user.id.toString(),
        mood: mood.toLowerCase()
      });

      const suggestionData = await suggestionResponse.json();
      
      console.log(`✅ Sugestões geradas:`, suggestionData);

      // 3. Mostrar sucesso
      setTodayMood(mood.toLowerCase());
      
      toast({
        title: "Sugestões criadas!",
        description: `${suggestionData.tasks.length} atividades personalizadas foram adicionadas às suas metas do dia!`,
      });

      // 4. Disparar eventos para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      window.dispatchEvent(new CustomEvent('moodUpdated'));
      
      console.log(`🔔 Eventos disparados: tasksUpdated e moodUpdated`);

    } catch (error) {
      console.error('Erro ao processar seleção de humor:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setSelectedMood(null);
    }
  };

  return (
    <section className="mb-8">
      <Card className="border-border mb-3 rounded-full ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-center space-x-3">
            {isGenerating ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : todayMood ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <Sparkles className="w-6 h-6 text-primary" />
            )}
            <span className="text-base text-foreground font-medium">
              {isGenerating 
                ? "Gerando suas atividades personalizadas..." 
                : todayMood 
                ? "Suas atividades do dia foram criadas!"
                : "Como você está se sentindo hoje?"
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2">
        {moodOptions.map(({ id, label, icon: Icon, color }) => {
          const isSelected = todayMood === id;
          const isCurrentlySelecting = selectedMood === label && isGenerating;
          
          return (
            <Button
              key={id}
              variant="outline"
              disabled={isGenerating || todayMood !== null}
              className={`flex-1 h-12 border ${color} hover:opacity-80 transition-all duration-300 rounded-full ${
                isSelected ? 'opacity-100 ring-2 ring-primary' : ''
              } ${isCurrentlySelecting ? 'animate-pulse' : ''}`}
              style={{ opacity: isSelected ? 1 : todayMood ? 0.3 : 0.73 }}
              onClick={() => handleMoodSelect(label)}
              data-testid={`mood-${id}`}
            >
              <div className="flex items-center space-x-2">
                {isCurrentlySelecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSelected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Button>
          );
        })}
      </div>

      {todayMood && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Verifique suas "Metas do Dia" para ver as atividades geradas para você!
          </p>
        </div>
      )}
    </section>
  );
}