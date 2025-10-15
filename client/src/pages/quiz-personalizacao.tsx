import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Mountain, Trees } from "lucide-react";
import ParticlesBackground from "@/components/particles-background";

interface QuizPersonalizacaoProps {
  user?: any;
  onCompleteQuiz: () => void;
}

export default function QuizPersonalizacao({ user, onCompleteQuiz }: QuizPersonalizacaoProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState({
    gender: '',
    frequency: '',
    motivation: '',
    triggers: '',
    religion: ''
  });
  const [, setLocation] = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar quiz no carregamento
  useEffect(() => {
    if (user && !isInitialized) {
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const saveQuizData = async () => {
    if (!user || !user.id) {
      console.error('❌ Erro: ID do usuário não encontrado');
      return;
    }

    try {
      console.log('📝 Salvando dados do quiz para usuário:', user.id);
      console.log('📋 Dados do quiz:', quizData);

      const response = await fetch(`/api/usuarios/${user.id}/quiz`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genero: quizData.gender,
          frequencia: quizData.frequency,
          motivacao: quizData.motivation,
          gatilhos: quizData.triggers,
          religiao: quizData.religion,
          quizCompleted: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Quiz salvo com sucesso:', data);
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao salvar quiz:', errorData);
      }
    } catch (error) {
      console.error('❌ Erro de conexão ao salvar quiz:', error);
    }
  };

  const handleNextStep = async () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // Salvar quiz completo no banco antes de redirecionar
      await saveQuizData();
      
      // Atualizar localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.quizCompleted = true;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Completar quiz e redirecionar para o painel principal
      onCompleteQuiz();
      setLocation('/dashboard');
    }
  };

  const handleOptionSelect = (field: keyof typeof quizData, value: string) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const getProgressPercentage = () => {
    return ((currentStep - 1) / 6) * 100; // 7 etapas total, então dividir por 6
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      {/* Fundo com partículas igual ao painel */}
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      
      <div className="relative z-10 flex-1 px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <QuizEtapa1 key="step1" onNext={handleNextStep} />
          )}
          {currentStep === 2 && (
            <QuizEtapa2 key="step2" onNext={handleNextStep} />
          )}
          {currentStep === 3 && (
            <QuizEtapa3 
              key="step3" 
              onNext={handleNextStep} 
              selectedValue={quizData.gender}
              onSelect={(value) => handleOptionSelect('gender', value)}
              progress={getProgressPercentage()}
            />
          )}
          {currentStep === 4 && (
            <QuizEtapa4 
              key="step4" 
              onNext={handleNextStep} 
              selectedValue={quizData.frequency}
              onSelect={(value) => handleOptionSelect('frequency', value)}
              progress={getProgressPercentage()}
            />
          )}
          {currentStep === 5 && (
            <QuizEtapa5 
              key="step5" 
              onNext={handleNextStep} 
              selectedValue={quizData.motivation}
              onSelect={(value) => handleOptionSelect('motivation', value)}
              progress={getProgressPercentage()}
            />
          )}
          {currentStep === 6 && (
            <QuizEtapa6 
              key="step6" 
              onNext={handleNextStep} 
              selectedValue={quizData.triggers}
              onSelect={(value) => handleOptionSelect('triggers', value)}
              progress={getProgressPercentage()}
            />
          )}
          {currentStep === 7 && (
            <QuizEtapa7 
              key="step7" 
              onNext={handleNextStep} 
              selectedValue={quizData.religion}
              onSelect={(value) => handleOptionSelect('religion', value)}
              progress={getProgressPercentage()}
            />
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
      className="flex flex-col h-full justify-center space-y-8"
    >
      {/* Título principal - alinhado à esquerda */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left space-y-2"
      >
        <div className="flex items-baseline space-x-2">
          <span className="text-6xl font-bold text-primary">7</span>
          <span className="text-2xl text-primary">bilhões de horas</span>
        </div>
        <p className="text-lg text-muted-foreground text-left">
          são desperdiçadas todos os anos assistindo pornografia somente no Brasil!
        </p>
      </motion.div>

      {/* Lista de comparações - alinhadas à esquerda */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-4 w-full"
      >
        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground text-left">
            Tempo suficiente para construir 700.000 Cristos Redentores
          </span>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <Trees className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground text-left">
            Tempo suficiente para explorar a floresta amazônica inteira 800.000 vezes!
          </span>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
          <Mountain className="w-6 h-6 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground text-left">
            Tempo suficiente para escalar o monte Pão de Açúcar 3.5 bilhões de vezes!
          </span>
        </div>
      </motion.div>

      {/* Botão Continue - estilo AI Assistant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step1-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 2: Comunidade de soldados
function QuizEtapa2({ onNext }: { onNext: () => void }) {
  const [counter, setCounter] = useState(3773);
  const [subtitleCounter, setSubtitleCounter] = useState(317);

  // Animação sincronizada dos contadores
  useState(() => {
    const synchronizedInterval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3) + 1);
      setSubtitleCounter(prev => prev + Math.floor(Math.random() * 2) + 1);
    }, 2000);

    return () => {
      clearInterval(synchronizedInterval);
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-center space-y-8"
    >
      {/* Títulos - alinhados à esquerda */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="space-y-3 text-left"
      >
        <h1 className="text-3xl font-bold text-foreground">
          Você não está sozinho!
        </h1>
        <h2 className="text-lg text-muted-foreground">
          Encontros diários com a comunidade de soldados.
        </h2>
      </motion.div>

      {/* Card 3D flutuante - 47° virado para esquerda e maior altura */}
      <motion.div
        initial={{ opacity: 0, rotateY: -47, x: -20 }}
        animate={{ opacity: 1, rotateY: -47, x: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="w-full"
        style={{
          transform: "perspective(1000px) rotateY(-47deg)",
          transformStyle: "preserve-3d"
        }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-2xl relative overflow-hidden h-80">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          
          <CardContent className="p-6 space-y-4 relative z-10 h-full flex flex-col justify-between">
            {/* Emoji e título */}
            <div className="space-y-3 text-left">
              <div className="text-2xl">🫡</div>
              <h3 className="text-lg font-semibold text-foreground">
                Só hoje já salvamos{' '}
                <motion.span 
                  key={subtitleCounter}
                  initial={{ scale: 1.2, color: "#00F6FF" }}
                  animate={{ scale: 1, color: "#00F6FF" }}
                  transition={{ duration: 0.3 }}
                  className="text-primary font-bold"
                >
                  {subtitleCounter}
                </motion.span>
                {' '}pessoas do vício maldito.
              </h3>
            </div>

            {/* Contador crescente - maior e alinhado à esquerda */}
            <div className="text-left space-y-2">
              <motion.span 
                key={counter}
                initial={{ scale: 1.2, color: "#00F6FF" }}
                animate={{ scale: 1, color: "#00F6FF" }}
                transition={{ duration: 0.3 }}
                className="text-6xl font-bold text-primary block"
              >
                {counter.toLocaleString()}
              </motion.span>
              <p className="text-sm text-muted-foreground">
                soldados salvos no total!
              </p>
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

      {/* Botão Continue - estilo AI Assistant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step2-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 3: Seleção de gênero
function QuizEtapa3({ 
  onNext, 
  selectedValue, 
  onSelect, 
  progress 
}: { 
  onNext: () => void; 
  selectedValue: string; 
  onSelect: (value: string) => void;
  progress: number;
}) {
  const options = ['Homem', 'Mulher', 'Outro'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-start space-y-8 pt-8"
    >
      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Qual é o seu gênero?
        </h1>
      </motion.div>

      {/* Opções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-3 flex-1"
      >
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
              selectedValue === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-primary/50'
            }`}
            data-testid={`option-${option.toLowerCase()}`}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          disabled={!selectedValue}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border disabled:opacity-50"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step3-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 4: Frequência de consumo
function QuizEtapa4({ 
  onNext, 
  selectedValue, 
  onSelect, 
  progress 
}: { 
  onNext: () => void; 
  selectedValue: string; 
  onSelect: (value: string) => void;
  progress: number;
}) {
  const options = [
    '+3 vezes por dia',
    '2 vezes por dia', 
    '1 vez por dia',
    'Algumas vezes por semana',
    'Menos de uma vez por semana'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-start space-y-8 pt-8"
    >
      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Com que frequência você assiste pornografia?
        </h1>
      </motion.div>

      {/* Opções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-3 flex-1"
      >
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
              selectedValue === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-primary/50'
            }`}
            data-testid={`option-${index}`}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          disabled={!selectedValue}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border disabled:opacity-50"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step4-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 5: Motivação para parar
function QuizEtapa5({ 
  onNext, 
  selectedValue, 
  onSelect, 
  progress 
}: { 
  onNext: () => void; 
  selectedValue: string; 
  onSelect: (value: string) => void;
  progress: number;
}) {
  const options = [
    'Retomar o controle da minha vida',
    'Melhorar relacionamentos',
    'Ter mais foco',
    'Aumentar minha clareza mental',
    'Me aproximar de Deus'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-start space-y-8 pt-8"
    >
      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Qual é a sua maior motivação para parar com a pornografia ou masturbação?
        </h1>
      </motion.div>

      {/* Opções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-3 flex-1"
      >
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
              selectedValue === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-primary/50'
            }`}
            data-testid={`option-${index}`}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          disabled={!selectedValue}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border disabled:opacity-50"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step5-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 6: Gatilhos e situações
function QuizEtapa6({ 
  onNext, 
  selectedValue, 
  onSelect, 
  progress 
}: { 
  onNext: () => void; 
  selectedValue: string; 
  onSelect: (value: string) => void;
  progress: number;
}) {
  const options = [
    'Dentro ou depois das redes sociais',
    'Na escola ou faculdade ou trabalho',
    'Quando estou no tédio',
    'Juntos com meus amigos (a)',
    'Existe uma pessoa específica'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-start space-y-8 pt-8"
    >
      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Aonde acontece a maioria dos seus gatilhos ou motivos?
        </h1>
      </motion.div>

      {/* Opções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-3 flex-1"
      >
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
              selectedValue === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-primary/50'
            }`}
            data-testid={`option-${index}`}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          disabled={!selectedValue}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border disabled:opacity-50"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step6-button"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// Etapa 7: Religião e crenças
function QuizEtapa7({ 
  onNext, 
  selectedValue, 
  onSelect, 
  progress 
}: { 
  onNext: () => void; 
  selectedValue: string; 
  onSelect: (value: string) => void;
  progress: number;
}) {
  const options = [
    'Cristão',
    'Muçumano',
    'Espírita',
    'Umbanda',
    'Outra',
    'Não tenho'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full justify-start space-y-8 pt-8"
    >
      {/* Barra de progresso */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Progress value={100} className="h-2" />
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-left"
      >
        <h1 className="text-2xl font-bold text-foreground">
          Qual é a sua religião ou crença?
        </h1>
      </motion.div>

      {/* Opções */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="space-y-3 flex-1"
      >
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
            onClick={() => onSelect(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
              selectedValue === option
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:border-primary/50'
            }`}
            data-testid={`option-${index}`}
          >
            {option}
          </motion.button>
        ))}
      </motion.div>

      {/* Botão Continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="w-full"
      >
        <button
          onClick={onNext}
          disabled={!selectedValue}
          className="w-full h-16 rounded-full ai-assistant-card-natural-3d text-primary font-semibold text-lg border-border disabled:opacity-50"
          style={{ backgroundColor: '#000515' }}
          data-testid="continue-step7-button"
        >
          Finalizar
        </button>
      </motion.div>
    </motion.div>
  );
}