import { buildCurrentActivityContext, buildCurrentLessonContext } from './context';
import { buildRequestMessages } from './messages';
import type { SubmitCourseMessageParams, UseSubmitLiaCourseMessageParams } from './types';

interface BuildCourseChatRequestParams {
  conversationId: string;
  normalizedMessage: string;
  submitParams: SubmitCourseMessageParams;
  runtime: Pick<
    UseSubmitLiaCourseMessageParams,
    'messages' | 'userId' | 'userName' | 'userJobTitle' | 'organizationId'
  >;
}

export function buildCourseChatRequestBody({
  conversationId,
  normalizedMessage,
  submitParams,
  runtime,
}: BuildCourseChatRequestParams) {
  const requestHistory = submitParams.baseMessages ?? runtime.messages;
  const activeContext = submitParams.courseContext || submitParams.workshopContext;
  const fallbackCurrentPage =
    activeContext?.currentPage ||
    (typeof window !== 'undefined' ? window.location.pathname : undefined);
  const activeTab =
    activeContext?.currentTab ||
    activeContext?.learningProgressContext?.currentTab;

  return {
    conversationId,
    messages: buildRequestMessages(requestHistory, normalizedMessage),
    context: {
      userId: runtime.userId,
      userName: runtime.userName,
      userJobTitle: runtime.userJobTitle,
      organizationId: runtime.organizationId,
      currentPage: fallbackCurrentPage,
      currentTab: activeTab,
      pageType: activeContext
        ? activeContext.contextType === 'workshop'
          ? 'workshop_lesson'
          : 'course_lesson'
        : undefined,
      currentLessonContext: buildCurrentLessonContext(
        activeContext,
        activeTab,
        fallbackCurrentPage
      ),
      currentActivityContext: buildCurrentActivityContext(activeContext),
    },
    stream: false,
  };
}
