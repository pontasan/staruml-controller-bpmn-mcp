#!/usr/bin/env node
import { apiGet, apiPost, apiDelete, encId, runTest } from './test-utils.mjs';

const DIR = import.meta.dirname;

await runTest('bpmn', DIR, async (ctx) => {
  // Create BPMN diagram
  let s = ctx.step('Create BPMN diagram');
  let diagramId;
  try {
    const res = await apiPost('/api/bpmn/diagrams', { name: 'Test BPMN' });
    diagramId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create participant (pool)
  s = ctx.step('Create participant (pool)');
  let partId;
  try {
    const res = await apiPost('/api/bpmn/participants', { diagramId, name: 'Order Process', x1: 30, y1: 30, x2: 700, y2: 300 });
    partId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Get participant view ID for tailViewId
  s = ctx.step('Get participant view ID');
  let partViewId;
  try {
    const res = await apiGet(`/api/diagrams/${encId(diagramId)}/views`);
    const pv = res.data.find(v => v.modelId === partId);
    if (!pv) throw new Error('Participant view not found');
    partViewId = pv._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create start event inside participant
  s = ctx.step('Create start event');
  let startId;
  try {
    const res = await apiPost('/api/bpmn/events', { diagramId, type: 'BPMNStartEvent', name: 'Order Received', tailViewId: partViewId, x1: 80, y1: 120, x2: 120, y2: 160 });
    startId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create task inside participant
  s = ctx.step('Create task (Process Order)');
  let taskId;
  try {
    const res = await apiPost('/api/bpmn/tasks', { diagramId, type: 'BPMNUserTask', name: 'Process Order', tailViewId: partViewId, x1: 180, y1: 100, x2: 310, y2: 180 });
    taskId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create gateway
  s = ctx.step('Create exclusive gateway');
  let gwId;
  try {
    const res = await apiPost('/api/bpmn/gateways', { diagramId, type: 'BPMNExclusiveGateway', name: 'Valid?', tailViewId: partViewId, x1: 370, y1: 115, x2: 420, y2: 165 });
    gwId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create end event
  s = ctx.step('Create end event');
  let endId;
  try {
    const res = await apiPost('/api/bpmn/events', { diagramId, type: 'BPMNEndEvent', name: 'Order Completed', tailViewId: partViewId, x1: 500, y1: 120, x2: 540, y2: 160 });
    endId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // Create sequence flows
  s = ctx.step('Flow: Start → Task');
  try {
    await apiPost('/api/bpmn/sequence-flows', { diagramId, sourceId: startId, targetId: taskId });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Flow: Task → Gateway');
  try {
    await apiPost('/api/bpmn/sequence-flows', { diagramId, sourceId: taskId, targetId: gwId });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Flow: Gateway → End');
  try {
    await apiPost('/api/bpmn/sequence-flows', { diagramId, sourceId: gwId, targetId: endId, condition: 'approved' });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  await ctx.exportDiagram(diagramId, 'Export BPMN image');

  s = ctx.step('Delete diagram');
  try {
    await apiDelete(`/api/bpmn/diagrams/${encId(diagramId)}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }
});
