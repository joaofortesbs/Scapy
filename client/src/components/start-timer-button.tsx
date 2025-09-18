
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { TimerPersistence } from "@/lib/timer-persistence";
import { toast } from "@/hooks/use-toast";

interface StartTimerButtonProps {
  userId: string;
  onTimerStarted?: (startDate: string) => void;
  disabled?: boolean;
}

export default function StartTimerButton({ userId, onTimerStarted, disabled }: StartTimerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTimer = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    console.log(`🚀 [StartTimerButton] Iniciando cronômetro para usuário ${userId}`);

    try {
      // 1. Chamar API para iniciar cronômetro no servidor
      const response = await AuthService.authenticatedFetch('/api/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [StartTimerButton] Erro na resposta da API:', errorData);
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [StartTimerButton] Resposta da API:', data);

      if (data.timerStarted && data.startDate) {
        // 2. Salvar no localStorage usando TimerPersistence
        const saved = TimerPersistence.saveTimer(userId, data.startDate);
        
        if (saved) {
          console.log(`💾 [StartTimerButton] Cronômetro salvo localmente: ${data.startDate}`);
          
          // 3. Disparar evento para atualizar componentes
          window.dispatchEvent(new CustomEvent('timerStarted', {
            detail: {
              userId: userId,
              startDate: data.startDate,
              source: 'start-button'
            }
          }));

          // 4. Callback para componente pai
          if (onTimerStarted) {
            onTimerStarted(data.startDate);
          }

          // 5. Feedback visual
          toast({
            title: "🚀 Cronômetro Iniciado!",
            description: "Sua jornada rumo à liberdade começou agora!",
          });

          console.log(`✅ [StartTimerButton] Cronômetro iniciado com sucesso para usuário ${userId}`);
        } else {
          throw new Error('Erro ao salvar cronômetro localmente');
        }
      } else {
        throw new Error('Dados inválidos retornados pela API');
      }

    } catch (error) {
      console.error('❌ [StartTimerButton] Erro ao iniciar cronômetro:', error);
      
      let errorMessage = "Erro de conexão. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Token')) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error.message.includes('400')) {
          errorMessage = "Você já possui um cronômetro ativo.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro ao iniciar cronômetro",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Se erro de autenticação, redirecionar para login
      if (errorMessage.includes('Sessão expirada')) {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartTimer}
      disabled={disabled || isLoading}
      size="lg"
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Iniciando...
        </>
      ) : (
        <>
          <Rocket className="mr-2 h-5 w-5" />
          🚀 INICIAR CRONÔMETRO
        </>
      )}
    </Button>
  );
}
