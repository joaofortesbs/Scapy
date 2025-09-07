import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Mountain, Trees } from "lucide-react";

interface QuizPersonalizacaoProps {
  user?: any;
  onCompleteQuiz: () => void;
}

export default function QuizPersonalizacao({ user, onCompleteQuiz }: QuizPersonalizacaoProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Completar quiz e redirecionar para o painel principal
      onCompleteQuiz();
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <div className="relative z-10 flex-1 px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <QuizEtapa1 key="step1" onNext={handleNextStep} />
          )}
          {currentStep === 2 && (
            <QuizEtapa2 key="step2" onNext={handleNextStep} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Etapa 1: Estatísticas sobre pornografia
function QuizEtapa1({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center h-full justify-center space-y-8"
    >
      {/* Título principal */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-lg font-medium text-muted-foreground leading-relaxed px-4"
      >
        Um app envolvente e feito com uma abordagem baseada na ciência para derrotar o vício na pornografia para sempre.
      </motion.h1>

      {/* Estatística principal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-2"
      >
        <div className="text-6xl font-bold text-primary">
          7 bilhões de horas
        </div>
        <p className="text-lg text-muted-foreground">
          são desperdiçadas todos os anos assistindo pornografia somente no Brasil!
        </p>
      </motion.div>

      {/* Lista de comparações */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-4 w-full max-w-sm"
      >
        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">
            Tempo suficiente para construir 700.000 Cristos Redentores
          </span>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <Trees className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">
            Tempo suficiente para explorar a floresta amazônica inteira 800.000 vezes!
          </span>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <Mountain className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">
            Tempo suficiente para escalar o monte Pão de Açúcar 3.5 bilhões de vezes!
          </span>
        </div>
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onNext}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 hover:from-primary/30 hover:to-primary/20 transition-all duration-300 text-primary font-semibold text-lg"
          data-testid="continue-step1-button"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 2: Comunidade de soldados
function QuizEtapa2({ onNext }: { onNext: () => void }) {
  const [counter, setCounter] = useState(317);

  // Animação do contador crescente
  useState(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 2000);

    return () => clearInterval(interval);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center h-full justify-center space-y-8"
    >
      {/* Títulos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Você não está sozinho!
        </h1>
        <h2 className="text-lg text-muted-foreground">
          Encontros diários com a comunidade de soldados.
        </h2>
      </motion.div>

      {/* Card 3D flutuante */}
      <motion.div
        initial={{ opacity: 0, rotateY: -15, x: -20 }}
        animate={{ opacity: 1, rotateY: -5, x: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="w-full max-w-sm"
        style={{
          transform: "perspective(1000px) rotateY(-5deg)",
          transformStyle: "preserve-3d"
        }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          
          <CardContent className="p-6 space-y-6 relative z-10">
            {/* Título com contador */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Só hoje já salvamos{' '}
                <motion.span 
                  key={counter}
                  initial={{ scale: 1.2, color: "#00F6FF" }}
                  animate={{ scale: 1, color: "inherit" }}
                  transition={{ duration: 0.3 }}
                  className="text-primary font-bold"
                >
                  {counter}
                </motion.span>
                {' '}pessoas do vício maldito.
              </h3>
            </div>

            {/* Círculos para futuras imagens */}
            <div className="flex justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + (index * 0.1), duration: 0.4 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center"
                  data-testid={`profile-circle-${index}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onNext}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 hover:from-primary/30 hover:to-primary/20 transition-all duration-300 text-primary font-semibold text-lg"
          data-testid="continue-step2-button"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}