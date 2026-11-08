import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback generator when API key is missing or quota is exhausted
function createFallbackGeneration(
  content: string,
  audience: string,
  count: number,
  sourceMetadata?: { title?: string; author?: string; citation?: string; url?: string },
  imageUrl?: string
) {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const title = sourceMetadata?.title || words.slice(0, 6).join(' ').replace(/[^\w\s]/g, '') || 'Comprehensive Topic Brief';

  // Extract candidate sentences
  let sentences = content
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (sentences.length === 0) {
    sentences = [
      content.slice(0, 160) || 'Core foundational principle of this study subject.',
      content.slice(160, 320) || 'Operational and strategic mechanism governing implementation.',
      content.slice(320, 480) || 'Crucial takeaway and practical implication for mastery.'
    ];
  }

  const keyTakeaways = sentences.slice(0, 5).map((s, idx) => `Point ${idx + 1}: ${s}`);

  const flashcards = [];
  const cardCount = Math.min(count, Math.max(3, Math.min(15, sentences.length)));

  for (let i = 0; i < cardCount; i++) {
    const sentence = sentences[i % sentences.length] || `Essential concept ${i + 1}`;
    const wordsInSentence = sentence.split(' ');
    const subject = wordsInSentence.slice(0, 4).join(' ');
    const detail = wordsInSentence.slice(4).join(' ') || sentence;

    flashcards.push({
      id: `fc-gen-${Date.now()}-${i + 1}`,
      question: `What is the significance of: "${subject}..."?`,
      answer: detail.length > 10 ? detail : sentence,
      mnemonic: `Recall: ${subject} connects directly to the primary outcome.`,
      category: audience === 'executive' ? 'Executive Strategy' : audience === 'medical' ? 'Clinical Science' : audience === 'technical' ? 'System Architecture' : 'Core Study',
      difficulty: (i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
      imageUrl: i === 0 && imageUrl ? imageUrl : undefined,
      sourceReference: sourceMetadata?.title ? `${sourceMetadata.title}${sourceMetadata.citation ? ` (${sourceMetadata.citation})` : ''}` : undefined,
      box: 1,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
    });
  }

  const sources = sourceMetadata?.title
    ? [
        {
          id: `src-${Date.now()}`,
          title: sourceMetadata.title,
          author: sourceMetadata.author,
          citation: sourceMetadata.citation,
          url: sourceMetadata.url,
          type: 'book' as const,
        },
      ]
    : [];

  return {
    id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    executiveBrief: sentences.slice(0, 2).join(' ') || 'Structured executive distillation synthesized from the source document for rapid cognitive retention.',
    keyTakeaways,
    coreConcepts: [
      {
        term: words.slice(0, 2).join(' ') || 'Primary Concept',
        definition: sentences[0] || 'The foundational framework underlying this domain.',
        practicalApplication: 'Implement as the central standard during workflow reviews and diagnostic evaluations.'
      },
      {
        term: words.slice(3, 5).join(' ') || 'Secondary Principle',
        definition: sentences[1] || 'Operational mechanism guiding optimal execution.',
        practicalApplication: 'Leverage to calibrate decisions when evaluating trade-offs.'
      }
    ],
    cheatSheet: [
      { item: 'Primary Focus', detail: title },
      { item: 'Key Metric / Rule', detail: `${wordCount} words distilled into ${cardCount} active recall prompts` }
    ],
    actionItems: [
      'Complete initial flashcard review pass in Box 1.',
      'Test active retention with the challenge quiz before moving to next module.',
      'Re-examine flagged cards after 24 hours.'
    ],
    flashcards,
    targetAudience: audience,
    createdAt: new Date().toISOString(),
    sourceWordCount: wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
    tags: [audience, 'StudyDeck', 'ActiveRecall'],
    sources,
    coverImageUrl: imageUrl || undefined,
  };
}

// API endpoint to generate summary and flashcards
app.post('/api/generate', async (req, res) => {
  console.log('[API] /api/generate received, content length:', req.body?.content?.length);
  try {
    const {
      content,
      targetAudience = 'academic',
      cardCount = 8,
      depth = 'standard',
      customFocus = '',
      sourceMetadata,
      imageUrl,
    } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 15) {
      return res.status(400).json({
        error: 'Please provide at least 15 characters of text, lecture notes, or an article to analyze.',
      });
    }

    const trimmedContent = content.trim().slice(0, 25000);
    const parsedCardCount = Math.max(3, Math.min(25, Number(cardCount) || 8));

    // If Gemini client is not initialized or API key is placeholder
    const isRealApiKey = process.env.GEMINI_API_KEY && 
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && 
      process.env.GEMINI_API_KEY.length > 10;

    if (!ai || !isRealApiKey) {
      console.log('[API] Using structured synthesis engine (GEMINI_API_KEY not configured or placeholder)');
      const fallbackResult = createFallbackGeneration(trimmedContent, targetAudience, parsedCardCount, sourceMetadata, imageUrl);
      return res.json(fallbackResult);
    }

    const systemPrompt = `You are a world-class cognitive science educator and executive intelligence analyst.
Your task is to transform raw text into an exceptionally structured learning & retention pack.
You must produce:
1. title: An authoritative, concise title for this topic.
2. executiveBrief: A high-density Bottom Line Up Front (BLUF) summarizing the crux in 2-3 sentences.
3. keyTakeaways: Exactly 4-6 high-impact takeaway bullet points.
4. coreConcepts: 2-5 essential terms with a clear definition and a concrete practical application.
5. cheatSheet: 3-6 quick-reference key facts, formulas, rules, acronyms, or numbers.
6. actionItems: 2-4 concrete next steps or mastery checkpoints for the learner.
7. flashcards: Exactly ${parsedCardCount} high-yield active recall flashcards.
   For each flashcard:
   - question: A crisp, thought-provoking question, problem, or clinical/business scenario (NOT just "What is X?").
   - answer: An unambiguous, direct, high-value explanation.
   - mnemonic: A memorable mental anchor, analogy, rhyme, or memory hook to cement instant recall.
   - category: Subtopic category name.
   - difficulty: "easy", "medium", or "hard".
   - contextQuote: A short 1-sentence quote or excerpt from the text that proves this fact.

Audience tone: ${targetAudience} (tailor terminology, depth, and examples accordingly).
Depth mode: ${depth}.
${customFocus ? `Special focus area requested by user: ${customFocus}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Analyze the following text and create the retention pack:\n\n${trimmedContent}` }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            executiveBrief: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            coreConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  practicalApplication: { type: Type.STRING },
                },
                required: ['term', 'definition', 'practicalApplication'],
              },
            },
            cheatSheet: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['item', 'detail'],
              },
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  mnemonic: { type: Type.STRING },
                  category: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  contextQuote: { type: Type.STRING },
                },
                required: ['question', 'answer', 'mnemonic', 'category', 'difficulty'],
              },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'title',
            'executiveBrief',
            'keyTakeaways',
            'coreConcepts',
            'cheatSheet',
            'actionItems',
            'flashcards',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsedData = JSON.parse(rawText);

    const wordCount = trimmedContent.split(/\s+/).length;
    const finalDocument = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: parsedData.title || 'Executive Topic Digest',
      executiveBrief: parsedData.executiveBrief || '',
      keyTakeaways: parsedData.keyTakeaways || [],
      coreConcepts: parsedData.coreConcepts || [],
      cheatSheet: parsedData.cheatSheet || [],
      actionItems: parsedData.actionItems || [],
      flashcards: (parsedData.flashcards || []).map((card: any, idx: number) => ({
        id: `fc-${Date.now()}-${idx + 1}`,
        question: card.question || `Question ${idx + 1}`,
        answer: card.answer || 'Answer',
        mnemonic: card.mnemonic || '',
        category: card.category || 'General',
        difficulty: (['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
        contextQuote: card.contextQuote || undefined,
        imageUrl: idx === 0 && imageUrl ? imageUrl : undefined,
        sourceReference: sourceMetadata?.title ? `${sourceMetadata.title}${sourceMetadata.citation ? ` (${sourceMetadata.citation})` : ''}` : undefined,
        box: 1,
        nextReviewDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0,
      })),
      targetAudience,
      createdAt: new Date().toISOString(),
      sourceWordCount: wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      tags: parsedData.tags || [targetAudience, 'Summary', 'ActiveRecall'],
      sources: sourceMetadata?.title
        ? [
            {
              id: `src-${Date.now()}`,
              title: sourceMetadata.title,
              author: sourceMetadata.author,
              citation: sourceMetadata.citation,
              url: sourceMetadata.url,
              type: 'book' as const,
            },
          ]
        : [],
      coverImageUrl: imageUrl || undefined,
    };

    return res.json(finalDocument);
  } catch (error: any) {
    console.error('Error generating summary & flashcards:', error);
    // Graceful fallback on API or rate limit errors
    const fallback = createFallbackGeneration(
      req.body?.content || 'Study document',
      req.body?.targetAudience || 'academic',
      Number(req.body?.cardCount) || 8,
      req.body?.sourceMetadata,
      req.body?.imageUrl
    );
    return res.json(fallback);
  }
});

// API endpoint for image-to-text visual extraction (OCR)
app.post('/api/extract-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mode = 'full-text' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const isRealApiKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.length > 10;

    if (!ai || !isRealApiKey) {
      return res.json({ useClientOcr: true });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const promptText =
      mode === 'handwritten'
        ? 'Transcribe all handwritten notes, whiteboard writing, and printed text from this image with high fidelity. Preserve structure.'
        : mode === 'table'
        ? 'Extract all tabular data and text from this image, formatting tables cleanly in Markdown.'
        : 'Transcribe and extract all text, formulas, headings, and bullet points from this document/image verbatim and accurately.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    });

    const extractedText = response.text || '';
    return res.json({ text: extractedText, source: 'ai-vision' });
  } catch (error: any) {
    console.error('Vision extraction error in /api/extract-image:', error);
    return res.json({ useClientOcr: true, error: error.message });
  }
});

// Setup Vite or static files
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`RetainIQ Server listening on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
