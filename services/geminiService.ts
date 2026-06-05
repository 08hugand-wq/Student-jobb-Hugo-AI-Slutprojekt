
import { GoogleGenAI, Type } from "@google/genai";
import { Job, StudentProfile } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey === '""') {
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (error) {
    console.warn("Kunde inte initiera GoogleGenAI:", error);
    return null;
  }
}

export async function calculateMatchScore(job: Job, profile: StudentProfile): Promise<number> {
  const ai = getAI();
  if (!ai) {
    // Elegant offline algorithm based on profile properties
    let score = 75;
    if (job.city && profile.city && job.city.toLowerCase() === profile.city.toLowerCase()) {
      score += 10;
    }
    if (profile.reliabilityScore) {
      score += Math.round((profile.reliabilityScore - 4.5) * 15);
    }
    return Math.min(100, Math.max(40, score));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Calculate match (0-100). Job: ${JSON.stringify(job)}. Profile: ${JSON.stringify(profile)}. Consider city, availability, and reliability score. Return JSON {"score": number}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER } },
          required: ["score"]
        }
      }
    });
    return JSON.parse(response.text || '{"score": 75}').score;
  } catch (error) {
    return 75;
  }
}

export async function suggestSalary(title: string, city: string): Promise<number> {
  const ai = getAI();
  if (!ai) {
    // Accurate Swedish student job rate estimates offline
    const lower = title.toLowerCase();
    if (lower.includes("it") || lower.includes("utvecklare") || lower.includes("programmerare")) return 165;
    if (lower.includes("lager") || lower.includes("logistik") || lower.includes("truck")) return 150;
    if (lower.includes("servering") || lower.includes("barista") || lower.includes("event") || lower.includes("café")) return 135;
    return 140;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Suggest a competitive hourly rate in SEK for a student job with title "${title}" in "${city}". Return JSON {"hourlyRate": number}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { hourlyRate: { type: Type.NUMBER } },
          required: ["hourlyRate"]
        }
      }
    });
    return JSON.parse(response.text || '{"hourlyRate": 145}').hourlyRate;
  } catch (error) {
    return 140;
  }
}

export async function generateEmployerResponse(
  company: string,
  jobTitle: string,
  studentName: string,
  lastStudentMessage: string,
  conversationHistory: { senderId: string; text: string }[]
): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return "";
  }

  try {
    const historyText = conversationHistory
      .map(m => `${m.senderId === 'student' ? studentName : company}: ${m.text}`)
      .join('\n');

    const prompt = `You are the recruiting manager at "${company}" for the student job "${jobTitle}".
A student named "${studentName}" has applied and is chatting with you in Swedish.
Here is the chat history:
${historyText}

The student just sent: "${lastStudentMessage}"

Write a very brief, realistic, professional, and friendly response in Swedish (max 2 sentences).
If they are following up on their application, express interest and ask them a relevant follow-up question (e.g., if they can work on the start date, or check their experience), or suggest scheduling a quick call. Keep the tone enthusiastic, clean, and helpful. Do not mention system details.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional Swedish employer reviewing a student's application. Keep your responses short, conversational, polite, and exclusively in Swedish."
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
}

export async function askAIHelpBot(
  userPrompt: string, 
  role: 'student' | 'employer',
  profile?: StudentProfile,
  history: { senderId: 'user' | 'bot'; text: string }[] = []
): Promise<string> {
  const ai = getAI();
  if (!ai) {
    // Elegant Offline Swedish FAQ help bot logic
    const lower = userPrompt.toLowerCase();
    if (lower.includes("fribelopp") || lower.includes("skatt") || lower.includes("ekonomi") || lower.includes("tjäna")) {
      return "Fribeloppet är den gräns för inkomst du kan tjäna per kalenderhalvår utan att ditt studiemedel (CSN) minskas. För 2026 ligger fribeloppet på cirka 22 208 kr per halvår om du studerar på heltid. På vår **Ekonomisida** kan du hålla full koll på dina inkomster i realtid så att du aldrig råkar gå över gränsen! 📊";
    }
    if (lower.includes("cv") || lower.includes("ansöka") || lower.includes("profil") || lower.includes("tips")) {
      return "För att sticka ut hos arbetsgivare, se till att ladda upp ditt CV på din profilsida, lämna korta och trevliga svar i chatten, samt håll din **pålitlighet (reliability score)** hög genom att passa dina bokade tider och slutföra dina pass! 💪";
    }
    if (lower.includes("jobb") || lower.includes("hitta") || lower.includes("pass") || lower.includes("snabba")) {
      return "Du hittar tillgängliga pass direkt under tabben **Jobb**. Filtrera på 'Snabba pass' för att hitta jobb som behöver fyllas omedelbart, eller 'Distans' om du vill arbeta hemifrån! ⚡";
    }
    if (lower.includes("arbetsgivare") || lower.includes("skapa") || lower.includes("annons") || lower.includes("publicera")) {
      return "Som arbetsgivare klickar du på **Employer Mode** längst upp till höger, går till tabben **Publicera** och fyller i jobbtitel samt beskrivning. Vår AI-funktion räknar dessutom automatiskt ut ett rekommenderat löneläge baserat på marknadspriser! ⚡";
    }
    return "Hej! Jag är din AI-assistent för StudentJobb. Just nu är mitt AI-system offline, men jag kan svara på frågor om **fribeloppet/skatt**, hur du hittar **jobb/pass**, hur du optimerar ditt **CV/profil**, eller hur man **publicerar annonser** som arbetsgivare. Vad vill du veta mer om? 😊";
  }

  try {
    const historyText = history
      .map(m => `${m.senderId === 'user' ? 'Student/Arbetsgivare' : 'StudentJobb-Bot'}: ${m.text}`)
      .join('\n');

    const prompt = `Du är "StudentJobb AI-Assistent", en trevlig, hjälpsam och professionell svensk support-bot som hjälper studenter och arbetsgivare på plattformen StudentJobb.
Aktuell användarroll: ${role === 'student' ? 'Student' : 'Arbetsgivare/Företag'}.
Plattformen har funktioner som:
- Snabba enstaka timpass och extrajobb (söks med 1 klick).
- Visar matningspoäng/pålitlighet (Reliability score), användarnivåer och prestationer (badges).
- Direktchatt med arbetsgivaren vid ansökan.
- Interaktiv Ekonomisida som räknar ut avstånd till fribeloppet (22 208 kr skattefritt).
- Gemini-lönesystem för arbetsgivare som föreslår marknadsmässig timlön.

Här är konversationshistoriken hittills:
${historyText}

Användaren frågar: "${userPrompt}"

Svara på ett vänligt, modernt, pedagogiskt och kortfattat sätt på god svenska. Håll svaret till maximalt 3 korta meningar eller punktform så det är lätt att läsa på mobilen. Använd gärna tillämpliga emojis för en positiv stämning. Det kan gälla fribelopp eller karriärstips eller hur man använder appen.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Du är StudentJobb AI-assistenten. Du talar alltid svenska, är otroligt trevlig och stöttande, och ger korta, koncisa svar."
      }
    });

    return response.text?.trim() || "Det gick tyvärr inte att generera ett svar. Försök gärna igen! 😊";
  } catch (error) {
    return "Oj, det uppstod ett litet fel när jag försökte tänka ut ett svar. Kan du ställa frågan på ett annat sätt? 💭";
  }
}


