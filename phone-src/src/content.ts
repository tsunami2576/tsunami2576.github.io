export type Memory = {
  id: string;
  date: string;
  title: string;
  caption: string;
  coordinate: string;
  tone: 'coral' | 'jade' | 'sky' | 'gold' | 'rose' | 'violet';
  mark: string;
};

export type StoryBeat = {
  chapter: string;
  kicker: string;
  title: string;
  body: string;
  signal: string;
  coordinate: [number, number];
  tone: 'coral' | 'jade' | 'sky' | 'gold';
};

export type Letter = {
  id: string;
  date: string;
  title: string;
  preview: string;
  unread?: boolean;
  locked?: boolean;
  body?: string[];
  quote?: string;
  signature?: string;
};

export type PrivatePreview = {
  kicker: string;
  title: string;
  detail: string;
};

export type PrivateContent = {
  branding: {
    eyebrow: string;
    title: string;
    tagline: string;
    lockCaption: string;
    notificationTitle: string;
    notificationBody: string;
    memoryRange: string;
    memoryTitle: string;
    memoryDetail: string;
  };
  appKickers: Record<string, string>;
  memories: Memory[];
  storyBeats: StoryBeat[];
  letters: Letter[];
  previews: Record<'music' | 'atlas' | 'vault', PrivatePreview>;
};

export type PrivateContentSession = {
  content: PrivateContent;
  dispose: () => void;
};

export const privateAppIds = new Set(['story', 'atlas', 'vault', 'memories', 'letters', 'music']);
