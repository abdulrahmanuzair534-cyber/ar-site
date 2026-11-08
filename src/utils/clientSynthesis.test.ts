import test from 'node:test';
import assert from 'node:assert/strict';
import { generateClientSynthesis } from './clientSynthesis';

test('generateClientSynthesis generates structured document from raw text', () => {
  const content = `Distributed systems require balancing consistency, availability, and partition tolerance as formulated by Eric Brewer's CAP theorem. In any asynchronous network subject to packet loss, network partitions are an inevitability. System architects must choose whether a partition forces the system to prioritize Consistency (CP) or Availability (AP). Raft consensus algorithms establish authoritative leader terms through majority quorums.`;

  const result = generateClientSynthesis({
    content,
    targetAudience: 'technical',
    cardCount: 6,
    depth: 'standard',
    sourceMetadata: {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      citation: 'Chapters 7–9',
    },
  });

  assert.equal(typeof result.id, 'string');
  assert.equal(result.title, 'Designing Data-Intensive Applications');
  assert.ok(result.executiveBrief.length > 20);
  assert.ok(result.keyTakeaways.length >= 4);
  assert.ok(result.coreConcepts.length >= 2);
  assert.ok(result.cheatSheet.length >= 2);
  assert.ok(result.actionItems.length >= 2);
  assert.equal(result.flashcards.length, 6);
  assert.ok(result.sources && result.sources.length === 1);
  assert.equal(result.sources[0].title, 'Designing Data-Intensive Applications');
  assert.equal(result.flashcards[0].category, 'System Architecture');
  assert.ok(result.flashcards[0].question.length > 5);
  assert.ok(result.flashcards[0].answer.length > 5);
  assert.ok(result.flashcards[0].mnemonic.length > 5);
});

test('generateClientSynthesis handles short texts gracefully without errors', () => {
  const content = `The Autonomic Nervous System maintains homeostatic equilibrium via sympathetic and parasympathetic divisions.`;

  const result = generateClientSynthesis({
    content,
    targetAudience: 'medical',
    cardCount: 4,
  });

  assert.ok(result.title.length > 0);
  assert.ok(result.executiveBrief.length > 0);
  assert.equal(result.flashcards.length, 4);
  assert.equal(result.flashcards[0].category, 'Clinical Science');
  assert.equal(result.flashcards[0].box, 1);
});

test('generateClientSynthesis attaches cover image and citation correctly', () => {
  const imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const result = generateClientSynthesis({
    content: 'Machine learning transformers rely on scaled dot-product attention mechanisms.',
    targetAudience: 'academic',
    cardCount: 4,
    imageUrl,
    sourceMetadata: {
      title: 'Attention Is All You Need',
      citation: 'Vaswani et al.',
    },
  });

  assert.equal(result.coverImageUrl, imageUrl);
  assert.equal(result.flashcards[0].imageUrl, imageUrl);
  assert.ok(result.flashcards[0].sourceReference?.includes('Attention Is All You Need'));
});
