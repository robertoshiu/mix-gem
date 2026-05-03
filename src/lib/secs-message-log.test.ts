// src/lib/secs-message-log.test.ts
import { makeS6F11, makeS2F41Stop, makeS2F42Ack, makeS2F41Resume, makeS2F49, makeS2F50 } from './secs-message-log';

describe('makeS6F11', () => {
  it('has correct stream/function', () => {
    const event = makeS6F11('LOT-001', 5, { cd: 45.2, cdu: 2.0, ovl_x: 0.1, ovl_y: -0.1, ler: 3.1 });
    expect(event.secsMessage.stream).toBe(6);
    expect(event.secsMessage.function).toBe(11);
  });

  it('label mentions wafer number', () => {
    const event = makeS6F11('LOT-001', 5, { cd: 45.2, cdu: 2.0, ovl_x: 0.1, ovl_y: -0.1, ler: 3.1 });
    expect(event.label).toMatch(/wafer 5/i);
  });
});

describe('makeS2F41Stop', () => {
  it('has rcmd STOP', () => {
    const event = makeS2F41Stop('cd', 'rule_1');
    expect(event.secsMessage.rcmd).toBe('STOP');
  });

  it('reason encodes parameter and rule', () => {
    const event = makeS2F41Stop('cd', 'rule_1');
    const reason = event.secsMessage.params[0].cpval;
    expect(reason).toContain('cd');
    expect(reason).toContain('rule_1');
  });
});

describe('makeS2F42Ack', () => {
  it('has hcack 0', () => {
    expect(makeS2F42Ack().secsMessage.hcack).toBe(0);
  });
});

describe('makeS2F49', () => {
  it('has stream 2 function 49', () => {
    const event = makeS2F49('LITHO-193nm-v4');
    expect(event.secsMessage.stream).toBe(2);
    expect(event.secsMessage.function).toBe(49);
  });
});

describe('makeS2F41Resume', () => {
  it('has rcmd RESUME', () => {
    expect(makeS2F41Resume().secsMessage.rcmd).toBe('RESUME');
  });
});

describe('makeS2F50', () => {
  it('hcack is 0 on success', () => {
    expect(makeS2F50(true).secsMessage.hcack).toBe(0);
  });

  it('hcack is 1 on failure', () => {
    expect(makeS2F50(false).secsMessage.hcack).toBe(1);
  });
});
