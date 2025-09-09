
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Target } from 'lucide-react';

interface SuperandoGatilhosProps {
  userId?: string;
}

export default function SuperandoGatilhos({ userId }: SuperandoGatilhosProps) {
  const [gatilho, setGatilho] = useState<string>('');
  const [superouHoje, setSuperouHoje] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Buscar o gatilho do usuário do Quiz de Personalização
  useEffect(() => {
    const fetchGatilho = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/quiz/${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.quiz && data.quiz.gatilhos) {
            setGatilho(data.quiz.gatilhos);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar gatilho:', error);
      }
      setLoading(false);
    };

    fetchGatilho();
  }, [userId]);

  // Verificar se já superou hoje (usando localStorage para persistência local)
  useEffect(() => {
    const hoje = new Date().toDateString();
    const chave = `superou_gatilho_${hoje}_${userId}`;
    const superouHoje = localStorage.getItem(chave) === 'true';
    setSuperouHoje(superouHoje);
  }, [userId]);

  const handleToggleSuperar = () => {
    const hoje = new Date().toDateString();
    const chave = `superou_gatilho_${hoje}_${userId}`;
    const novoStatus = !superouHoje;
    
    setSuperouHoje(novoStatus);
    localStorage.setItem(chave, novoStatus.toString());
  };

  if (loading) {
    return (
      <Card className="border-border rounded-2xl ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gatilho) {
    return null; // Não mostrar se não há gatilho definido
  }

  return (
    <Card className="border-border rounded-2xl ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
      <CardContent className="p-6 space-y-4">
        {/* Header do Card */}
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Superando Gatilhos
          </h3>
        </div>

        {/* Conteúdo do Gatilho */}
        <div className="space-y-4">
          <div className="text-left">
            <p className="text-sm text-muted-foreground mb-2">
              Seu principal gatilho identificado:
            </p>
            <p className="text-base text-foreground font-medium">
              {gatilho}
            </p>
          </div>

          {/* Checkbox para marcar se superou hoje */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Consegui superar este gatilho hoje
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <button
              onClick={handleToggleSuperar}
              className="ml-4 transition-all duration-200 hover:scale-110"
            >
              {superouHoje ? (
                <CheckCircle className="w-8 h-8 text-primary" />
              ) : (
                <Circle className="w-8 h-8 text-muted-foreground hover:text-primary" />
              )}
            </button>
          </div>

          {/* Mensagem de encorajamento */}
          {superouHoje && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 text-center font-medium">
                🎉 Parabéns! Você está no controle hoje!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
