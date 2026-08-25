import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  BatteryMedium,
  BookOpenText,
  ChevronRight,
  ChevronUp,
  CirclePlay,
  Compass,
  Droplets,
  Eye,
  EyeOff,
  Flower2,
  Images,
  KeyRound,
  Leaf,
  LockKeyhole,
  Mail,
  MapPinned,
  Music2,
  Palette,
  RotateCw,
  Settings2,
  Signal,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { privateAppIds, type Letter, type Memory, type PrivateContent, type PrivateContentSession } from './content';
import { PrivateContentError, unlockPrivateContent } from './private-content';
import { loadPersistedState, savePersistedState, type PersistedPhoneState } from './persistence';
import { phoneMachine, type AppId, type EditionId, type Orientation } from './phone-machine';

type AppDefinition = {
  id: AppId;
  name: string;
  kicker: string;
  icon: LucideIcon;
  tone: string;
};

type LaunchInset = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  x: number;
  y: number;
};

const APPS: AppDefinition[] = [
  { id: 'story', name: 'Story', kicker: 'Narrative', icon: BookOpenText, tone: 'coral' },
  { id: 'garden', name: 'Garden', kicker: 'Daily growth', icon: Sprout, tone: 'jade' },
  { id: 'atlas', name: 'Atlas', kicker: 'Coordinates', icon: MapPinned, tone: 'sky' },
  { id: 'vault', name: 'Vault', kicker: 'Protected', icon: KeyRound, tone: 'gold' },
  { id: 'memories', name: 'Memories', kicker: 'Gallery', icon: Images, tone: 'rose' },
  { id: 'letters', name: 'Letters', kicker: 'Notes', icon: Mail, tone: 'paper' },
  { id: 'music', name: 'Music', kicker: 'Audio', icon: Music2, tone: 'violet' },
  { id: 'settings', name: 'Settings', kicker: 'System', icon: Settings2, tone: 'graphite' },
];

const APP_MAP = new Map(APPS.map((app) => [app.id, app]));

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    time: new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
    date: new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now),
  };
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

const DEFAULT_INSET: LaunchInset = { top: 420, right: 160, bottom: 210, left: 160, x: 195, y: 500 };

export function App() {
  const [snapshot, send] = useMachine(phoneMachine);
  const reducedMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const persistedRef = useRef<Partial<PersistedPhoneState> | null>(null);
  if (persistedRef.current === null) persistedRef.current = loadPersistedState(window.localStorage);
  const persisted = persistedRef.current;
  const [launchInset, setLaunchInset] = useState<LaunchInset>(DEFAULT_INSET);
  const [isRotating, setIsRotating] = useState(false);
  const [orientationPulse, setOrientationPulse] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [haloExpanded, setHaloExpanded] = useState(false);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [storyIndex, setStoryIndex] = useState(() => persisted.storyIndex ?? 0);
  const [gardenGrowth, setGardenGrowth] = useState(() => persisted.gardenGrowth ?? 38);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [privateSession, setPrivateSession] = useState<PrivateContentSession | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [volume, setVolume] = useState(() => persisted.volume ?? 60);
  const [volumeHudVisible, setVolumeHudVisible] = useState(false);
  const privateSessionRef = useRef<PrivateContentSession | null>(null);
  const unlockAttemptRef = useRef(0);
  const volumeHudTimerRef = useRef(0);
  const homeSwipeStartRef = useRef<number | null>(null);
  const { time, date } = useClock();
  const edition = snapshot.context.edition;
  const orientation = snapshot.context.orientation;
  const activeApp = snapshot.context.activeApp;
  const stateName = String(snapshot.value);
  const privateContent = privateSession?.content ?? null;

  const shellStyle = {
    '--launch-x': `${launchInset.x}px`,
    '--launch-y': `${launchInset.y}px`,
    '--icon-top': `${launchInset.top}px`,
    '--icon-right': `${launchInset.right}px`,
    '--icon-bottom': `${launchInset.bottom}px`,
    '--icon-left': `${launchInset.left}px`,
  } as CSSProperties;

  function measureIcon(element: HTMLElement): LaunchInset | null {
    const screen = screenRef.current?.getBoundingClientRect();
    const icon = (element.querySelector('.app-icon') ?? element).getBoundingClientRect();
    if (!screen) return null;
    return {
      top: icon.top - screen.top,
      right: screen.right - icon.right,
      bottom: screen.bottom - icon.bottom,
      left: icon.left - screen.left,
      x: icon.left + icon.width / 2 - screen.left,
      y: icon.top + icon.height / 2 - screen.top,
    };
  }

  function openApp(appId: AppId, element: HTMLElement) {
    const inset = measureIcon(element);
    if (inset) setLaunchInset(inset);
    setHaloExpanded(false);
    send({ type: 'OPEN_APP', appId });
  }

  function closeApp() {
    if (isClosing) return;
    if (activeApp) {
      const iconElement = screenRef.current?.querySelector<HTMLElement>(`[data-app="${activeApp}"]`);
      const inset = iconElement ? measureIcon(iconElement) : null;
      if (inset) setLaunchInset(inset);
    }
    if (reducedMotion) {
      send({ type: 'CLOSE_APP' });
      setActiveMemory(null);
      setSelectedLetter(null);
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => {
      send({ type: 'CLOSE_APP' });
      setIsClosing(false);
      setActiveMemory(null);
      setSelectedLetter(null);
    }, 300);
  }

  async function rotateDevice() {
    if (isRotating) return;
    const nextOrientation: Orientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    const shell = shellRef.current;
    const compact = window.matchMedia('(max-width: 720px)').matches;
    if (!shell || reducedMotion || compact) {
      send({ type: 'SET_ORIENTATION', orientation: nextOrientation });
      return;
    }

    setIsRotating(true);
    await wait(130);
    const turn = nextOrientation === 'landscape' ? 90 : -90;
    const spin = shell.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: `rotate(${turn}deg) scale(.92)` },
      ],
      { duration: 300, easing: 'cubic-bezier(.6,.04,.32,1)', fill: 'forwards' },
    );
    await spin.finished.catch(() => undefined);
    send({ type: 'SET_ORIENTATION', orientation: nextOrientation });
    await nextFrame();
    spin.cancel();
    const settle = shell.animate(
      [
        { transform: 'scale(.92)' },
        { transform: 'scale(1)' },
      ],
      { duration: 360, easing: 'cubic-bezier(.18,1,.28,1)' },
    );
    await settle.finished.catch(() => undefined);
    setIsRotating(false);
  }

  function nudgeVolume(delta: number) {
    setVolume((value) => Math.max(0, Math.min(100, value + delta)));
    setVolumeHudVisible(true);
    window.clearTimeout(volumeHudTimerRef.current);
    volumeHudTimerRef.current = window.setTimeout(() => setVolumeHudVisible(false), 1500);
  }

  function pressPower() {
    if (snapshot.matches('booting')) return;
    if (snapshot.matches('locked')) {
      send({ type: 'UNLOCK' });
      return;
    }
    lockDevice();
  }

  function onHomeIndicatorPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    homeSwipeStartRef.current = event.clientY;
  }

  function onHomeIndicatorPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = homeSwipeStartRef.current;
    homeSwipeStartRef.current = null;
    if (start !== null && start - event.clientY > 18 && snapshot.matches('app')) closeApp();
  }

  function releasePrivateEdition() {
    unlockAttemptRef.current += 1;
    privateSessionRef.current?.dispose();
    privateSessionRef.current = null;
    setPrivateSession(null);
    setActiveMemory(null);
    setSelectedLetter(null);
    setStoryIndex(0);
    send({ type: 'SET_EDITION', edition: 'standard' });
  }

  function requestEdition(next: EditionId) {
    if (next === 'standard') {
      releasePrivateEdition();
      return;
    }
    if (privateSessionRef.current) {
      send({ type: 'SET_EDITION', edition: 'ad-astra' });
      return;
    }
    setGateOpen(true);
  }

  async function unlockEdition(password: string) {
    const attempt = unlockAttemptRef.current + 1;
    unlockAttemptRef.current = attempt;
    try {
      const session = await unlockPrivateContent(password);
      if (attempt !== unlockAttemptRef.current) {
        session.dispose();
        return null;
      }
      privateSessionRef.current?.dispose();
      privateSessionRef.current = session;
      setPrivateSession(session);
      send({ type: 'SET_EDITION', edition: 'ad-astra' });
      setGateOpen(false);
      return null;
    } catch (error) {
      if (error instanceof PrivateContentError && error.reason === 'invalid-password') return '密码不正确，请再试一次。';
      if (error instanceof PrivateContentError && error.reason === 'unsupported') return '当前浏览器不支持安全解锁。';
      return '暂时无法读取加密内容，请稍后重试。';
    }
  }

  function cancelEditionGate() {
    unlockAttemptRef.current += 1;
    setGateOpen(false);
  }

  function toggleEdition() {
    requestEdition(edition === 'ad-astra' ? 'standard' : 'ad-astra');
  }

  function lockDevice() {
    setGateOpen(false);
    releasePrivateEdition();
    send({ type: 'LOCK' });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (gateOpen) cancelEditionGate();
        else if (activeMemory) setActiveMemory(null);
        else if (selectedLetter) setSelectedLetter(null);
        else if (snapshot.matches('app')) closeApp();
      }
      if (event.key === 'Enter' && snapshot.matches('locked') && !gateOpen) send({ type: 'UNLOCK' });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMemory, selectedLetter, snapshot, reducedMotion, gateOpen]);

  useEffect(() => () => privateSessionRef.current?.dispose(), []);

  useEffect(() => () => window.clearTimeout(volumeHudTimerRef.current), []);

  useEffect(() => {
    if (!haloExpanded) return;
    const timer = window.setTimeout(() => setHaloExpanded(false), 3200);
    return () => window.clearTimeout(timer);
  }, [haloExpanded]);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (persisted.orientation) send({ type: 'SET_ORIENTATION', orientation: persisted.orientation });
  }, [send, persisted.orientation]);

  useEffect(() => {
    savePersistedState(window.localStorage, {
      orientation,
      gardenGrowth,
      storyIndex,
      volume,
    });
  }, [orientation, gardenGrowth, storyIndex, volume]);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const landscape = window.matchMedia('(orientation: landscape)');
    if (!coarsePointer.matches) return;

    let firstSync = true;
    const syncPhysicalOrientation = () => {
      send({ type: 'SET_ORIENTATION', orientation: landscape.matches ? 'landscape' : 'portrait' });
      if (firstSync) {
        firstSync = false;
        return;
      }
      setOrientationPulse(true);
      window.setTimeout(() => setOrientationPulse(false), 240);
    };
    syncPhysicalOrientation();
    landscape.addEventListener('change', syncPhysicalOrientation);
    return () => landscape.removeEventListener('change', syncPhysicalOrientation);
  }, [send]);

  return (
    <main className={`device-stage edition-${edition}`} data-edition={edition}>
      <div className="stage-scrim" aria-hidden="true" />
      <div className="edition-signature" aria-hidden="true">
        <span>{edition === 'ad-astra' ? 'AD ASTRA' : 'LUMI STANDARD'}</span>
        <small>{orientation.toUpperCase()}</small>
      </div>

      <div
        ref={shellRef}
        className={`phone-shell ${isRotating ? 'is-rotating' : ''}`}
        data-orientation={orientation}
        data-state={stateName}
        data-edition={edition}
        style={shellStyle}
      >
        <button
          className="hardware-button hardware-volume-up"
          type="button"
          onClick={() => nudgeVolume(12)}
          aria-label="音量增"
          title="音量增"
        />
        <button
          className="hardware-button hardware-volume-down"
          type="button"
          onClick={() => nudgeVolume(-12)}
          aria-label="音量减"
          title="音量减"
        />
        <button
          className="hardware-button hardware-power"
          type="button"
          onClick={pressPower}
          aria-label="电源键"
          title="锁定 / 唤醒"
        />
        <div ref={screenRef} className="phone-screen">
          {snapshot.matches('booting') && <BootScreen onSkip={() => send({ type: 'SKIP_BOOT' })} edition={edition} />}
          {snapshot.matches('locked') && (
            <LockScreen
              privateContent={privateContent}
              time={time}
              date={date}
              onUnlock={() => send({ type: 'UNLOCK' })}
            />
          )}
          {(snapshot.matches('home') || snapshot.matches('app')) && (
            <div className={`home-layer ${snapshot.matches('app') ? 'is-covered' : ''}`}>
              <HomeScreen
                privateContent={privateContent}
                time={time}
                haloExpanded={haloExpanded}
                onToggleHalo={() => setHaloExpanded((value) => !value)}
                onOpenApp={openApp}
              />
            </div>
          )}
          {snapshot.matches('app') && activeApp && (
            <AppView
              appId={activeApp}
              edition={edition}
              privateContent={privateContent}
              isClosing={isClosing}
              activeMemory={activeMemory}
              storyIndex={storyIndex}
              gardenGrowth={gardenGrowth}
              selectedLetter={selectedLetter}
              onClose={closeApp}
              onSelectMemory={setActiveMemory}
              onStoryNext={() => setStoryIndex((value) => privateContent ? (value + 1) % privateContent.storyBeats.length : 0)}
              onStorySelect={setStoryIndex}
              onGardenGrow={() => setGardenGrowth((value) => Math.min(100, value + 12))}
              onSelectLetter={setSelectedLetter}
              onSetEdition={requestEdition}
              onRequestPrivateEdition={() => setGateOpen(true)}
            />
          )}
          {(snapshot.matches('home') || snapshot.matches('app')) && (
            <button
              className={`home-indicator ${snapshot.matches('app') ? 'is-live' : ''}`}
              type="button"
              onClick={() => snapshot.matches('app') && closeApp()}
              onPointerDown={onHomeIndicatorPointerDown}
              onPointerUp={onHomeIndicatorPointerUp}
              aria-label="主屏幕按钮"
              title={snapshot.matches('app') ? '返回主屏幕（可上滑）' : '主屏幕'}
            >
              <span />
            </button>
          )}
          {volumeHudVisible && (
            <div className="volume-hud" role="status">
              <Volume2 size={14} />
              <span className="volume-bars" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
                  <i key={step} className={volume > step * 12.5 ? 'is-on' : ''} />
                ))}
              </span>
            </div>
          )}
          {gateOpen && <EditionGate onCancel={cancelEditionGate} onUnlock={unlockEdition} />}
          <div
            className={`orientation-veil ${isRotating ? 'is-visible' : ''} ${orientationPulse ? 'is-soft' : ''}`}
            aria-hidden="true"
          >
            <RotateCw size={22} />
          </div>
        </div>
      </div>

      {!snapshot.matches('booting') && (
        <nav className="prototype-tools" aria-label="设备控制">
          <button type="button" onClick={toggleEdition} aria-label="切换 Edition" title="切换 Edition">
            <Palette />
          </button>
          <button className="orientation-control" type="button" onClick={rotateDevice} aria-label="切换横竖屏" title="切换横竖屏">
            <RotateCw />
          </button>
          <button type="button" onClick={lockDevice} aria-label="锁定设备" title="锁定设备">
            <LockKeyhole />
          </button>
        </nav>
      )}
    </main>
  );
}

function BootScreen({ onSkip, edition }: { onSkip: () => void; edition: EditionId }) {
  return (
    <button className="boot-screen" type="button" onClick={onSkip} aria-label="跳过启动动画">
      <span className="lumi-mark" aria-hidden="true"><span /></span>
      <span className="boot-copy">Lumi Phone</span>
      <small>{edition === 'ad-astra' ? 'AD ASTRA EDITION' : 'STANDARD EDITION'}</small>
      <span className="boot-progress" aria-hidden="true"><span /></span>
    </button>
  );
}

function EditionGate({
  onCancel,
  onUnlock,
}: {
  onCancel: () => void;
  onUnlock: (password: string) => Promise<string | null>;
}) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    const message = await onUnlock(password);
    if (message) {
      setError(message);
      setPassword('');
      setLoading(false);
    }
  }

  return (
    <div className="edition-gate" role="presentation">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-gate-title"
        className={error ? 'is-error' : undefined}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="gate-close" type="button" onClick={onCancel} aria-label="取消解锁" title="取消解锁"><ArrowLeft /></button>
        <span className="gate-mark"><ShieldCheck /></span>
        <p>PROTECTED EDITION</p>
        <h2 id="edition-gate-title">进入 Ad Astra</h2>
        <span className="gate-description">私人内容保持加密，验证成功后才会在本次会话中打开。</span>
        <form onSubmit={submit}>
          <label htmlFor="edition-password">访问密码</label>
          <div className="password-field">
            <LockKeyhole />
            <input
              id="edition-password"
              name="edition-password"
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(error)}
            />
            <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? '隐藏密码' : '显示密码'} title={visible ? '隐藏密码' : '显示密码'}>
              {visible ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <span className={`gate-error ${error ? 'is-visible' : ''}`} role="alert">{error ?? '占位'}</span>
          <button className="gate-submit" type="submit" disabled={!password || loading}>
            <ShieldCheck />
            <b>{loading ? '正在验证…' : '解锁 Edition'}</b>
          </button>
        </form>
        <small>退出 Edition 或锁定设备后，私人内容会立即移出界面。</small>
      </motion.section>
    </div>
  );
}

function LockScreen({
  privateContent,
  time,
  date,
  onUnlock,
}: {
  privateContent: PrivateContent | null;
  time: string;
  date: string;
  onUnlock: () => void;
}) {
  return (
    <section
      className={`lock-screen ${privateContent ? 'is-private' : ''}`}
      aria-label="锁屏"
    >
      <div className="lock-shade" aria-hidden="true" />
      <StatusBar time={time} dark />
      <motion.div
        className="lock-content"
        drag="y"
        dragConstraints={{ top: -150, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y < -65 || info.velocity.y < -480) onUnlock();
        }}
      >
        <div className="lock-heading">
          <p>{date}</p>
          <time>{time}</time>
          <span>{privateContent?.branding.lockCaption ?? 'Lumi Standard'}</span>
        </div>

        <button className="lock-notification" type="button" onClick={onUnlock}>
          <span className="notification-icon"><Mail size={18} /></span>
          <span>
            <b>{privateContent?.branding.notificationTitle ?? 'LumiOS'}</b>
            <small>{privateContent?.branding.notificationBody ?? '系统已准备就绪'}</small>
          </span>
          <time>现在</time>
        </button>

        <button className="unlock-handle" type="button" onClick={onUnlock} aria-label="解锁" title="解锁">
          <ChevronUp />
        </button>
      </motion.div>
    </section>
  );
}

function StatusBar({ time, dark = false }: { time: string; dark?: boolean }) {
  return (
    <div className={`status-bar ${dark ? 'is-light' : ''}`}>
      <time>{time}</time>
      <div className="status-icons" aria-label="网络与电量状态">
        <Signal size={13} strokeWidth={2.2} />
        <Wifi size={14} strokeWidth={2.2} />
        <BatteryMedium size={17} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function Halo({
  expanded,
  onToggle,
  title,
  message,
}: {
  expanded: boolean;
  onToggle: () => void;
  title: string;
  message: string;
}) {
  return (
    <button className={`halo ${expanded ? 'is-expanded' : ''}`} type="button" onClick={onToggle} aria-expanded={expanded}>
      <span className="halo-core"><Star size={13} fill="currentColor" /></span>
      {expanded ? (
        <span className="halo-message"><b>{title}</b><small>{message}</small></span>
      ) : (
        <span className="halo-dot" aria-label="一条未读通知" />
      )}
    </button>
  );
}

function HomeScreen({
  privateContent,
  time,
  haloExpanded,
  onToggleHalo,
  onOpenApp,
}: {
  privateContent: PrivateContent | null;
  time: string;
  haloExpanded: boolean;
  onToggleHalo: () => void;
  onOpenApp: (appId: AppId, element: HTMLElement) => void;
}) {
  const mainApps = APPS.slice(0, 4);
  const dockApps = APPS.slice(4);

  return (
    <section
      className={`home-screen ${privateContent ? 'is-private' : ''}`}
      aria-label="主屏幕"
    >
      <div className="home-shade" aria-hidden="true" />
      <StatusBar time={time} dark />
      <Halo
        expanded={haloExpanded}
        onToggle={onToggleHalo}
        title={privateContent?.branding.notificationTitle ?? 'LumiOS'}
        message={privateContent?.branding.notificationBody ?? '系统已准备就绪'}
      />

      <div className="home-copy">
        <p>{privateContent?.branding.eyebrow ?? 'LUMI PHONE'}</p>
        <h1>{privateContent?.branding.title ?? 'Good afternoon'}</h1>
        <span>{privateContent?.branding.tagline ?? 'Tuesday · Clear'}</span>
      </div>

      <div className="app-grid" aria-label="App">
        {mainApps.map((app) => <AppIcon key={app.id} app={app} locked={!privateContent && privateAppIds.has(app.id)} onOpen={onOpenApp} />)}
      </div>

      <div className="home-page-dots" aria-hidden="true"><span className="active" /><span /></div>

      <div className="dock" aria-label="Dock">
        {dockApps.map((app) => <AppIcon key={app.id} app={app} compact locked={!privateContent && privateAppIds.has(app.id)} onOpen={onOpenApp} />)}
      </div>
    </section>
  );
}

function AppIcon({
  app,
  compact = false,
  locked = false,
  onOpen,
}: {
  app: AppDefinition;
  compact?: boolean;
  locked?: boolean;
  onOpen: (appId: AppId, element: HTMLElement) => void;
}) {
  const Icon = app.icon;
  return (
    <button
      className={`app-icon-button ${compact ? 'is-compact' : ''}`}
      type="button"
      onClick={(event) => onOpen(app.id, event.currentTarget)}
      data-app={app.id}
      aria-label={`打开 ${app.name}`}
    >
      <span className={`app-icon tone-${app.tone}`}><Icon />{locked && <LockKeyhole className="app-lock-mark" />}</span>
      {!compact && <span className="app-label">{app.name}</span>}
    </button>
  );
}

type AppViewProps = {
  appId: AppId;
  edition: EditionId;
  privateContent: PrivateContent | null;
  isClosing: boolean;
  activeMemory: Memory | null;
  storyIndex: number;
  gardenGrowth: number;
  selectedLetter: string | null;
  onClose: () => void;
  onSelectMemory: (memory: Memory | null) => void;
  onStoryNext: () => void;
  onStorySelect: (index: number) => void;
  onGardenGrow: () => void;
  onSelectLetter: (id: string | null) => void;
  onSetEdition: (edition: EditionId) => void;
  onRequestPrivateEdition: () => void;
};

function AppView(props: AppViewProps) {
  const definition = APP_MAP.get(props.appId)!;
  const Icon = definition.icon;
  let content: ReactNode;

  if (privateAppIds.has(props.appId) && !props.privateContent) {
    content = <PrivateSpace appName={definition.name} onUnlock={props.onRequestPrivateEdition} />;
  } else switch (props.appId) {
    case 'memories':
      content = <MemoriesApp content={props.privateContent!} active={props.activeMemory} onSelect={props.onSelectMemory} />;
      break;
    case 'story':
      content = <StoryApp content={props.privateContent!} index={props.storyIndex} onNext={props.onStoryNext} onSelect={props.onStorySelect} />;
      break;
    case 'garden':
      content = <GardenApp growth={props.gardenGrowth} onGrow={props.onGardenGrow} />;
      break;
    case 'letters':
      content = <LettersApp letters={props.privateContent!.letters} selected={props.selectedLetter} onSelect={props.onSelectLetter} />;
      break;
    case 'settings':
      content = <SettingsApp edition={props.edition} onSetEdition={props.onSetEdition} />;
      break;
    default:
      content = <PreviewApp appId={props.appId} icon={Icon} content={props.privateContent!} />;
  }

  return (
    <section className={`app-view app-${props.appId} ${props.isClosing ? 'is-closing' : ''}`} data-active-app={props.appId}>
      <div className="app-surface">
        <header className="app-header">
          <button type="button" onClick={props.onClose} aria-label="返回主屏幕" title="返回主屏幕"><ArrowLeft /></button>
          <div><span>{props.privateContent?.appKickers[props.appId] ?? definition.kicker}</span><h2>{definition.name}</h2></div>
          <span className={`mini-app-icon tone-${definition.tone}`}><Icon /></span>
        </header>
        <div className="app-body">{content}</div>
      </div>
    </section>
  );
}

function MemoriesApp({
  content,
  active,
  onSelect,
}: {
  content: PrivateContent;
  active: Memory | null;
  onSelect: (memory: Memory | null) => void;
}) {
  if (active) {
    return (
      <article className="memory-detail">
        <button type="button" onClick={() => onSelect(null)} aria-label="返回记忆列表" title="返回记忆列表"><ArrowLeft /></button>
        <div className={`memory-field memory-tone-${active.tone}`} aria-hidden="true">
          <span className="memory-crosshair" />
          <b>{active.mark}</b>
          <small>{active.coordinate}</small>
        </div>
        <div className="memory-detail-copy"><p>{active.date}</p><h3>{active.title}</h3><span>{active.caption}</span></div>
      </article>
    );
  }

  return (
    <div className="memories-layout">
      <div className="memory-intro"><span>{content.branding.memoryRange}</span><h3>{content.branding.memoryTitle}</h3><p>{content.branding.memoryDetail}</p></div>
      <div className="memory-grid">
        {content.memories.map((memory, index) => (
          <button key={memory.id} type="button" onClick={() => onSelect(memory)} className={index === 0 ? 'is-featured' : ''}>
            <span className={`memory-map memory-tone-${memory.tone}`} aria-hidden="true"><i /><i /><i /><strong>{memory.mark}</strong></span>
            <span className="memory-card-copy"><small>{memory.date}</small><b>{memory.title}</b><em>{memory.coordinate}</em></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoryApp({
  content,
  index,
  onNext,
  onSelect,
}: {
  content: PrivateContent;
  index: number;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  const beat = content.storyBeats[index];
  return (
    <article className={`story-scene story-tone-${beat.tone}`}>
      <motion.div
        className="story-cosmos"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.06}
        onDragEnd={(_, info) => {
          if (info.offset.x < -44 || info.velocity.x < -380) onNext();
          if (info.offset.x > 44 || info.velocity.x > 380) onSelect((index - 1 + content.storyBeats.length) % content.storyBeats.length);
        }}
      >
        <span className="story-axis axis-x" aria-hidden="true" />
        <span className="story-axis axis-y" aria-hidden="true" />
        <svg className="story-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={content.storyBeats.map((item) => item.coordinate.join(',')).join(' ')} />
        </svg>
        {content.storyBeats.map((item, itemIndex) => (
          <button
            key={item.chapter}
            className={`story-node node-${item.tone} ${itemIndex === index ? 'is-active' : ''} ${itemIndex < index ? 'is-read' : ''}`}
            style={{ left: `${item.coordinate[0]}%`, top: `${item.coordinate[1]}%` }}
            type="button"
            onClick={() => onSelect(itemIndex)}
            aria-label={`打开第 ${item.chapter} 幕：${item.title}`}
          >
            <span /><small>{item.chapter}</small>
          </button>
        ))}
        <div className="story-bearing" aria-hidden="true"><span>N</span><i /></div>
        <div className="story-signal"><small>LIVE SIGNAL</small><b>{beat.signal}</b></div>
      </motion.div>
      <div className="story-narrative">
        <div className="story-progress" aria-label={`第 ${index + 1} 幕，共 ${content.storyBeats.length} 幕`}>
          {content.storyBeats.map((item, itemIndex) => <button key={item.chapter} type="button" onClick={() => onSelect(itemIndex)} className={itemIndex <= index ? 'is-read' : ''} aria-label={`第 ${itemIndex + 1} 幕`} />)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            className="story-copy"
            key={beat.chapter}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24 }}
          >
            <p>{beat.kicker} · {beat.chapter}</p>
            <h3>{beat.title}</h3>
            <span>{beat.body}</span>
            <button type="button" onClick={onNext}>{index === content.storyBeats.length - 1 ? <Sparkles /> : <ChevronRight />}<b>{index === content.storyBeats.length - 1 ? '回到原点' : '前往下一坐标'}</b></button>
          </motion.div>
        </AnimatePresence>
      </div>
    </article>
  );
}

function GardenApp({ growth, onGrow }: { growth: number; onGrow: () => void }) {
  const isBlooming = growth >= 86;
  return (
    <div className="garden-layout">
      <div className="garden-sky"><span>DAY 18</span><Sparkles aria-hidden="true" /></div>
      <div className={`garden-plant ${isBlooming ? 'is-blooming' : ''}`} aria-label={`花园成长 ${growth}%`}>
        <span className="plant-glow" />
        {isBlooming ? <Flower2 /> : <Sprout />}
        <span className="plant-ground" />
      </div>
      <div className="garden-copy">
        <p>今日的枝叶很安静。</p>
        <h3>{isBlooming ? '第一朵花开了' : '正在长出新的叶子'}</h3>
        <div className="growth-track"><span style={{ width: `${growth}%` }} /></div>
        <button type="button" onClick={onGrow} disabled={growth >= 100}><Droplets /><b>{growth >= 100 ? '今天已经照顾好了' : '浇一点水'}</b></button>
      </div>
    </div>
  );
}

function LettersApp({ letters, selected, onSelect }: { letters: Letter[]; selected: string | null; onSelect: (id: string | null) => void }) {
  if (selected) {
    const letter = letters.find((item) => item.id === selected)!;
    return (
      <article className="letter-reader">
        <button type="button" onClick={() => onSelect(null)} aria-label="返回收件箱" title="返回收件箱"><ArrowLeft /></button>
        <p>{letter.date} · FOR YOU</p>
        <h3>{letter.title}</h3>
        <div className="letter-rule" />
        {letter.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {letter.quote && <blockquote>{letter.quote}</blockquote>}
        {letter.signature && <strong>{letter.signature}</strong>}
      </article>
    );
  }

  return (
    <div className="letters-layout">
      <div className="letters-count"><b>03</b><span>封信<br />保存在这里</span></div>
      <div className="letter-list">
        {letters.map((letter) => (
          <button key={letter.id} type="button" onClick={() => !letter.locked && onSelect(letter.id)} disabled={letter.locked}>
            <span className="letter-mark">{letter.locked ? <KeyRound /> : <Mail />}{letter.unread && <i />}</span>
            <span><small>{letter.date}</small><b>{letter.title}</b><em>{letter.preview}</em></span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </div>
  );
}

function PrivateSpace({ appName, onUnlock }: { appName: string; onUnlock: () => void }) {
  return (
    <div className="private-space">
      <span className="private-space-mark"><LockKeyhole /></span>
      <p>PRIVATE SPACE</p>
      <h3>{appName} 保持封存</h3>
      <span>Standard Edition 不读取这个空间里的任何内容。</span>
      <button type="button" onClick={onUnlock}><ShieldCheck /><b>解锁 Ad Astra</b></button>
    </div>
  );
}

function SettingsApp({ edition, onSetEdition }: { edition: EditionId; onSetEdition: (edition: EditionId) => void }) {
  return (
    <div className="settings-layout">
      <section className="device-about">
        <span className="about-mark"><Star /></span>
        <div><small>MODEL</small><h3>{edition === 'ad-astra' ? 'Ad Astra Edition' : 'Lumi Standard'}</h3><p>LumiOS 0.1 · Prototype One</p></div>
      </section>
      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="segmented" role="group" aria-label="Edition">
          <button className={edition === 'standard' ? 'is-selected' : ''} type="button" onClick={() => onSetEdition('standard')}>Standard</button>
          <button className={edition === 'ad-astra' ? 'is-selected' : ''} type="button" onClick={() => onSetEdition('ad-astra')}><LockKeyhole />Ad Astra</button>
        </div>
      </section>
      <section className="settings-section settings-rows">
        <div><span className="setting-icon tone-jade"><Volume2 /></span><span><b>System sounds</b><small>轻触反馈与提示音</small></span><strong>On</strong></div>
        <div><span className="setting-icon tone-sky"><Sparkles /></span><span><b>Motion</b><small>跟随系统辅助功能</small></span><strong>Auto</strong></div>
        <div><span className="setting-icon tone-gold"><Leaf /></span><span><b>Private content</b><small>仅在本次解锁期间驻留</small></span><strong>{edition === 'ad-astra' ? 'Unlocked' : 'Sealed'}</strong></div>
      </section>
    </div>
  );
}

function PreviewApp({ appId, icon: Icon, content }: { appId: AppId; icon: LucideIcon; content: PrivateContent }) {
  const preview = content.previews[appId as keyof PrivateContent['previews']];
  return (
    <div className={`preview-app preview-${appId}`}>
      <span className="preview-orbit" aria-hidden="true"><i /><i /><i /></span>
      <Icon />
      <p>{preview.kicker}</p>
      <h3>{preview.title}</h3>
      <span>{preview.detail}</span>
      {appId === 'music' && <button type="button"><CirclePlay /><b>试听</b></button>}
      {appId === 'atlas' && <Compass className="preview-compass" aria-hidden="true" />}
    </div>
  );
}
