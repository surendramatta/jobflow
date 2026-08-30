import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownsDraft, canSubmitDraft } from '../src/lib/draft-policy.ts';

const draft = { userId: 'alice', matchId: 'job-1', status: 'approved' };
test('only the owner may approve a draft for its actual match', () => {
  assert.equal(ownsDraft(draft, 'alice', 'job-1'), true);
  assert.equal(ownsDraft(draft, 'bob', 'job-1'), false);
  assert.equal(ownsDraft(draft, 'alice', 'job-2'), false);
  assert.equal(ownsDraft(null, 'alice', 'job-1'), false);
});
test('submission tracking requires prior approval and ownership', () => {
  assert.equal(canSubmitDraft(draft, 'alice', 'job-1'), true);
  for (const status of ['pending_approval', 'rejected', '']) {
    assert.equal(canSubmitDraft({ ...draft, status }, 'alice', 'job-1'), false);
  }
  assert.equal(canSubmitDraft(draft, 'bob', 'job-1'), false);
});
