import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '../analytics-store';

describe('analytics-store', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('initial state has yield as active tab', () => {
    expect(useAnalyticsStore.getState().activeTab).toBe('yield');
  });

  test('setTab changes active tab', () => {
    useAnalyticsStore.getState().setTab('apc');
    expect(useAnalyticsStore.getState().activeTab).toBe('apc');
  });

  test('setYieldArea updates die area', () => {
    useAnalyticsStore.getState().setYieldArea(200);
    expect(useAnalyticsStore.getState().yieldArea).toBe(200);
  });

  test('setYieldAlpha updates cluster factor', () => {
    useAnalyticsStore.getState().setYieldAlpha(5);
    expect(useAnalyticsStore.getState().yieldAlpha).toBe(5);
  });

  test('setApcLambda updates EWMA weight', () => {
    useAnalyticsStore.getState().setApcLambda(0.5);
    expect(useAnalyticsStore.getState().apcLambda).toBe(0.5);
  });

  test('setApcLambdaSlope updates slope weight', () => {
    useAnalyticsStore.getState().setApcLambdaSlope(0.2);
    expect(useAnalyticsStore.getState().apcLambdaSlope).toBe(0.2);
  });

  test('setApcDriftType updates drift type', () => {
    useAnalyticsStore.getState().setApcDriftType('sinusoidal');
    expect(useAnalyticsStore.getState().apcDriftType).toBe('sinusoidal');
  });

  test('setRbdTopology updates topology', () => {
    useAnalyticsStore.getState().setRbdTopology('parallel');
    expect(useAnalyticsStore.getState().rbdTopology).toBe('parallel');
  });

  test('setReplicationParam updates selected parameter', () => {
    useAnalyticsStore.getState().setReplicationParam('overlay');
    expect(useAnalyticsStore.getState().replicationParam).toBe('overlay');
  });

  test('setOptimizationObjectives updates selected objectives', () => {
    useAnalyticsStore.getState().setOptimizationObjectives(['yield', 'cost']);
    expect(useAnalyticsStore.getState().optimizationObjectives).toEqual(['yield', 'cost']);
  });
});
