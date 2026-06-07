type ResultGroup = object;

interface BuildStudyPlannerLIALogicResultParams<
  TState extends ResultGroup,
  TSetters extends ResultGroup,
  TVoice extends ResultGroup,
  THandlers extends ResultGroup,
  TSessionStorage extends ResultGroup,
  TSchedulePreview extends ResultGroup,
> {
  handlers: THandlers;
  schedulePreview: TSchedulePreview;
  sessionStorage: TSessionStorage;
  setters: TSetters;
  state: TState;
  voice: TVoice;
}

export function buildStudyPlannerLIALogicResult<
  TState extends ResultGroup,
  TSetters extends ResultGroup,
  TVoice extends ResultGroup,
  THandlers extends ResultGroup,
  TSessionStorage extends ResultGroup,
  TSchedulePreview extends ResultGroup,
>({
  handlers,
  schedulePreview,
  sessionStorage,
  setters,
  state,
  voice,
}: BuildStudyPlannerLIALogicResultParams<
  TState,
  TSetters,
  TVoice,
  THandlers,
  TSessionStorage,
  TSchedulePreview
>): TState & TSetters & TVoice & THandlers & TSessionStorage & TSchedulePreview {
  return {
    ...state,
    ...setters,
    ...voice,
    ...handlers,
    ...sessionStorage,
    ...schedulePreview,
  };
}
