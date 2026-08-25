import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { phoneMachine } from './phone-machine';

describe('phoneMachine', () => {
  it('boots into the public Standard edition', () => {
    const actor = createActor(phoneMachine).start();
    expect(actor.getSnapshot().context.edition).toBe('standard');
  });

  it('moves from boot to lock, home, app and back without losing edition', () => {
    const actor = createActor(phoneMachine).start();
    actor.send({ type: 'SET_EDITION', edition: 'standard' });
    actor.send({ type: 'SKIP_BOOT' });
    expect(actor.getSnapshot().value).toBe('locked');

    actor.send({ type: 'UNLOCK' });
    actor.send({ type: 'OPEN_APP', appId: 'memories' });
    expect(actor.getSnapshot().value).toBe('app');
    expect(actor.getSnapshot().context.activeApp).toBe('memories');

    actor.send({ type: 'SET_ORIENTATION', orientation: 'landscape' });
    actor.send({ type: 'CLOSE_APP' });
    expect(actor.getSnapshot().value).toBe('home');
    expect(actor.getSnapshot().context).toMatchObject({
      activeApp: null,
      edition: 'standard',
      orientation: 'landscape',
    });
  });

  it('clears private app state when locking', () => {
    const actor = createActor(phoneMachine).start();
    actor.send({ type: 'SKIP_BOOT' });
    actor.send({ type: 'UNLOCK' });
    actor.send({ type: 'OPEN_APP', appId: 'letters' });
    actor.send({ type: 'LOCK' });
    expect(actor.getSnapshot().value).toBe('locked');
    expect(actor.getSnapshot().context.activeApp).toBeNull();
  });
});
