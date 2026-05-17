import type { ActivityProgress, ActivityStatus, ConversationMetadata, MessageMetadata, MessageRole } from './lia-logger-events';
import { abandonLiaActivity, completeLiaActivity, startLiaActivity } from './lia-logger-session/activity-lifecycle';
import { incrementLiaActivityRedirections, updateLiaActivityProgress } from './lia-logger-session/activity-progress';
import { endLiaConversation, logLiaFeedback, recoverLiaMessageSequence } from './lia-logger-session/conversation-state';
import { logLiaMessage } from './lia-logger-session/message-logging';
import { startLiaConversation } from './lia-logger-session/start-conversation';

export class SofLIALogger {
  private userId: string;
  private conversationId: string | null = null;
  private messageSequence = 0;

  constructor(userId: string) {
    this.userId = userId;
  }

  async startConversation(metadata: ConversationMetadata): Promise<string> {
    this.conversationId = await startLiaConversation(this.userId, metadata);
    this.messageSequence = 0;
    return this.conversationId;
  }

  async logMessage(
    role: MessageRole,
    content: string,
    isSystemMessage = false,
    metadata?: MessageMetadata
  ): Promise<string> {
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    this.messageSequence++;
    const result = await logLiaMessage({
      content,
      conversationId: this.conversationId,
      isSystemMessage,
      messageSequence: this.messageSequence,
      metadata,
      role
    });

    if (result.conversationDeleted) {
      this.conversationId = null;
      this.messageSequence = 0;
    }

    return result.messageId;
  }

  async endConversation(completed = true): Promise<void> {
    if (!this.conversationId) return;
    await endLiaConversation(this.conversationId, completed);
    this.conversationId = null;
  }

  async startActivity(activityId: string, totalSteps: number): Promise<string> {
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation first.');
    }
    return startLiaActivity(this.conversationId, this.userId, activityId, totalSteps);
  }

  updateActivityProgress(
    completionId: string,
    progress: Partial<ActivityProgress> & { status?: ActivityStatus }
  ): Promise<void> {
    return updateLiaActivityProgress(completionId, progress);
  }

  completeActivity(completionId: string, generatedOutput?: unknown): Promise<void> {
    return completeLiaActivity(completionId, generatedOutput);
  }

  abandonActivity(completionId: string): Promise<void> {
    return abandonLiaActivity(completionId);
  }

  async logFeedback(
    messageId: string,
    feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'confusing',
    rating?: number,
    comment?: string
  ): Promise<void> {
    if (!this.conversationId) throw new Error('No active conversation.');
    await logLiaFeedback({ comment, conversationId: this.conversationId, feedbackType, messageId, rating, userId: this.userId });
  }

  incrementRedirections(completionId: string): Promise<void> {
    return incrementLiaActivityRedirections(completionId);
  }

  getCurrentConversationId(): string | null {
    return this.conversationId;
  }

  setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
    this.messageSequence = 0;
  }

  async recoverMessageSequence(): Promise<void> {
    if (!this.conversationId) return;
    this.messageSequence = await recoverLiaMessageSequence(this.conversationId);
  }

  getCurrentMessageSequence(): number {
    return this.messageSequence;
  }
}

export const LiaLogger = SofLIALogger;
