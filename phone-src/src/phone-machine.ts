import { assign, setup } from 'xstate';

export type AppId = 'memories' | 'story' | 'garden' | 'letters' | 'music' | 'atlas' | 'vault' | 'settings';
export type EditionId = 'standard' | 'ad-astra';
export type Orientation = 'portrait' | 'landscape';

type PhoneContext = {
  activeApp: AppId | null;
  edition: EditionId;
  orientation: Orientation;
};

type PhoneEvent =
  | { type: 'SKIP_BOOT' }
  | { type: 'UNLOCK' }
  | { type: 'LOCK' }
  | { type: 'OPEN_APP'; appId: AppId }
  | { type: 'CLOSE_APP' }
  | { type: 'SET_EDITION'; edition: EditionId }
  | { type: 'SET_ORIENTATION'; orientation: Orientation };

export const phoneMachine = setup({
  types: {
    context: {} as PhoneContext,
    events: {} as PhoneEvent,
  },
  actions: {
    openApp: assign({ activeApp: ({ event }) => event.type === 'OPEN_APP' ? event.appId : null }),
    closeApp: assign({ activeApp: null }),
    setEdition: assign({ edition: ({ event }) => event.type === 'SET_EDITION' ? event.edition : 'standard' }),
    setOrientation: assign({ orientation: ({ event }) => event.type === 'SET_ORIENTATION' ? event.orientation : 'portrait' }),
  },
}).createMachine({
  id: 'lumi-phone',
  initial: 'booting',
  context: {
    activeApp: null,
    edition: 'standard',
    orientation: 'portrait',
  },
  on: {
    SET_EDITION: { actions: 'setEdition' },
    SET_ORIENTATION: { actions: 'setOrientation' },
  },
  states: {
    booting: {
      after: { 1500: 'locked' },
      on: { SKIP_BOOT: 'locked' },
    },
    locked: {
      entry: 'closeApp',
      on: { UNLOCK: 'home' },
    },
    home: {
      on: {
        OPEN_APP: { target: 'app', actions: 'openApp' },
        LOCK: 'locked',
      },
    },
    app: {
      on: {
        CLOSE_APP: { target: 'home', actions: 'closeApp' },
        OPEN_APP: { actions: 'openApp' },
        LOCK: 'locked',
      },
    },
  },
});
