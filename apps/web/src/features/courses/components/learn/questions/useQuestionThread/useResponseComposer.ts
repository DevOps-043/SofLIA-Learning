import { useCallback, useState } from 'react';
import { appendReplyToResponseTree } from '../utils';
import { createQuestionResponse } from './question-thread-api';
import type { CourseQuestionResponse } from '../types';

interface UseResponseComposerParams {
  questionId: string;
  setResponses: React.Dispatch<React.SetStateAction<CourseQuestionResponse[]>>;
  slug: string;
}

export function useResponseComposer({ questionId, setResponses, slug }: UseResponseComposerParams) {
  const [newResponse, setNewResponse] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = useCallback(async () => {
    if (!newResponse.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createdResponse = await createQuestionResponse({ content: newResponse.trim(), questionId, slug });

      if (createdResponse) {
        setResponses((current) => addUniqueResponse(current, createdResponse));
        setNewResponse('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [newResponse, questionId, setResponses, slug]);

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      if (!replyContent.trim()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const createdReply = await createQuestionResponse({
          content: replyContent.trim(),
          parentId,
          questionId,
          slug,
        });

        if (createdReply) {
          setResponses((current) => appendReplyToResponseTree(current, parentId, { ...createdReply, replies: [] }));
          setReplyContent('');
          setReplyingTo(null);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [questionId, replyContent, setResponses, slug]
  );

  return {
    handleSubmitReply,
    handleSubmitResponse,
    isSubmitting,
    newResponse,
    replyContent,
    replyingTo,
    setNewResponse,
    setReplyContent,
    setReplyingTo,
  };
}

function addUniqueResponse(
  currentResponses: CourseQuestionResponse[],
  createdResponse: CourseQuestionResponse
): CourseQuestionResponse[] {
  if (currentResponses.some((responseItem) => responseItem.id === createdResponse.id)) {
    return currentResponses;
  }

  return [...currentResponses, { ...createdResponse, replies: [] }];
}
