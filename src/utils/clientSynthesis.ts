import { SummaryDocument, TargetAudience, SummaryDepth, SourceReference, Flashcard } from '../types/index';

export interface SynthesisOptions {
  content: string;
  targetAudience?: TargetAudience;
  cardCount?: number;
  depth?: SummaryDepth;
  customFocus?: string;
  sourceMetadata?: {
    title?: string;
    author?: string;
    citation?: string;
    url?: string;
  };
  imageUrl?: string;
}

/**
 * Clean and split text into meaningful sentences with minimum length threshold.
 */
function extractSentences(text: string): string[] {
  const rawSentences = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.?!])\s+|\n{2,}/)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s.length > 20 && !s.startsWith('#'));

  if (rawSentences.length > 0) {
    return rawSentences;
  }

  // Fallback for short text or non-punctuated inputs
  const chunks = text
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (chunks.length > 0) {
    return chunks;
  }

  return [text.trim()];
}

/**
 * Identify potential key terms or noun phrases from sentences.
 */
function extractKeyTerms(sentences: string[]): { term: string; sentence: string }[] {
  const terms: { term: string; sentence: string }[] = [];
  const seenTerms = new Set<string>();

  for (const sentence of sentences) {
    // Look for patterns like "X is...", "X refers to...", "X represents...", or capitalized multi-word phrases
    const definitionMatch = sentence.match(/^([A-Z][A-Za-z0-9\s-]{2,30})\s+(?:is|are|refers to|represents|defines|describes|functions as|causes|enables)\s+(.+)/i);
    if (definitionMatch && definitionMatch[1]) {
      const termCandidate = definitionMatch[1].trim();
      const lower = termCandidate.toLowerCase();
      if (!seenTerms.has(lower) && termCandidate.split(' ').length <= 4) {
        seenTerms.add(lower);
        terms.push({ term: termCandidate, sentence });
        continue;
      }
    }

    // Capitalized phrase detection
    const capitalizedMatches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);
    if (capitalizedMatches) {
      for (const cap of capitalizedMatches) {
        const lower = cap.toLowerCase();
        if (!seenTerms.has(lower) && cap.length > 4 && !['The', 'This', 'These', 'There', 'When', 'What', 'Where', 'In', 'On', 'For'].includes(cap)) {
          seenTerms.add(lower);
          terms.push({ term: cap, sentence });
        }
      }
    }
  }

  return terms;
}

/**
 * Client-Side Structured Cognitive Synthesis Engine.
 * Runs instantly in the browser without requiring a backend server or API keys.
 * Generates an executive brief, key takeaways, core concepts, cheat sheet, and active recall flashcards.
 */
export function generateClientSynthesis(options: SynthesisOptions): SummaryDocument {
  const {
    content,
    targetAudience = 'academic',
    cardCount = 8,
    depth = 'standard',
    customFocus = '',
    sourceMetadata,
    imageUrl,
  } = options;

  const trimmed = content.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Title generation
  let docTitle = sourceMetadata?.title?.trim();
  if (!docTitle) {
    const firstLine = trimmed.split('\n')[0].replace(/^[#*\-•\d.]+\s*/, '').trim();
    if (firstLine.length > 5 && firstLine.length < 70) {
      docTitle = firstLine;
    } else {
      docTitle = words.slice(0, 6).join(' ').replace(/[^\w\s-]/g, '') || 'Executive Topic Digest';
    }
  }
  docTitle = docTitle.charAt(0).toUpperCase() + docTitle.slice(1);

  const sentences = extractSentences(trimmed);
  const keyTerms = extractKeyTerms(sentences);

  // Executive Brief (BLUF)
  let executiveBrief = '';
  if (sentences.length >= 3) {
    executiveBrief = sentences.slice(0, 2).join(' ');
  } else {
    executiveBrief = sentences.join(' ');
  }

  if (targetAudience === 'executive') {
    executiveBrief = `Bottom Line Up Front (BLUF): ${executiveBrief} Strategic focus should prioritize operational resilience, measurable ROI, and risk mitigation.`;
  } else if (targetAudience === 'medical') {
    executiveBrief = `Clinical Core: ${executiveBrief} Focus on physiological mechanisms, diagnostic criteria, and patient outcomes.`;
  } else if (targetAudience === 'technical') {
    executiveBrief = `Technical Overview: ${executiveBrief} Key architectural considerations focus on scalability, fault isolation, and deterministic execution.`;
  }

  // Key Takeaways (4 to 6 items)
  const takeawayCount = depth === 'overview' ? 4 : depth === 'deep' ? 6 : 5;
  const keyTakeaways: string[] = [];

  for (let i = 0; i < Math.min(sentences.length, takeawayCount); i++) {
    const s = sentences[i];
    keyTakeaways.push(s.endsWith('.') ? s : `${s}.`);
  }

  while (keyTakeaways.length < 4) {
    const fillerIdx = keyTakeaways.length + 1;
    keyTakeaways.push(`Core retention point ${fillerIdx}: Review primary domain mechanisms and apply active recall protocols.`);
  }

  // Core Concepts (2 to 5 items)
  const coreConcepts: { term: string; definition: string; practicalApplication: string }[] = [];
  const conceptLimit = depth === 'overview' ? 2 : depth === 'deep' ? 5 : 3;

  for (let i = 0; i < Math.min(keyTerms.length, conceptLimit); i++) {
    const { term, sentence } = keyTerms[i];
    coreConcepts.push({
      term,
      definition: sentence,
      practicalApplication: `Utilize ${term} as an analytical benchmark when diagnosing edge cases or evaluating strategic decisions.`,
    });
  }

  if (coreConcepts.length < 2) {
    coreConcepts.push({
      term: words.slice(0, 2).join(' ') || 'Primary Mechanism',
      definition: sentences[0] || 'The foundational framework underlying this study topic.',
      practicalApplication: 'Establish as baseline reference during comprehensive review passes.',
    });
    if (sentences.length > 1) {
      coreConcepts.push({
        term: words.slice(3, 5).join(' ') || 'Operational Principle',
        definition: sentences[1],
        practicalApplication: 'Apply when evaluating trade-offs between speed, cost, and accuracy.',
      });
    }
  }

  // Cheat Sheet Quick Reference
  const cheatSheet: { item: string; detail: string }[] = [
    { item: 'Domain Focus', detail: docTitle },
    { item: 'Synthesis Depth', detail: `${depth.toUpperCase()} analysis across ${wordCount} words` },
  ];

  if (customFocus) {
    cheatSheet.push({ item: 'Exam / Objective Focus', detail: customFocus });
  }

  if (keyTerms.length > 0) {
    cheatSheet.push({
      item: 'Key Anchor Terms',
      detail: keyTerms.slice(0, 3).map((t) => t.term).join(' · '),
    });
  }

  cheatSheet.push({
    item: 'Retention Protocol',
    detail: 'Complete initial Box 1 review pass, followed by spaced review at 24h and 72h.',
  });

  // Action Items
  const actionItems: string[] = [
    'Complete the initial active recall flashcard test to verify initial retention.',
    'Review flagged difficult cards and self-test using the spaced repetition quiz.',
    'Formulate an active real-world scenario applying the primary core concepts.',
  ];

  if (depth === 'deep') {
    actionItems.push('Perform an unassisted 60-second Feynman technique explanation of the core principles.');
  }

  // Flashcards Generation
  const targetCardYield = Math.max(4, Math.min(20, cardCount));
  const flashcards: Flashcard[] = [];
  const categoryName =
    targetAudience === 'executive'
      ? 'Executive Strategy'
      : targetAudience === 'medical'
      ? 'Clinical Science'
      : targetAudience === 'technical'
      ? 'System Architecture'
      : 'Core Mastery';

  const sourceCitationFormatted = sourceMetadata?.title
    ? `${sourceMetadata.title}${sourceMetadata.citation ? ` (${sourceMetadata.citation})` : ''}`
    : undefined;

  for (let i = 0; i < targetCardYield; i++) {
    const sentenceIndex = i % sentences.length;
    const currentSentence = sentences[sentenceIndex] || `Core principle governing this domain`;
    const wordsInSentence = currentSentence.split(' ');
    
    // Create intelligent question variations
    let question = '';
    let answer = '';
    let mnemonic = '';

    const termObj = keyTerms[i % Math.max(1, keyTerms.length)];
    if (i % 3 === 0 && termObj) {
      question = `What is the significance of "${termObj.term}" in this context, and what mechanism does it govern?`;
      answer = termObj.sentence;
      mnemonic = `Memory Anchor: Link "${termObj.term}" to its direct functional outcome.`;
    } else if (i % 3 === 1) {
      const subject = wordsInSentence.slice(0, Math.min(5, wordsInSentence.length)).join(' ');
      question = `How does the following principle operate in practice: "${subject}..."?`;
      answer = currentSentence;
      mnemonic = `Recall Hook: Remember the primary condition that triggers this operational outcome.`;
    } else {
      question = `Analyze the cause-and-effect relationship detailed here: "${wordsInSentence.slice(0, 4).join(' ')}..." What is the crucial takeaway?`;
      answer = currentSentence;
      mnemonic = `Mental Hook: Picture the flow of information or causation from input to outcome.`;
    }

    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[i % 3];

    flashcards.push({
      id: `fc-client-${Date.now()}-${i + 1}`,
      question,
      answer,
      mnemonic,
      category: categoryName,
      difficulty,
      contextQuote: currentSentence.length < 160 ? currentSentence : currentSentence.slice(0, 157) + '...',
      imageUrl: i === 0 && imageUrl ? imageUrl : undefined,
      sourceReference: sourceCitationFormatted,
      box: 1,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
    });
  }

  // Structured sources
  const sources: SourceReference[] = sourceMetadata?.title?.trim()
    ? [
        {
          id: `src-${Date.now()}`,
          title: sourceMetadata.title.trim(),
          author: sourceMetadata.author?.trim() || undefined,
          citation: sourceMetadata.citation?.trim() || undefined,
          url: sourceMetadata.url?.trim() || undefined,
          type: 'book',
        },
      ]
    : [];

  return {
    id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: docTitle,
    executiveBrief,
    keyTakeaways,
    coreConcepts,
    cheatSheet,
    actionItems,
    flashcards,
    targetAudience,
    createdAt: new Date().toISOString(),
    sourceWordCount: wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
    tags: [targetAudience, 'StudyDeck', 'ActiveRecall'],
    sources,
    coverImageUrl: imageUrl || undefined,
  };
}
