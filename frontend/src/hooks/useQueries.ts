import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, InterviewSession, LiveMockInterviewData, Resume, InterviewResponse, QuizQuestion, QuizResult, CandidateReview, InterviewSettings, ResumeStatus, ImprovementSuggestion } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUploadResume() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resume: Resume) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadResume(resume);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumeStatus'] });
      queryClient.invalidateQueries({ queryKey: ['hasUploadedResume'] });
      queryClient.invalidateQueries({ queryKey: ['latestResume'] });
    },
  });
}

export function useGetCallerResumes() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerResumes();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCallerLatestResume() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Resume | null>({
    queryKey: ['latestResume'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerLatestResume();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetResumeStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ResumeStatus>({
    queryKey: ['resumeStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return { hasUploaded: false, lastUploadedAt: undefined };
      return actor.getResumeStatus(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useHasUploadedResume() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasUploadedResume'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasUploadedResume();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useVerifyResumeRole() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ resumeId, targetRole }: { resumeId: string; targetRole: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyResumeRole(resumeId, targetRole);
    },
  });
}

export function useGetImprovementSuggestions() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (resumeId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getImprovementSuggestions(resumeId);
    },
  });
}

export function useHasRoleVerifiedResume() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (targetRole: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.hasRoleVerifiedResume(targetRole);
    },
  });
}

export function useHasRoleMismatchResume() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ targetRole, verified }: { targetRole: string; verified: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.hasRoleMismatchResume(targetRole, verified);
    },
  });
}

export function useSaveInterviewSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: InterviewSession) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveInterviewSession(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewSessions'] });
    },
  });
}

export function useGetInterviewSessions() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<InterviewSession[]>({
    queryKey: ['interviewSessions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getInterviewSessions(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSaveLiveMockData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LiveMockInterviewData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveLiveMockData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveMockData'] });
    },
  });
}

export function useGetLiveMockData() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<LiveMockInterviewData[]>({
    queryKey: ['liveMockData', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getLiveMockData(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddInterviewResponse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: InterviewResponse) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addInterviewResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewResponses'] });
    },
  });
}

export function useGetInterviewResponses() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<InterviewResponse[]>({
    queryKey: ['interviewResponses', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getInterviewResponses(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetQuizQuestions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useMutation({
    mutationFn: async ({ role, difficulty }: { role: string; difficulty: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getQuizQuestions(role, difficulty);
    },
  });
}

export function useSaveQuizResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: QuizResult) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveQuizResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizResults'] });
    },
  });
}

export function useGetQuizResults() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<QuizResult[]>({
    queryKey: ['quizResults', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getQuizResults(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSaveCandidateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: CandidateReview) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCandidateReview(review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateReviews'] });
    },
  });
}

export function useGetCandidateReviews() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CandidateReview[]>({
    queryKey: ['candidateReviews', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getCandidateReviews(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSaveInterviewSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: InterviewSettings) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveInterviewSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewSettings'] });
    },
  });
}

export function useGetInterviewSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InterviewSettings | null>({
    queryKey: ['interviewSettings'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInterviewSettings();
    },
    enabled: !!actor && !actorFetching,
  });
}
