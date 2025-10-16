import { GoogleGenAI } from "@google/genai";
import type { 
  MoodSelection, 
  QuizContextualizacao, 
  UserObjective, 
  DailyTask, 
  InsertDailyTask 
} from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY
});

interface UserProfileData {
  mood: string;
  motivation?: string;
  objectives: UserObjective[];
  previousTasks?: DailyTask[];
}

interface ActivitySuggestion {
  titulo: string;
  descricao: string;
  categoria: 'meditacao' | 'exercicio' | 'hobby' | 'social' | 'produtividade' | 'autocuidado';
  prioridade: 1 | 2 | 3 | 4 | 5;
  duracaoEstimada: string;
}

interface AISuggestionResponse {
  activities: ActivitySuggestion[];
  message: string;
  reasoning: string;
}

export class AIProcessor {
  constructor() {}

  /**
   * Gera sugestões de atividades personalizadas com base no perfil do usuário
   */
  async generatePersonalizedSuggestions(userProfile: UserProfileData): Promise<AISuggestionResponse> {
    // Verificar se a chave da API está configurada
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.warn(`⚠️ GEMINI_API_KEY não configurada, usando sugestões padrão`);
      return this.getFallbackSuggestions(userProfile.mood);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(userProfile);

      console.log(`🤖 Gerando sugestões para usuário com humor: ${userProfile.mood}`);

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    categoria: { 
                      type: "string",
                      enum: ["meditacao", "exercicio", "hobby", "social", "produtividade", "autocuidado"]
                    },
                    prioridade: { 
                      type: "integer",
                      minimum: 1,
                      maximum: 5
                    },
                    duracaoEstimada: { type: "string" }
                  },
                  required: ["titulo", "descricao", "categoria", "prioridade", "duracaoEstimada"]
                }
              },
              message: { type: "string" },
              reasoning: { type: "string" }
            },
            required: ["activities", "message", "reasoning"]
          }
        },
        contents: userPrompt
      });

      const rawJson = response.text;
      console.log(`🎯 Resposta bruta da IA: ${rawJson?.substring(0, 200)}...`);

      if (rawJson) {
        const data: AISuggestionResponse = JSON.parse(rawJson);
        console.log(`✅ Sugestões geradas: ${data.activities.length} atividades`);
        return data;
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (error) {
      console.error(`❌ Erro ao gerar sugestões com Gemini API:`, error);
      console.log(`🔄 Usando sugestões padrão como fallback`);
      return this.getFallbackSuggestions(userProfile.mood);
    }
  }

  /**
   * Constrói o prompt do sistema para o Gemini
   */
  private buildSystemPrompt(): string {
    return `Você é um assistente especializado em recuperação de vícios e desenvolvimento pessoal.

Seu objetivo é analisar o estado emocional e os objetivos de um usuário em jornada de recuperação de pornografia/masturbação, e sugerir atividades práticas e eficazes.

CONTEXTO IMPORTANTE:
- O usuário está em processo de recuperação do vício em pornografia/masturbação
- Diferentes estados emocionais requerem diferentes tipos de atividades
- As sugestões devem ser progressivas e alinhadas com os objetivos pessoais do usuário

DIRETRIZES POR ESTADO EMOCIONAL:

MEDO (vulnerabilidade alta):
- Priorize atividades de distração imediata e ocupação mental
- Foque em exercícios de mindfulness e respiração
- Sugira atividades sociais ou de contato com outros
- Evite momentos de ociosidade
- Prioridade: 4-5 (alta urgência)

ESTÁVEL (estado neutro):
- Equilibre atividades de manutenção e crescimento
- Inclua exercícios físicos regulares
- Sugira hobbies construtivos
- Atividades de autocuidado
- Prioridade: 2-3 (moderada)

FELIZ (estado positivo):
- Aproveite o momentum para atividades desafiadoras
- Foque em objetivos de longo prazo
- Sugira atividades sociais e de conexão
- Projetos criativos e produtivos
- Prioridade: 1-3 (variada)

CATEGORIAS DE ATIVIDADES:
- meditacao: Mindfulness, respiração, relaxamento
- exercicio: Atividade física, esportes, caminhada
- hobby: Atividades criativas, leitura, música
- social: Interação com outros, comunidade
- produtividade: Trabalho, estudos, organização
- autocuidado: Higiene, alimentação, descanso

REGRAS:
1. Sempre sugira 3-6 atividades variadas
2. Considere a motivação principal do usuário
3. Inclua pelo menos uma atividade de cada categoria relevante
4. Seja específico nas descrições
5. Ajuste a intensidade baseada no humor
6. Use linguagem motivadora e compreensiva
7. As atividades devem ser realizáveis no mesmo dia`;
  }

  /**
   * Constrói o prompt específico do usuário
   */
  private buildUserPrompt(userProfile: UserProfileData): string {
    const moodDescription = this.getMoodDescription(userProfile.mood);
    const objectivesText = userProfile.objectives.length > 0 
      ? userProfile.objectives.map(obj => `- ${obj.texto}`).join('\n')
      : 'Nenhum objetivo específico definido';

    return `PERFIL DO USUÁRIO:

Estado emocional hoje: ${userProfile.mood.toUpperCase()}
${moodDescription}

Motivação principal: ${userProfile.motivation || 'Não especificada'}

Objetivos pessoais:
${objectivesText}

${userProfile.previousTasks && userProfile.previousTasks.length > 0 ? `
Atividades recentes realizadas:
${userProfile.previousTasks.map(task => `- ${task.titulo} (${task.concluida ? 'Concluída' : 'Pendente'})`).join('\n')}
` : ''}

Por favor, analise este perfil e sugira atividades específicas e práticas que ajudem este usuário hoje. 

Considere:
1. O estado emocional atual e suas necessidades específicas
2. Como as atividades podem se alinhar com os objetivos pessoais
3. A progressão gradual na jornada de recuperação
4. A importância de manter a mente ocupada e focada

Forneça sugestões variadas, práticas e motivadoras.`;
  }

  /**
   * Retorna descrição detalhada do humor
   */
  private getMoodDescription(mood: string): string {
    switch (mood.toLowerCase()) {
      case 'medo':
        return 'O usuário está se sentindo vulnerável e com receio de não conseguir resistir ao vício hoje. Precisa de atividades que ocupem a mente e fortaleçam a determinação.';
      case 'estavel':
        return 'O usuário está em um estado emocional equilibrado, nem muito vulnerável nem muito eufórico. É um bom momento para atividades de manutenção e crescimento gradual.';
      case 'feliz':
        return 'O usuário está se sentindo positivo e confiante hoje. É uma oportunidade para aproveitar essa energia para atividades mais desafiadoras e construtivas.';
      default:
        return 'Estado emocional não identificado claramente.';
    }
  }

  /**
   * Retorna sugestões padrão em caso de erro
   */
  private getFallbackSuggestions(mood: string): AISuggestionResponse {
    const moodNormalized = mood.toLowerCase();
    
    let suggestions: ActivitySuggestion[] = [];
    let message = "";
    let reasoning = "";

    if (moodNormalized === 'medo') {
      suggestions = [
        {
          titulo: "Respiração 4-7-8 para controle da ansiedade",
          descricao: "Inspire por 4 segundos, segure por 7, expire por 8. Repita 5 vezes para acalmar o sistema nervoso",
          categoria: "meditacao",
          prioridade: 5 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "10 minutos"
        },
        {
          titulo: "Exercício físico intenso",
          descricao: "Faça 20 minutos de exercício intenso (corrida, burpees, polichinelos) para liberar endorfina",
          categoria: "exercicio",
          prioridade: 5 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "20 minutos"
        },
        {
          titulo: "Ligue para um amigo ou familiar",
          descricao: "Conecte-se com alguém de confiança para conversar e se distrair",
          categoria: "social",
          prioridade: 4 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "15 minutos"
        },
        {
          titulo: "Banho gelado de 2 minutos",
          descricao: "Tome um banho frio para resetar o sistema nervoso e aumentar a força de vontade",
          categoria: "autocuidado",
          prioridade: 4 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "5 minutos"
        }
      ];
      message = "Você está passando por um momento difícil, mas tem força para superar! Estas atividades vão ajudar agora.";
      reasoning = "Em momentos de vulnerabilidade, priorize atividades que ocupem a mente e fortaleçam seu controle.";
    } else if (moodNormalized === 'estavel') {
      suggestions = [
        {
          titulo: "Meditação guiada de 15 minutos",
          descricao: "Use um app como Headspace ou Calm para uma sessão de mindfulness",
          categoria: "meditacao",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "15 minutos"
        },
        {
          titulo: "Organizar ambiente de trabalho",
          descricao: "Limpe e organize sua mesa ou espaço de estudo para aumentar a produtividade",
          categoria: "produtividade",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "30 minutos"
        },
        {
          titulo: "Ler 20 páginas de um livro",
          descricao: "Escolha um livro de ficção ou não-ficção que te interesse e dedique tempo à leitura",
          categoria: "hobby",
          prioridade: 2 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "30 minutos"
        },
        {
          titulo: "Preparar uma refeição saudável",
          descricao: "Cozinhe algo nutritivo e saboroso, focando no processo de preparação",
          categoria: "autocuidado",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "45 minutos"
        }
      ];
      message = "Você está equilibrado hoje! Aproveite para fortalecer hábitos saudáveis e crescer.";
      reasoning = "Estado neutro é ideal para manutenção de rotinas e pequenos avanços progressivos.";
    } else if (moodNormalized === 'feliz') {
      suggestions = [
        {
          titulo: "Definir meta desafiadora para a semana",
          descricao: "Aproveite sua energia positiva para estabelecer um objetivo ambicioso e criar plano de ação",
          categoria: "produtividade",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "30 minutos"
        },
        {
          titulo: "Atividade social ou voluntariado",
          descricao: "Compartilhe sua energia positiva ajudando outros ou interagindo com amigos",
          categoria: "social",
          prioridade: 2 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "1-2 horas"
        },
        {
          titulo: "Aprender algo novo",
          descricao: "Comece um curso online, aprenda uma habilidade ou explore um hobby novo",
          categoria: "hobby",
          prioridade: 2 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "1 hora"
        },
        {
          titulo: "Exercício ao ar livre",
          descricao: "Pratique um esporte, trilha ou atividade física que você goste em ambiente aberto",
          categoria: "exercicio",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "45 minutos"
        }
      ];
      message = "Que ótimo estar se sentindo bem! Use essa energia para avançar em seus objetivos.";
      reasoning = "Momentos positivos são ideais para desafios maiores e construção de momentum.";
    } else {
      // Default fallback
      suggestions = [
        {
          titulo: "Exercício de respiração profunda",
          descricao: "Pratique 10 minutos de respiração consciente para acalmar a mente",
          categoria: "meditacao",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "10 minutos"
        },
        {
          titulo: "Caminhada ao ar livre",
          descricao: "Faça uma caminhada de 20-30 minutos para oxigenar o corpo e clarear a mente",
          categoria: "exercicio",
          prioridade: 3 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "30 minutos"
        },
        {
          titulo: "Leitura de desenvolvimento pessoal",
          descricao: "Leia um capítulo de um livro motivacional ou de autoajuda",
          categoria: "hobby",
          prioridade: 2 as 1 | 2 | 3 | 4 | 5,
          duracaoEstimada: "20 minutos"
        }
      ];
      message = "Estas são algumas atividades que podem te ajudar hoje. Lembre-se: cada passo conta na sua jornada!";
      reasoning = "Sugestões padrão fornecidas, mas ainda assim relevantes para sua recuperação.";
    }

    return {
      activities: suggestions,
      message: message,
      reasoning: reasoning
    };
  }

  /**
   * Converte sugestões da IA para formato de tarefas do banco
   */
  convertToTasks(suggestions: ActivitySuggestion[], userId: string, suggestionId?: string): InsertDailyTask[] {
    return suggestions.map(suggestion => ({
      userId,
      suggestionId,
      titulo: suggestion.titulo,
      descricao: suggestion.descricao,
      categoria: suggestion.categoria,
      prioridade: suggestion.prioridade,
      concluida: false,
      date: new Date()
    }));
  }
}

export const aiProcessor = new AIProcessor();