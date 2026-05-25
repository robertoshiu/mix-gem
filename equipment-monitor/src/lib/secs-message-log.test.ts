// src/lib/secs-message-log.test.ts
import {
  makeS6F11, makeS2F41Stop, makeS2F42Ack, makeS2F41Resume, makeS2F49, makeS2F50,
  makeS5F1, makeS5F2, makeS1F1, makeS1F2, makeS1F3, makeS1F4,
  makeS10F1, makeS10F2, makeS6F12,
} from './secs-message-log';

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

describe('makeS5F1', () => {
  it('has stream 5 function 1 and alarm fields', () => {
    const event = makeS5F1(7042, 'CH_PRESS_OOS', 'Chamber pressure out of spec', 'CRITICAL');
    expect(event.secsMessage.stream).toBe(5);
    expect(event.secsMessage.function).toBe(1);
    expect(event.secsMessage.alid).toBe(7042);
    expect(event.secsMessage.altx).toBe('Chamber pressure out of spec');
    expect(event.type).toBe('s5f1_alarm');
  });
});

describe('makeS5F2', () => {
  it('has stream 5 function 2 with ack', () => {
    const event = makeS5F2(7042);
    expect(event.secsMessage.stream).toBe(5);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.ackc5).toBe(0);
    expect(event.type).toBe('s5f2_alarm_ack');
  });
});

describe('makeS1F1', () => {
  it('has stream 1 function 1', () => {
    const event = makeS1F1();
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(1);
    expect(event.type).toBe('s1f1_online');
  });
});

describe('makeS1F2', () => {
  it('has stream 1 function 2 with model and revision', () => {
    const event = makeS1F2('LITHO-01', '2026.05');
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.mdln).toBe('LITHO-01');
    expect(event.secsMessage.softrev).toBe('2026.05');
    expect(event.type).toBe('s1f2_online_ack');
  });
});

describe('makeS1F3', () => {
  it('has stream 1 function 3 with svid array', () => {
    const event = makeS1F3([1, 2, 100]);
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(3);
    expect(event.secsMessage.svids).toEqual([1, 2, 100]);
    expect(event.type).toBe('s1f3_status_request');
  });
});

describe('makeS1F4', () => {
  it('has stream 1 function 4 with status variables', () => {
    const vars = [{ svid: 1, name: 'ControlState', value: 'Online Remote' }];
    const event = makeS1F4(vars);
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(4);
    expect(event.secsMessage.svs).toEqual(vars);
    expect(event.type).toBe('s1f4_status_reply');
  });
});

describe('makeS10F1', () => {
  it('has stream 10 function 1 with terminal text', () => {
    const event = makeS10F1(1, 'LOT COMPLETE');
    expect(event.secsMessage.stream).toBe(10);
    expect(event.secsMessage.function).toBe(1);
    expect(event.secsMessage.text).toBe('LOT COMPLETE');
    expect(event.type).toBe('s10f1_terminal');
  });
});

describe('makeS10F2', () => {
  it('has stream 10 function 2 with ack', () => {
    const event = makeS10F2(1);
    expect(event.secsMessage.stream).toBe(10);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.ackc10).toBe(0);
    expect(event.type).toBe('s10f2_terminal_ack');
  });
});

describe('makeS6F12', () => {
  it('has stream 6 function 12 with ack', () => {
    const event = makeS6F12();
    expect(event.secsMessage.stream).toBe(6);
    expect(event.secsMessage.function).toBe(12);
    expect(event.secsMessage.ceack).toBe(0);
    expect(event.type).toBe('s6f12_collection_ack');
  });
});
