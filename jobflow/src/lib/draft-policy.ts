type Draft = { userId: string; matchId: string; status: string };

export function ownsDraft(draft: Draft | null, userId: string, matchId: string) {
  return Boolean(draft && draft.userId === userId && draft.matchId === matchId);
}

export function canSubmitDraft(draft: Draft | null, userId: string, matchId: string) {
  return ownsDraft(draft, userId, matchId) && draft?.status === 'approved';
}
