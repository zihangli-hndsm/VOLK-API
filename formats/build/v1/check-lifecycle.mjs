import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const lifecycle = read('lifecycle.json');
const fixture = read('fixture.json');

// These examples validate metadata only. Authority must come from the host's current grants.
function transition(from, to, approval) {
  const allowed = lifecycle.runTransitions[from];
  if (allowed.length === 0) return 'terminal_run';
  if (!allowed.includes(to)) return 'invalid_transition';
  if (from === 'waitingApproval' && to === 'running' && approval !== 'current') return 'approval_required';
  return 'accepted';
}

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
};

function acceptEvent(run, history, event) {
  if (event.runId !== run.runId) return 'run_mismatch';
  if (event.resource && event.resource.workspaceId !== run.workspaceId) return 'workspace_mismatch';
  const existing = history.find((item) => item.eventId === event.eventId);
  if (existing) {
    return JSON.stringify(stable(existing)) === JSON.stringify(stable(event)) ? 'unchanged' : 'event_conflict';
  }
  if (lifecycle.runTransitions[run.status].length === 0) return 'terminal_run';
  const requiredParentType = lifecycle.correlatedEventParents[event.type];
  if (event.parentEventId || requiredParentType) {
    const parent = history.find((item) => item.eventId === event.parentEventId && item.runId === run.runId);
    if (!parent || parent.sequence >= event.sequence || (requiredParentType && parent.type !== requiredParentType)) {
      return 'event_parent_invalid';
    }
  }
  if (history.some((item) => item.runId === run.runId && item.sequence >= event.sequence)) return 'event_sequence_invalid';
  return 'accepted';
}

function assess(target) {
  return target.environment === 'local' && target.profile === 'browser-cpu' && target.profileVersion === '1'
    ? 'available' : 'target_unavailable';
}

const allowedEdges = [
  ['queued', 'running'], ['queued', 'failed'], ['queued', 'cancelled'],
  ['running', 'waitingApproval'], ['running', 'succeeded'], ['running', 'failed'], ['running', 'cancelled'],
  ['waitingApproval', 'running'], ['waitingApproval', 'failed'], ['waitingApproval', 'cancelled'],
];
for (const [from, to] of allowedEdges) assert.equal(transition(from, to, 'current'), 'accepted', `${from} → ${to}`);
assert.equal(Object.values(lifecycle.runTransitions).flat().length, allowedEdges.length);
for (const item of lifecycle.transitionRejections) assert.equal(transition(item.from, item.to, item.approval), item.error, item.case);
for (const item of lifecycle.targetCases) assert.equal(assess(item.target), item.expected);

const run = fixture.run;
const invocation = { ...fixture.event, type: 'tool.invoked' };
const result = {
  ...invocation, eventId: '6cd5494d-f637-4300-8610-b710ecf3b7c1', sequence: 2, timestamp: 2,
  type: 'tool.completed', parentEventId: invocation.eventId, resource: fixture.resource.ref,
};
const otherScope = '55c5f416-1bae-4267-b58a-44f76136236f';
const scenarios = {
  matchingParent: [run, [invocation], result],
  otherWorkspace: [run, [invocation], { ...result, resource: { ...result.resource, workspaceId: otherScope } }],
  otherRunParent: [run, [{ ...invocation, runId: otherScope }], result],
  wrongParentType: [run, [fixture.event], result],
  sameReplay: [run, [invocation, result], { ...result }],
  conflictingReplay: [run, [invocation, result], { ...result, type: 'tool.failed' }],
  lateArtifact: [{ ...run, status: 'cancelled' }, [invocation], { ...result, type: 'artifact.created' }],
};
for (const item of lifecycle.eventCases) assert.equal(acceptEvent(...scenarios[item.operation]), item.expected, item.case);

console.log(`PASS ${allowedEdges.length} transitions, ${lifecycle.transitionRejections.length} transition rejections, ${lifecycle.targetCases.length} targets, ${lifecycle.eventCases.length} event cases`);
