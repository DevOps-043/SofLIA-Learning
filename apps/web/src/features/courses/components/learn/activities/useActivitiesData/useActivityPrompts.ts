import { useEffect, useRef } from 'react';
import { buildActivityPromptSources } from './activity-content-normalizers';
import type { GenerateRoleBasedPrompts, LearnActivity } from '../../types';

interface UseActivityPromptsParams {
  activities: LearnActivity[];
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  onPromptsChange?: (prompts: string[]) => void;
  userRole?: string;
}

export function useActivityPrompts({
  activities,
  generateRoleBasedPrompts,
  onPromptsChange,
  userRole,
}: UseActivityPromptsParams) {
  const generateRoleBasedPromptsRef = useRef(generateRoleBasedPrompts);
  const onPromptsChangeRef = useRef(onPromptsChange);

  useEffect(() => {
    generateRoleBasedPromptsRef.current = generateRoleBasedPrompts;
  }, [generateRoleBasedPrompts]);

  useEffect(() => {
    onPromptsChangeRef.current = onPromptsChange;
  }, [onPromptsChange]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;

    async function processPrompts() {
      const promptSources = buildActivityPromptSources(activities);

      if (promptSources.length === 0 || !onPromptsChangeRef.current) {
        onPromptsChangeRef.current?.([]);
        return;
      }

      const generatePrompts = generateRoleBasedPromptsRef.current;
      const shouldAdaptPrompts = Boolean(userRole && generatePrompts);
      const prompts = shouldAdaptPrompts && generatePrompts
        ? await getRoleAdaptedPrompts(promptSources, generatePrompts, userRole, (id) => {
          timeoutId = id;
        })
        : promptSources.flatMap((source) => source.prompts);

      if (isMounted) {
        onPromptsChangeRef.current?.(prompts);
      }
    }

    void processPrompts();

    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activities, userRole]);
}

async function getRoleAdaptedPrompts(
  promptSources: ReturnType<typeof buildActivityPromptSources>,
  generatePrompts: GenerateRoleBasedPrompts,
  userRole: string | undefined,
  onTimeoutCreated: (timeoutId: number) => void
): Promise<string[]> {
  const originalPrompts = promptSources.map((source) => source.prompts);
  const timeoutPromise = new Promise<string[][]>((resolve) => {
    onTimeoutCreated(window.setTimeout(() => resolve(originalPrompts), 10000));
  });

  try {
    const results = await Promise.race([
      Promise.all(
        promptSources.map((source) =>
          generatePrompts(source.prompts, source.content, source.title, userRole).catch(() => source.prompts)
        )
      ),
      timeoutPromise,
    ]);

    return results.flat();
  } catch {
    return originalPrompts.flat();
  }
}
