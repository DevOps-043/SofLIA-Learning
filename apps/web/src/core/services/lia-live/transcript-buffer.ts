'use client';

export type LiaLiveTranscriptRole = 'user' | 'assistant';

export interface LiaLiveTranscriptEntry {
  sequence: number;
  role: LiaLiveTranscriptRole;
  content: string;
}

export interface LiaLiveTranscriptSnapshot {
  entries: LiaLiveTranscriptEntry[];
  metrics: {
    turnCount: number;
    userTranscriptCount: number;
    assistantTranscriptCount: number;
    interruptionCount: number;
  };
}

const MAX_TRANSCRIPT_ENTRY_LENGTH = 20_000;

function normalizeTranscriptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function clampTranscriptContent(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_ENTRY_LENGTH) return text;
  return text.slice(0, MAX_TRANSCRIPT_ENTRY_LENGTH);
}

function mergeTranscriptSnippet(current: string, snippet: string): string {
  const normalizedSnippet = normalizeTranscriptText(snippet);
  if (!normalizedSnippet) return current;

  const normalizedCurrent = normalizeTranscriptText(current);
  if (!normalizedCurrent) return normalizedSnippet;

  if (normalizedSnippet.startsWith(normalizedCurrent)) {
    return normalizedSnippet;
  }

  if (normalizedCurrent.endsWith(normalizedSnippet)) {
    return normalizedCurrent;
  }

  return `${normalizedCurrent} ${normalizedSnippet}`;
}

export class LiaLiveTranscriptBuffer {
  private entries: LiaLiveTranscriptEntry[] = [];
  private userBuffer = '';
  private assistantBuffer = '';
  private nextSequence = 1;
  private turnCount = 0;
  private interruptionCount = 0;

  appendUserTranscript(text: string): void {
    this.userBuffer = mergeTranscriptSnippet(this.userBuffer, text);
  }

  appendAssistantTranscript(text: string): void {
    this.assistantBuffer = mergeTranscriptSnippet(this.assistantBuffer, text);
  }

  markInterrupted(): void {
    this.interruptionCount += 1;
  }

  completeTurn(): void {
    const didCommitUser = this.commitBuffer('user');
    const didCommitAssistant = this.commitBuffer('assistant');

    if (didCommitUser || didCommitAssistant) {
      this.turnCount += 1;
    }
  }

  snapshot(): LiaLiveTranscriptSnapshot {
    this.completeTurn();

    const entries = [...this.entries];
    return {
      entries,
      metrics: {
        turnCount: this.turnCount,
        userTranscriptCount: entries.filter((entry) => entry.role === 'user').length,
        assistantTranscriptCount: entries.filter((entry) => entry.role === 'assistant').length,
        interruptionCount: this.interruptionCount,
      },
    };
  }

  private commitBuffer(role: LiaLiveTranscriptRole): boolean {
    const content = role === 'user' ? this.userBuffer : this.assistantBuffer;
    const normalizedContent = normalizeTranscriptText(content);
    if (!normalizedContent) return false;

    this.entries.push({
      sequence: this.nextSequence,
      role,
      content: clampTranscriptContent(normalizedContent),
    });
    this.nextSequence += 1;

    if (role === 'user') {
      this.userBuffer = '';
    } else {
      this.assistantBuffer = '';
    }

    return true;
  }
}
