
import fetch from 'node-fetch';

// Security: Use environment variable instead of hardcoded API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export interface DailyPhrase {
  id: string;
  phrase: string;
  date: string;
  createdAt: Date;
}

let currentPhrase: DailyPhrase | null = null;
let lastGeneratedDate: string | null = null;

export async function generateDailyPhrase(): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Gere uma frase motivacional poderosa e inspiradora para alguém que está em uma jornada de autocontrole e superação pessoal. A frase deve ter entre 15 a 35 palavras, ser direta, impactante e transmitir força interior. Foque em temas como: determinação, foco, disciplina, superação de vícios, força mental, autocontrole, persistência e transformação pessoal. Retorne apenas a frase, sem aspas ou formatação adicional.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No text generated from Gemini API');
    }

    return generatedText.trim();
  } catch (error) {
    console.error('Error generating phrase with Gemini:', error);
    // Fallback phrases in case of API failure
    const fallbackPhrases = [
      "Sua força interior é maior que qualquer obstáculo. Continue firme em sua jornada!",
      "Cada dia de disciplina é um passo rumo à sua melhor versão.",
      "O controle que você exerce hoje molda o futuro que você merece.",
      "Sua determinação é a chave que abre todas as portas do impossível.",
      "A cada tentação resistida, você se torna mais forte e livre."
    ];
    return fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
  }
}

export async function getDailyPhrase(): Promise<DailyPhrase> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if we already have a phrase for today
  if (currentPhrase && lastGeneratedDate === today) {
    return currentPhrase;
  }

  // Generate new phrase for today
  try {
    const phraseText = await generateDailyPhrase();
    
    currentPhrase = {
      id: `phrase-${today}`,
      phrase: phraseText,
      date: today,
      createdAt: new Date()
    };
    
    lastGeneratedDate = today;
    
    console.log(`✨ Nova frase do dia gerada para ${today}: ${phraseText}`);
    
    return currentPhrase;
  } catch (error) {
    console.error('Error getting daily phrase:', error);
    
    // Return a default phrase if generation fails
    currentPhrase = {
      id: `phrase-${today}`,
      phrase: "Sua jornada de transformação começa com uma decisão corajosa. Você tem o poder!",
      date: today,
      createdAt: new Date()
    };
    
    lastGeneratedDate = today;
    return currentPhrase;
  }
}

// Schedule phrase generation at midnight
export function scheduleDailyPhraseGeneration() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  
  // Set timeout for first generation at midnight
  setTimeout(() => {
    generateNewPhraseAtMidnight();
    
    // Then set interval for every 24 hours
    setInterval(generateNewPhraseAtMidnight, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
  
  console.log(`📅 Agendamento de frases configurado. Próxima geração em: ${Math.round(msUntilMidnight / 1000 / 60)} minutos`);
}

async function generateNewPhraseAtMidnight() {
  try {
    console.log('🌅 Gerando nova frase do dia...');
    await getDailyPhrase();
  } catch (error) {
    console.error('Error generating phrase at midnight:', error);
  }
}
