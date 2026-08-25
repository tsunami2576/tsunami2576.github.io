# 「柳」（Yanagi）视觉小说引擎 · 开发白皮书

| | |
|---|---|
| **版本** | v1.1（修订：§14 改为持续迭代路线图；解析器决策改为手写递归下降，见 §5.7 与决策日志 D-001） |
| **日期** | 2026-08-20 |
| **状态** | 待评审（评审通过后作为 M0 开发的基准文档） |
| **代号** | 柳 / Yanagi（取自主页域名 willow.tokiharu.xyz 中的"柳"，仅为工作代号，可改） |
| **定位** | 个人自研、面向 Web 优先（Web + 桌面双端发布）的现代视觉小说引擎与配套创作工具链 |

---

## 0. 摘要

本项目将自研一套以 TypeScript 编写的视觉小说引擎：**同一套平台无关的内核**，通过适配层同时发布为 **Web 静态站点**（部署于个人主页 `willow.tokiharu.xyz` 的子路径，试运行期仅直链可见）与 **Tauri v2 桌面应用**。渲染采用业界已验证的 **PixiJS v8 舞台（背景/立绘/特效）+ DOM 覆盖层（文本窗/菜单 UI）** 混合方案；音频采用**原生 Web Audio 自研混音器**；持久化采用 **IndexedDB（Web）+ JSON 文件（桌面）** 双后端。

创作侧提供一门**行式剧本语言 Yanagi Script**（KAG/WebGAL 风格的中文友好语法，编译期完整校验）与一套 **CLI 工具链**（dev 热重载服务器、构建期图片/音频/字体的资产管线、静态检查）。

功能面以商业级 VN 玩家体验为基线：打字机文本（注音/傍点/行内标记）、语音与 BGM/SE 分轨、选择肢与变量跳转、存档/读档/自动存档（含截图缩略与导出导入）、Skip（默认仅已读）/Auto/回想（Backlog）/回溯、CG 画廊、音乐鉴赏、场景回想、完整设置面板。

路线图按"能力门"划分为五个里程碑（M0–M4），由验收标准而非日历时间定义——开发以可持续的连续迭代推进，主干在任何迭代结束点都**可构建、可测试、可玩**。

---

## 1. 背景与动机

### 1.1 项目缘起

作者此前已为特殊场合手写过两个一次性互动页面（本仓库下的 `valentine/` 与 `per-aspera-ad-astra-2026/`）。这些页面验证了两件事：其一，互动叙事内容在个人主页上以子路径发布是完全可行的形态；其二，每次从零手写对话框/场景切换/音频控制不可持续——需要一个**可复用的引擎**来承载未来的作品。

因此本项目的目标不是"做一个引擎 demo"，而是**一部可以用很多年的个人创作基础设施**：引擎内核稳定可靠、剧本写起来顺手、发布到网页和桌面都只是一条命令的事。

### 1.2 发布场景与约束

- **主发布渠道**：个人主页 `willow.tokiharu.xyz`（GitHub Pages 用户站 + CNAME 自定义域名）的子路径。该仓库是用户站（`tsunami2576.github.io`），因此任何 project 页/子目录都会同时出现在 `willow.tokiharu.xyz/<path>/` 下。
- **试运行期访问策略**：新作品在试运行阶段要做到"**除直接输入 URL 外不可达**"——搜索引擎不可见、站内无入口、不可被猜测。具体手段与边界见 §13.2（诚实地说：公开仓库的 GitHub Pages 无法做到真正的访问控制，能做到的是"隐蔽 + 不可索引"；如需硬性门禁需引入 Cloudflare Access 或客户端口令门）。
- **静态托管约束**：GitHub Pages 不能自定义 HTTP 响应头；默认缓存 `max-age=600` + 协商缓存；站点体积上限 1GB、月带宽软上限 100GB。这些约束直接影响了资产管线设计（内容哈希文件名、按章节分包、音频码率预算，见 §13.1）。
- **桌面端**：作为第二发布渠道，用于本地收藏版/离线游玩，采用 Tauri v2（安装包 ~3MB 级，对比 Electron ~85MB）。

### 1.3 为什么自研而不用现成引擎

调研（详见 §3）表明各主流引擎在"Web 优先 + 高审美可控 + 个人长期维护"这个组合下都有硬伤：

| 引擎 | 不选它的核心原因 |
|---|---|
| **Ren'Py**（含官方 Web 导出） | Web 导出是桌面引擎的 WASM 移植：单包 `game.data` 体积大，**超过 50MB 的文件浏览器不会缓存**（每次重开全量重下）；无多线程导致加载期掉帧；浏览器存档有私密模式/逐出坑；UI 是 Ren'Py 自绘体系，难以做出"日式二次元 + 现代 Web"的原生质感，也难以无缝嵌进个人主页 |
| **TyranoScript** | jQuery + DOM 架构性能上限低；KAG 式标签对长剧本的可维护性一般；自有许可证（禁止引擎再分发）对长期资产是负 item |
| **Monogatari** | MIT 且 Web 原生，但更新缓慢、社区有"体验坎坷"的反馈；架构偏"网页优先"而非"演出优先" |
| **WebGAL** | 最接近理想的现成方案（TS + React + Pixi、中文生态好），但 MPL-2.0 生态绑定自家编辑器；深度定制 UI/演出仍然要改引擎源码；其解析器/性能/字库问题（issues #1014/#519/#1028）说明它的成熟度也有缺口 |
| **Naninovel** | Unity 资产，WebGL 是其最弱平台（体积、iOS Safari 内存上限、移动端不受支持），且付费闭源 |
| **KiriKiri/KAG** | Windows 桌面事实标准，2019 年原版冻结，无 Web 目标 |

同时，调研也给出了自研的**可行性证据**：`TypeScript + React/轻状态层 + PixiJS 演出层 + DOM 文字层` 正是 WebGAL、avg.js、pixi-vn 共同收敛出的技术路线，只是其中除 WebGAL 外没有一个走完"商业级功能面"。自研的真实成本主要不在技术选型，而在**持续投入**（avg.js 2018 年弃坑是前车之鉴）——因此本白皮书将"小内核、每里程碑可用、测试防护网"作为一等原则（§2.1、§12、§15）。

**结论**：自研。换取的是对审美的完全控制权、~2MB 级的首载体积（对比 Ren'Py Web 的数十 MB）、与个人主页无缝的集成、以及一套完全为自己写作习惯定制的剧本语言。

---

## 2. 目标与非目标

### 2.1 设计原则

1. **审美优先**：默认 UI 即达到"日式二次元 + 现代扁平/玻璃拟态"的可发布水准，主题系统允许每部作品换肤而不改引擎。
2. **内核极小、边界清晰**：内核（脚本虚拟机、状态、存档模型）零 DOM/零 Pixi 依赖，可在 Node 中全量跑测试；一切平台能力（渲染、音频、存储、输入）通过接口注入。
3. **作者友好**：剧本语言可手写、可校验、可 diff；错误信息永远带 `文件:行号`；dev 服务器改剧本热更新且尽量保现场。
4. **稳定压倒功能**：任何新功能必须先过 canary 回归测试再合并；宁可功能晚到，不可破坏已读存档。
5. **第一天就按 Web 约束设计**：音频手势解锁、移动端纹理预算、存储逐出对策、首包体积预算——不是事后补丁。

### 2.2 功能清单（优先级）

**P0（M0–M1，没有就不算引擎）**

| 功能 | 要点 |
|---|---|
| 文本显示 | 打字机、逐字/逐音节显示、点击先补全再前进、文字速度 0（瞬间）–80 字/秒 |
| 行内标记 | 注音 `[ruby]`、傍点、加粗/斜体/颜色/字号、抖动、停顿 `[pause]`、局部变速 |
| 语音 | 每行可选 `voice=`，前进时是否截断可配置（voice sustain） |
| BGM/SE/环境音 | 分轨音量、交叉淡化、带循环点的无缝循环、语音播放时自动压低 BGM（ducking） |
| 背景与立绘 | 差分表情切换、多位置槽位、入场/离场动画、说话者聚焦（其余立绘压暗） |
| 转场与特效 | 淡入淡出/滑动/百叶窗/遮罩擦除；震屏、闪光、暗角/模糊/去色滤镜；樱花/雪/雨/萤火粒子预设 |
| 选择肢 | 条件显示、一次性选项（选后灰显）、选择历史回看、键盘/触屏导航 |
| 流程控制 | 标签、跳转、子程序调用返回、变量、if/elif/else、确定性随机 |
| 存档/读档 | 自动档 ×3（轮转）+ 快速档 ×1 + 手动档 ×20，截图缩略图、游戏时长、章节名 |
| 自动存档 | 选择肢后、每 N 行、页面隐藏/退出前 |
| Skip / Auto | Skip 默认仅已读（再按一次跳全部）、Ctrl 按住快进、Skip 到选择肢停止（可配置）；Auto 等待 = 文本完成 + 语音结束 + 可调延迟 |
| 想起（Backlog） | 滚轮上 / L 键呼出；正序展示（最新在下）自动滚底；最近 200 条（含选择肢所选文本）；语音行带重播按钮；已读浅色标注 |
| 设置面板 | 四路音量、文字速度、Auto 速度、Skip 行为、窗口不透明度、UI 语言、主题、键位说明 |
| 崩溃安全 | 全局错误兜底（不白屏）、错误日志导出、存档导出/导入 |

**P1（M2，"商业作品"加分面）**

- CG 画廊（分组、解锁条件、缩略图、CG 回想即跳回对应场景）
- 音乐鉴赏（曲目解锁、循环点播放、曲名/作曲信息）
- 场景回想（章节跳转重放，独立于主存档）
- 标题画面/章节题字演出、片头/片尾 staff roll
- 主题系统完整化（每部作品独立皮肤包）
- 会话内回溯（rollback，内存环缓冲，最近 20 个安全点）
- 多语言（剧本字符串提取 → JSON 翻译 → 运行时切换；UI 文案独立）
- 移动端浏览器完整适配（触控区、手势、安全区、防误触缩放）

**P2（M3 及以后，按需）**

- Live2D 立绘（插件化，默认构建不携带，涉及 Cubism SDK 许可评估）
- NVL 全屏文本模式、ADV/NVL 混合
- 成就系统、结局流程图（路线图）
- VS Code 语法插件 / LSP、剧本统计（字数、分支覆盖）
- PWA 离线游玩、存档云同步钩子（WebDAV/坚果云）
- 效果：泛光、LUT 调色、自定义 shader 转场

### 2.3 非目标

- **不做可视化编辑器**（WebGAL Terre 式的编辑器工程量不亚于引擎本身；先做好"文本编辑器 + CLI"的工作流，未来若需要再评估）。
- **不做 3D 演出**、不做通用游戏引擎——只做视觉小说。
- **不做多人协作/在线服务端**——纯静态，无后端依赖。
- **不做移动原生 App**——移动端走浏览器（桌面壳为 Tauri）。
- **不追求兼容其他引擎的剧本格式**。

---

## 3. 竞品调研结论

### 3.1 横向对比（2026-08 时点）

| 引擎 | 脚本格式 | Web 支持 | 功能完整度 | 许可证 | 维护 | 备注 |
|---|---|---|---|---|---|---|
| Ren'Py 8.5.x | Python DSL | 官方 WASM（Beta） | 极高（回滚/Live2D Web/多语言） | MIT + LGPL | 极活跃 | Web 首载大、>50MB 不缓存、无线程 |
| TyranoScript v6 | KAG 式标签 | 原生 DOM | 高 | 自有（禁再分发） | 慢活跃 | jQuery/DOM，性能上限低，可 JS 魔改 |
| Monogatari 2.4/develop | JS 对象式 | 原生（PWA） | 中高 | MIT | 低频 | develop 分支已 TS 重写；社区口碑一般 |
| WebGAL 4.6.x | 行式中文友好 | 原生 React+Pixi | 高（画廊/鉴赏/路线图/Live2D） | MPL-2.0 | 很活跃 | 国内生态最好；解析器/性能/字库仍有 issues |
| Naninovel | nano 脚本（Unity） | 名义 WebGL | 极高 | 付费闭源 | 商业活跃 | WebGL 是其最弱平台 |
| KiriKiri/KAG (krkrz) | KAG + TJS | 无 | 极高 | TPL | 基本冻结 | 桌面时代标准，无 Web 价值 |
| avg.js | 自有 | React+Pixi | 中 | MIT | **已弃坑** | 技术路线正确但烂尾，警示样本 |
| pixi-vn | 自有 + ink | Pixi + 任意框架 | 中（库级） | 开源 | 活跃 | 可作参考的"半成品基座" |

### 3.2 五条核心教训（直接进入设计决策）

1. **玩家体验基线抄 Ren'Py 的 preferences 清单**：text_cps、afm 系列参数、skip 默认仅已读、四路音量、voice_sustain、emphasize_audio、存档截图、已读变色。商业 VN 评审（"一个月玩 100 部 VN"的评委反馈）明确：缺 backlog/auto/skip/文字速度任一项都直接扣分。→ 已全部纳入 §2.2 P0。
2. **TS + Pixi 舞台 + DOM 文字层是已验证路线**：文字层用 DOM 可以"白嫖"CJK 禁则断行、`<ruby>` 注音、傍点、无障碍与字体回退，比 Canvas 自绘排版省一半工作量。
3. **Web 的坑要在架构期就设计掉**：音频需用户手势解锁（iOS 一次性、静音键全灭、后台返回不恢复——TyranoScript 2026-02 还在修这个）；iOS 纹理/Canvas 内存上限（~300–500MB WebGL 堆、384MB Canvas 总内存）；IndexedDB 私密模式（Firefox 直接报错，renpy#4793）与 best-effort 逐出；Safari 不支持 OGG。→ 对策分别落在 §9、§8.7、§7.3、§13。
4. **行式脚本 + 中文友好语法是低门槛关键**（WebGAL"3 分钟学会"是其流行主因），同时必须保留 TS/JS 逃生舱（TyranoScript 长寿的秘诀）。→ §6。
5. **烂尾是最大风险**：avg.js 技术选型完全正确仍死于停止投入。→ §12 测试防护网 + §14 小步里程碑 + §15 风险对策。

---

## 4. 总体架构

### 4.1 分层总览

```
┌────────────────────────────────────────────────────────┐
│                      游戏工程（每部作品）                  │
│   story/*.yn（剧本）  assets/（图/音/字体）  game.yaml    │
└───────────────────────┬────────────────────────────────┘
                        │ yanagi build（编译+资产管线）
                        ▼
┌────────────────────────────────────────────────────────┐
│                     发布产物（静态）                      │
│  bundle.ynb.json（指令+清单+sourcemap）  hash 化资产      │
└───────────────────────┬────────────────────────────────┘
                        │
┌───────────────────────┴────────────────────────────────┐
│ 【宿主层】Web 页面（Vite 产物）      /  Tauri v2 桌面壳    │
│   输入/手势、AudioContext 解锁、    /  窗口、fs 存档后端、  │
│   IndexedDB、URL/分享              /  自动更新（可选）     │
├────────────────────────────────────────────────────────┤
│ 【表现层】                                                │
│  StageDriver（PixiJS v8）：bg/立绘/粒子/滤镜/转场/震屏     │
│  TextWindow & UI（DOM）：文本窗/菜单/设置/回想/画廊/鉴赏   │
│  AudioBus（Web Audio）：BGM/SE/Voice/Ambient 四总线      │
├────────────────────────────────────────────────────────┤
│ 【内核 @yanagi/core（零平台依赖，Node 可测）】             │
│  ScriptVM（指令解释器）  StateStore（可序列化游戏状态）     │
│  表达式求值器  存档序列化/兼容层  ReadTracker/Backlog      │
│  调度器（等待/跳过/自动模式语义）                          │
├────────────────────────────────────────────────────────┤
│ 【工具链 @yanagi/cli】                                    │
│  yanagi new / dev（热重载）/ check / build / export      │
│  Peggy 编译器、sharp 图片管线、ffmpeg 音频管线、字体子集化 │
└────────────────────────────────────────────────────────┘
```

关键约束：**内核不认识 DOM/Pixi/AudioContext**。内核只做三件事——解释指令、维护可序列化状态、通过注册的 `System` 接口发出**声明式的表现意图**。表现层把意图差分渲染成动画。这一条约束带来三个直接收益：

1. 内核测试（虚拟机/存档/回放确定性）在 Node 里毫秒级跑完，不需要浏览器；
2. 存档 = 状态快照，恢复 = 用快照重建声明式舞台状态（无需重放指令序列）；
3. 桌面/Web 只是两个宿主，内核代码零分叉。

### 4.2 Monorepo 结构（pnpm workspaces）

```
yanagi/
├── packages/
│   ├── core/          # 内核：VM、状态、存档、表达式、内核测试
│   ├── script/        # Yanagi Script：.peggy 语法 + 编译器 + sourcemap
│   ├── stage-pixi/    # PixiJS 舞台适配（背景/立绘/粒子/转场/滤镜）
│   ├── audio-web/     # Web Audio 混音器
│   ├── ui/            # DOM UI 组件（文本窗/标题/菜单/设置/画廊/鉴赏/回想）
│   ├── runtime/       # 组装：默认 System 注册、启动器、平台探测
│   └── cli/           # yanagi 命令行（new/dev/check/build/export）
├── adapters/
│   └── save-fs/       # 桌面存档后端（Tauri plugin-fs → JSON 文件）
├── apps/
│   ├── web-shell/     # 游戏运行时网页外壳（Vite 入口，被每部游戏引用）
│   └── desktop/       # Tauri v2 壳
├── games/
│   └── demo/          # 引擎自测用官方示例游戏（也是 canary 测试载体）
└── docs/              # 引擎文档（剧本语言手册等）
```

**引擎仓库与主页仓库的关系**：引擎与游戏源码住在独立仓库（避免开发依赖污染主页仓库、也绕开 1GB 站点限制）；主页仓库只接收**构建产物**，由 CI 推送到 `/p/<作品slug>/` 子目录（见 §13.1）。`vn-engine/WHITEPAPER.md`（本文件）在立项评审通过后同步到引擎仓库 `docs/`。

### 4.3 运行时数据流

一次"前进"（点击/空格/Auto 到时/Skip）的生命周期：

```
输入 → 调度器 → VM.step()
  ├─ 非阻塞指令（@set/@goto/@show…）：更新 StateStore，产出 PresentIntent，立即继续 step
  ├─ 阻塞指令 DIALOGUE：产出 SayIntent → TextWindow 打字机 → 等待"行完成 + 用户前进"
  ├─ 阻塞指令 MENU：产出 ChooseIntent → 选项 UI → 等待选择 → 记录选择 → jump
  └─ 阻塞指令 WAIT/转场：等待动画完成（Skip 模式下压缩为 ≤50ms）

表现意图（PresentIntent）是声明式的：
  { stage: { bg:'room_day', sprites:{ left:{id:'yui',emotion:'smile'} }, effects:[...] } , hints:{ transition:'crossfade', ms:800 } }
  → StageDriver 对比前后状态，只对差值做动画；恢复存档时 hints 为空（瞬時还原）。
```

### 4.4 关键接口（草案）

```ts
// 内核眼中的"系统"——表现层实现这些，内核完全不关心实现细节
interface System {
  readonly id: string;
  /** 应用表现意图（diff 渲染）；restore=true 表示读档瞬時还原 */
  apply(intent: PresentIntent, hints: TransitionHints, restore: boolean): Promise<void>;
  /** 状态快照序列化钩子（StageDriver 无自身隐藏状态，状态全在 StateStore） */
}

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  list(prefix: string): Promise<string[]>;
  remove(key: string): Promise<void>;
}
// Web 实现：idb（IndexedDB，含降级策略）；桌面实现：localStorage 配置 + plugin-fs JSON 存档

interface GameChannels {
  stage: System;      // 舞台
  audio: System;      // 音频
  ui: System;         // 文本窗/菜单
}
```

存档安全点（safe point）：pc 指向某条 `DIALOGUE` 或 `MENU` 指令、且所有先前指令已执行完毕的时刻。存档只能在安全点生成——这保证恢复时语义无歧义。

---

## 5. 技术选型与论证

### 5.1 语言与运行时

**TypeScript（strict）+ Vite + pnpm workspaces。** 全栈一种语言，内核/编译器/CLI/宿主共享类型定义；strict 模式 + ESLint（typescript-eslint strict）+ Prettier 从第一天开启。Node ≥ 22。

### 5.2 渲染：PixiJS v8 舞台 + DOM 覆盖层（混合）

| 候选 | 评价 |
|---|---|
| 纯 DOM/CSS（TyranoScript 路线） | 文本排版免费，但多层立绘/粒子/滤镜/震屏性能与表现力受限 |
| 纯 Canvas/Pixi | 演出强，但 CJK 排版（禁则、注音、傍点、字体回退）全部自造轮子，且正文对读屏器不可见 |
| **Pixi 舞台 + DOM 文字层（选定）** | 两者取长：演出交给 GPU（PixiJS v8，WebGPU 原生 + WebGL 回退，v8.16 起还有实验性 Canvas2D 回退兜底老旧 WebView）；正文与全部 UI 交给 DOM |

细节决策：

- Pixi Application 以 `resolution: min(devicePixelRatio, 2)` 创建；舞台自底向上分层：`bg → bgFilter → sprites → particles → overlay(前景演出) → 全屏滤镜`；文本窗与菜单是叠在 canvas 之上的 DOM 层（绝对定位，`pointer-events` 精细管理）。
- DPR 与安全区由一个共享的 `LayoutState` 统一供给两层，避免缩放不同步。
- 粒子用 `@pixi/particle-emitter`（接入时锁定其 v8 兼容版本；若不兼容则内置精简发射器，预设粒子对性能要求不高）。
- 无障碍：正文在 DOM 中天然可读；Pixi 侧仅需为游戏内按钮启用其 `AccessibilitySystem`。

### 5.3 文本渲染与打字机

- 断行：`line-break: strict`（CJK 禁则）+ `overflow-wrap: anywhere` 兜底；`word-break: auto-phrase` 作为 Chrome 的渐进增强（Firefox/Safari 支持不全，不作设计前提）。
- 注音：`<ruby>/<rt>` 全浏览器支持；打字机以"显示单元"为单位，**ruby 单元 = 假名注音与基准字一起出现**。
- 傍点：`text-emphasis: filled dot`（各浏览器可用，Safari 加 `-webkit-` 前缀）。
- **打字机实现**：整行文本一次性解析成节点树（含 ruby span），每个显示单元（`Intl.Segmenter` 按字素切分）预置 `visibility: hidden`，播放时只翻转可见性——只触发 paint 不触发 layout，长句不卡顿；Skip/点击补全按单元索引批量置可见，不重设整段。
- 行内标记（`[em]`、`[color=…]` 等）由与主解析器共享 lexer 思路的 mini-parser 映射为 span/class。
- 字体：默认栈 `思源黑体/Noto Sans SC + Noto Sans JP` 回退；**字体子集化在构建期完成**（按剧本全文字符集 + UI 常用字打包子集，woff2 分片按需加载），全量中文字体 20MB+ 的坑（WebGAL #1028）从管线层面规避。

### 5.4 音频：原生 Web Audio，自研 ~300 行混音器

不引入 Howler.js：其处于低维护状态（2.2.4，2023 年后无实质更新），且不暴露 `AudioBufferSourceNode.loopStart/loopEnd`——带循环点的无缝 BGM 是 VN 刚需。自研混音器规格：

- **四总线**：BGM / SE / Voice / Ambient → masterGain；各自独立音量，设置面板四路滑条。
- **无缝循环**：`AudioBufferSourceNode.loop = true` + `loopStart/loopEnd`（循环点写在 `assets.yaml`，构建期可用 ffmpeg 精确预切避免首尾 padding）。
- **交叉淡化**：双实例 + `linearRampToValueAtTime`，默认 1s。
- **Ducking**：Voice 播放时 BGM 总线 -6dB（可配置、可关）。
- **iOS 解锁**：单例 AudioContext；标题画面"点击开始"即首次手势，在手势内同步 `resume()` + 预播静音 buffer；文档明示 iOS 静音键与后台暂停行为；`visibilitychange` 恢复处理。
- **解码策略**：`decodeAudioData` 进内存，LRU（语音缓存上限 ~32MB）；对话进行中预解码下一行语音。
- **编解码**：源 WAV 保留，构建期产出 **AAC/m4a（唯一必需格式，全浏览器含 Safari 可解码）**；BGM 128–160kbps、语音 64–96kbps、SE 96kbps。（Opus 双出 + 运行时探测作为可选 `--opus` 开关，Safari 对 OGG/WebM Opus 的 `decodeAudioData` 有历史 bug，不作为默认。）

### 5.5 持久化

| 数据 | 位置 | 理由 |
|---|---|---|
| 玩家设置、键位 | localStorage | 同步可用，启动零延迟 |
| 存档（含缩略图）、全局解锁进度（CG/音乐/场景）、已读集合 | IndexedDB（`idb` 封装） | 容量大、结构化、Blob 原生支持 |
| 存档缩略图 | **JPEG q0.7 Blob（约 320×180）** | Safari 的 canvas 至今不能编码 WebP（会静默回退 PNG）；JPEG 全兼容且体积小；展示用 `URL.createObjectURL` |
| 语音等解码缓存 | IndexedDB（可丢） | 二次进入免下载 |

- 首次启动与每次写档后调用 `navigator.storage.persist()`，并在设置页展示持久化状态（`persisted()` + `estimate()`）。
- **存档导出/导入**（下载/上传 JSON 文件）为一等功能：浏览器存储是 best-effort 的（用户清缓存=丢档，Firefox 私密模式直接无 IndexedDB），Ren'Py Web 端的"存档 zip 导入导出"就是为此存在。
- 全局解锁进度与已读集合**独立于存档**（跨周目共享），但包含在导出文件中。

### 5.6 桌面打包：Tauri v2（+ 文件存档后端）

- **Tauri 2.x**（当前 2.11 线）：安装包 ~2.5MB vs Electron ~85MB；VN 是低交互负载，系统 WebView（WebView2/WKWebView/WebKitGTK）的性能足够。
- **存档不留在 WebView 的 IndexedDB**：Tauri 的 webview 数据目录随应用标识/配置迁移会"消失"（tauri#11252）。桌面端通过 `SaveBackend` 接口把正式存档写成 `appDataDir` 下的 **JSON 文件**（tmp + rename 原子写），用户可见、可备份、可云盘同步；IndexedDB 仅作资源缓存。capabilities 只授予 `fs:allow-appdata-read-write` 窄作用域。**应用 identifier 一经确定永不更改**。
- 已知坑建档：Linux WebKitGTK 的 NVIDIA DMABUF 白屏（`WEBKIT_DISABLE_DMABUF_RENDERER=1` 兜底，写入文档与发行说明）、macOS WKWebView 后台暂停音频（与 Safari 同源行为）。
- 若未来 Linux 桌面问题失控，Electron 43 是保守备胎（架构上只是换一个宿主层，内核不受影响）。

### 5.7 构建与工具链

- **Vite**（8.x，Rolldown 内核；若插件生态滞后则退 7.x + `rolldown-vite`）：`base` 必须设为部署子路径。
- **剧本解析器：手写递归下降（不引入 Peggy）**。Yanagi Script 是行式语言，手写解析器能给出最精确的"文件:行:列 + 上下文"报错，且少一个构建期依赖；表达式与行内标记同样手写。Peggy 保留为后备方案（若未来语法复杂度超出手写舒适区，见决策日志 D-001）。
- **sharp**（构建期图片）：统一缩放/裁切、WebP（图片显示端 WebP 全兼容，可放心用）+ AVIF 双出、画廊缩略图生成。
- **ffmpeg**（作者本机 CLI，不随产品分发）：WAV→m4a 转码、循环点精确预切、响度归一（`loudnorm`）。
- **字体子集化**：按剧本字符集 + 常用字表产出 woff2 分片。
- 产物：`index.html` + `bundle.ynb.json` + 内容哈希资产 + `manifest.json`（资源逻辑名→物理文件映射、循环点、变体）。所有资源带 hash 文件名（对冲 Pages 的 10 分钟默认缓存），按章节分包（§8.7）。

### 5.8 选型总表

| 依赖 | 用途 | 版本基线 | 许可证 |
|---|---|---|---|
| TypeScript | 全栈语言 | 5.x（strict） | Apache-2.0 |
| pixi.js | 舞台渲染 | ^8.18 | MIT |
| @pixi/particle-emitter | 粒子（v8 兼容版接入时核实） | 最新兼容版 | MIT |
| （不用 Howler）自研 Web Audio 混音器 | 音频 | — | — |
| idb | IndexedDB 封装 | ^8 | ISC |
| vite | Web 构建 | ^8（7 备选） | MIT |
| pnpm + workspaces | Monorepo | ^11（Node 22+） | MIT |
| （不引入 Peggy；手写递归下降解析器） | 剧本解析 | — | — |
| sharp | 图片管线（构建期） | ^0.35 | Apache-2.0 |
| ffmpeg CLI | 音频管线（构建期） | 6/7.x | LGPL/GPL（仅开发机） |
| @tauri-apps/api + plugin-fs | 桌面壳 + 存档落盘 | ^2.11 | MIT/Apache-2.0 |
| vitest | 单元/集成 | ^4.1 | MIT |
| fast-check + @fast-check/vitest | 属性/模糊测试 | ^4.9 | MIT |
| @playwright/test | E2E + 金像 | ^1.5x | Apache-2.0 |

可选插件：`@jannchie/pixi-live2d-display`（Cubism 2.1/4，Pixi v8 兼容）或 `untitled-pixi-live2d-engine`（Cubism 5）——默认构建不含；Cubism SDK 发布许可对个人/小规模事业者（年销售额 <1000 万日元）免签约，但引擎若作为"可扩展应用程序"分发可能触及 Expandable 条款，**启用前向 Live2D 邮件确认**。

---

## 6. 剧本语言 Yanagi Script（.yn）设计

### 6.1 设计原则

1. **行式、中文友好**：一行 = 一句对话/一条命令，任何文本编辑器可写；中文引号「」作为对话定界符，全角输入无障碍。
2. **编译期全量校验**：未定义标签、参数拼写错误、括号不闭合、资源不存在——全部在 `yanagi check/build` 时报出，带 `文件:行:列`；运行时永不因语法错误崩溃。
3. **可 diff、可合并**：格式稳定（无自动生成代码），多人/多设备用 git 协作无冲突噩梦。
4. **渐进复杂度**：写一部线性作品只需要「对话 + @bg + @bgm + 选择肢」；变量/条件/子程序是可选进阶。
5. **保留逃生舱**：`@js` 指令允许嵌入受沙箱限制的表达式级扩展（P2，默认关闭），自定义命令可由游戏工程用 TS 注册（引擎级的"魔改自由"，TyranoScript 长寿的秘诀）。

### 6.2 语法规范 v0.1

#### 行类型判定（按序）

```
1. 空行                     → 忽略
2. ; 开头                   → 注释（;;; 开头为章节分隔注释，编辑器折叠用）
3. # 开头                   → 标签：#label_name（全局唯一，[a-z0-9_]+）
4. @ 开头                   → 命令行：@cmd 位置参数… key=value …
5. 名前「文本」（尾缀参数）    → 对话
6. 其余整行                 → 旁白
```

#### 对话与旁白

```
yui「早上好！今天天气真不错呢。」voice=yui_0001
yui「要不要[ruby:一緒;いっしょ]去学校？」voice=yui_0002
夏日的阳光穿过窗帘缝隙，落在教室的地板上。        ← 旁白（无角色名）
???「……谁在那里？」name=？？？
```

- 角色名必须在 `characters.yaml` 注册（名前显示色、头像、语音文件名前缀、简称）；旁白与 `name=` 覆写不受此限。
- 尾缀参数（写在引号后，空格分隔）：`voice=` 语音资源名。
- 对话内容支持行内标记（见下）；旁白同理。

#### 行内标记（编译为 DOM 节点）

| 标记 | 效果 |
|---|---|
| `[ruby:漢字;かんじ]` | 注音 |
| `[em]…[/em]` | 傍点（着重号） |
| `[b]…[/b]` `[i]…[/i]` | 粗体/斜体 |
| `[color=#ff6688]…[/color]` | 颜色 |
| `[size=120]…[/size]` | 相对字号（%） |
| `[shake]…[/shake]` | 该段文本抖动 |
| `[pause=400]` | 打字机停顿 400ms |
| `[speed=0]…[/speed]` | 段内变速（0=瞬间显示） |
| `[br]` | 段内换行 |
| `[[` | 转义输出 `[` |

#### 命令（核心集 v0.1）

```
; —— 舞台 ——
@bg room_day fade=800            ; 背景（逻辑名），转场样式与时长
@bg none fade=black:1000         ; 收背景
@show yui smile left focus       ; 立绘登场：id 差分 位置（left/center/right/自定义x%）
@hide yui slide=300              ; 立绘离场
@emotion yui shy                 ; 差分切换（150ms 交叉）
@clear_sprites fade=200
@fg rain_overlay                 ; 前景演出层（雨丝/镜头光斑等贴图）
@weather sakura density=0.6      ; 粒子预设：sakura/snow/rain/fireflies/dust/off
@shake power=8 ms=500            ; 震屏
@flash ms=200 color=white        ; 闪光
@filter mono strength=0.8        ; 全屏滤镜：mono/sepia/blur/vignette/off
@title 第一章 · 夏蝉              ; 章节题字演出（DOM 大字淡入淡出）
@wait 1200                       ; 硬等待（Skip 下压缩至 50ms）

; —— 音频 ——
@bgm theme_sunlight fade=1000 vol=0.9
@bgm stop fade=1500
@ambient rain_loop
@se door_knock
@voice_sustain on                ; 前进不截断语音（场景级开关）

; —— 流程与状态 ——
@set affection += 1
@set flag_met_yui = true
@if affection >= 3
  …
@elif affection == 2
  …
@else
  …
@end
@goto school_route
@call common_bath_scene          ; 子程序（有返回栈）
@return
@rand luck = 1..6                ; 确定性随机（状态可存档）
@unlock cg ev_01                 ; 解锁画廊/鉴赏（全局进度）
@unlock bgm theme_sunlight
@unlock scene chapter2_start
@end_game                        ; 进StaffRoll→回标题

; —— 选择肢 ——
@choice「接下来怎么做？」
  「一起去学校」 -> school
  「再睡一会儿」 -> sleep
  「（保持沉默）」 -> silent if=flag_shy
  「……抱住她」 -> hug once
@end
```

- 选择肢选项可带 `if=表达式`（条件显示）与 `once`（本次游玩选过后灰显禁用）。
- 嵌套规则：`@if…@end` 与 `@choice…@end` 块内可包含任意指令与对话；**不支持跨文件嵌套、不支持 while**（流程图作品应当展开为显式跳转——减少一类死循环 bug）。
- 多文件组织：`story/` 下所有 `.yn` 按**自然文件名序**拼接为一个程序，标签全局命名空间。推荐按章节命名 `01_intro.yn`、`02_school.yn`。

#### 变量与表达式

- 变量：动态类型（bool/number/string），无需声明；`yanagi check` 对"读取未赋值变量"给警告。
- 运算符：`+ - * / %`、比较、`&& || !`、字符串 `+` 拼接；括号分组。括号可省略的场合（`@if affection >= 3`）由解析器处理。
- 编译期常量折叠；**永不使用 eval**，表达式由 Peggy 语法生成 AST 后由内核求值器执行。
- 内置函数：`rand(a,b)`、`has(item)`、`flag(name)`、`len(s)`（按需扩充）。

### 6.3 编译管线与错误报告

```
.yn 文件集 → [手写递归下降解析（词法/结构/行内标记）] → AST
          → 语义分析（标签唯一、跳转可达、命令/参数校验、变量警告、
             资源存在性比对 manifest、选择肢覆盖分析）
          → 指令束 bundle.ynb.json
             { instructions[], labels{}, strings[], sourcemap[], vars 建议表 }
          → i18n 字符串提取（P1，strings[] 即底稿）
```

- 每条指令携带 sourcemap（源文件:行），运行时任何剧本错误都能定位回源码；dev overlay 可点击直接跳编辑器（向 VS Code 发送 URL）。
- `yanagi check --strict` 作为 CI 门禁；警告默认不阻塞、strict 下阻塞。
- 剧本指纹 `scriptHash`（指令束内容哈希）写入存档，用于存档兼容策略（§7.3）。

### 6.4 完整示例

（附录 A 给出约 60 行的完整可玩样例，覆盖：开场背景+BGM、两角色对话（含注音/傍点/变速）、立绘差分与聚焦、变量累积、条件分支、选择肢（含 once 与 if）、子程序复用场景、章节题字、CG 解锁、结局跳转。）

### 6.5 与竞品脚本对比（同一场景）

TyranoScript 需要 `[bg storage=room_day time=800]` 式标签流且正文与标签混行；WebGAL 用 `;` 分隔与冒号参数；Yanagi Script 的差异化在：**尾缀参数不侵入文本**（对话行保持纯净可校对）、**块状控制流带明确 @end**（避免缩进歧义）、**编译期校验深度**（资源存在性、跳转可达性、选择肢覆盖分析是竞品普遍缺失的）。

---

## 7. 运行时内核规格

### 7.1 虚拟机与指令集

剧本编译为**扁平指令数组** + `labels: {name → index}` 映射。指令集（内部格式，作者不直接接触）：

```
DIALOGUE { speaker, segments[], voice?, uid }     ; 阻塞
MENU     { prompt?, options[{text, cond?, once?, target}] }  ; 阻塞
JUMP     { label } / JUMP_IF { expr, label } / CALL { label } / RETURN
SET      { target, op, expr } / RAND { target, a, b }
CMD      { name, args }                            ; 一切非流程命令的统一形态（派发给 System）
WAIT     { ms }                                    ; 阻塞（Skip 压缩）
END
```

- 解释器 `step()` 循环执行非阻塞指令直到阻塞点；每次 `advance()` 从上一个安全点继续。
- CALL/RETURN 用独立返回栈（上限 32 层防失控）；Skip 模式下 `WAIT` 与转场等待压缩至 ≤50ms，**MENU 不跳过**（Skip 在选择肢前自动停，可配置"选择后继续 Skip"）。
- 破坏性测试基线：狂点前进、Skip 中切菜单、读档中断转场、选择肢快速连点——这些是评审实测中翻车最多的路径（§12 E2E 覆盖）。

### 7.2 状态模型与序列化

```ts
interface GameState {
  schema: number;                    // 存档结构版本
  scriptHash: string;                // 剧本指纹（兼容判定）
  pc: { label: string; index: number };   // 安全点
  vars: Record<string, Val>;
  rngState: number;                  // 确定性随机状态
  stage: {
    bg: string | null;
    sprites: Record<string, { id: string; emotion: string; x: number }>;
    weather: string | null;
    filter: string | null;
    fgs: string[];
  };
  audio: { bgm: string | null; ambient: string | null; voiceSustain: boolean };
  history: BacklogEntry[];           // 尾部最多 200 条
  choices: { at: string; picked: string; all: string[] }[];  // 本局选择史
  unlockedDelta: string[];           // 本局新增解锁（合并进全局后清空）
  chapter: string;                   // 当前章节（预加载域+档面显示）
  playMs: number; updatedAt: number;
}
```

- **全部可 JSON 序列化**（无闭包、无 Pixi 对象、无 AudioNode）——存档、回溯、测试快照共用这一个结构。
- 全局持久数据（独立于存档）：`unlocked {cg,bgm,scene}`、`readSet`（已读行 uid 集合）、`config`。

### 7.3 存档/读档/自动存档

- **槽位**：`auto ×3`（轮转）+ `quick ×1` + `manual ×20`（game.yaml 可调）。档面信息：截图缩略（JPEG Blob）、章节名、行摘要（当前行文本前 20 字）、游戏时长、时间戳。
- **自动存档时机**：每个选择肢确认后、每 40 条对话、`pagehide/visibilitychange`、读档前（回到 quick）。
- **恢复流程**：校验 `schema`（不匹配走迁移函数链）→ 校验 `scriptHash`：
  - 一致：直接恢复；
  - 不一致但 `label` 仍存在：按 label 重新定位到该 label 下**最近的安全点**，UI 明示"剧本已更新，从本章安全处继续"；
  - label 丢失：拒绝并提示（保住其他存档）。
- **导出/导入**：单档或全部 → 一个 JSON 文件（含全局解锁进度）；导入时合并策略 = 取并集。
- Web 端写档同时调用 `navigator.storage.persist()`；检测到 Firefox 私密模式（IndexedDB 不可用）时降级为**内存存档 + 强提示导出**，绝不静默丢档。

### 7.4 Skip / Auto / 已读 / Backlog / 回溯（玩家体验基线）

| 机制 | 规格 |
|---|---|
| 已读判定 | `uid = hash(scriptHash + label + lineNo)` 存全局 readSet；已读文本在 Backlog 中呈浅色（可选） |
| Skip | 按一次 = 仅跳已读；再按 = 跳全部（UI 明示当前档位）；Ctrl 按住 = 临时快进；选择肢前自动停（可配置通过后继续）；菜单/设置打开即暂停 Skip |
| Auto | 行完成等待 = max(打字完成 + baseMs + 字数×perCharMs, 语音结束 + tailMs)；用户点击可立即前进（Auto 不拦截手动输入）；语音等待可关（无语音行退化为纯文本等待） |
| 打字机 | 速度 0（瞬间）–80 字/秒默认 30；点击 = 先补全整行，再点 = 前进（两段式，商业 VN 硬惯例）；`[pause]`/`[speed]` 标记尊重速度设置的上限 |
| Backlog | 滚轮上 / L 键呼出；正序（最新在下）；含选择文本；⏪ 回溯按条跳转；打开时暂停 Auto/Skip |
| 回溯（P1） | **锚点 + 确定性重放**：普通安全点只记 `{uid, pc}`（数百条量级），每 16 点落一个完整 GameState 锚点快照（上限 12）；回溯取目标前最近锚点克隆后由 VM 重放（选择肢按 choices 日志模拟重放），状态精确还原且内存开销恒定；入口在对话记录界面（每条 ⏪）；跨会话不保留 |
| 其他基线 | 四路音量、失焦静音（可选）、隐藏 UI（H）、全屏（F）、Esc 菜单、窗口不透明度、文字速度对菜单的影响关闭（菜单永远即时） |

### 7.5 变量、表达式与确定性

- 求值器为纯函数（AST 解释），无副作用；`@rand` 使用 mulberry32，种子状态在 GameState 内——**读档后重摇结果一致**（避免"SL 大法"争议场景，也保证测试可重放）。
- 表达式求值历史（最近 64 条）写入诊断日志，dev overlay 可查。

---

## 8. 表现层规格

### 8.1 图层与舞台

```
┌ DOM 层（z 上）─────────────────────────────┐
│ 章节题字 / 全屏效果文字                      │
│ 文本窗（ADV 底部窗）· 名牌 · 指示器          │
│ 菜单/设置/回想/画廊/鉴赏/标题画面             │
├ Pixi 舞台（z 下）──────────────────────────┤
│ L0 背景（bg）      ← Ken Burns 缓推可配      │
│ L1 背景滤镜       ← blur/mono/…            │
│ L2 立绘（多槽位）  ← 聚焦压暗/呼吸/入场      │
│ L3 天气粒子       ← sakura/snow/rain/…     │
│ L4 前景演出（fg）  ← 雨丝/光斑贴图           │
│ L5 全屏滤镜 & 转场遮罩                      │
└──────────────────────────────────────────┘
```

- 16:9 逻辑分辨率（1920×1080 基准），窗口任意比例下 letterbox 居中；安全区适配（刘海屏）。
- 立绘槽位：`left/center/right` 预置（含推荐缩放），`x=35%` 自定义；同槽换人自动协调退避。

### 8.2 转场系统

- 实现：转场时把旧舞台快拍为 RenderTexture，新状态立即就位，旧快照按模式淡出/滑出/遮罩擦除。
- 预置：`fade`（可指色）、`crossfade`、`slide:l/r/u/d`、`blinds`、`circle`（圆形遮罩）、`feather`（羽化斜擦，贴图驱动）。
- 全局"转场时长系数"设置（Skip 时 50ms；连续剧转场开关）。

### 8.3 文本窗细节

- 默认 ADV 底部窗；窗体毛玻璃 + 细线描边 + 主题色名牌；不透明度可调（80%–100%）。
- 名牌：角色主题色、可带头像（差分表情同步）；旁白窗体样式微区别（无名牌、窗色更淡）。
- 行完成指示器（右下角 ▼ 呼吸动画）；Auto 指示（右上角 AUTO 徽标）；Skip 指示（滚动的 SKIP 徽标 + 已读/全部档位）。
- 文本选中禁用（`user-select: none`）但保留读屏可读性（`aria-live` 播报当前行）。

### 8.4 立绘系统

- 差分表情：`角色/表情.png` 命名约定自动清单化；切换默认 150ms 交叉。
- 演出：入场（fade/slide/bounce 可配）、呼吸（±2px 正弦 ~3.2s）、微摆（可选）；**说话者聚焦**——说话立绘全亮，其余 60% 亮度 + 轻微去饱和（语音行按 voice 前缀判定说话者）。
- 差分零散碎发/眨眼等"部件级"差分不做（成本陷阱），由立绘素材自身差分承担。

### 8.5 特效与粒子

- 粒子预设（密度/风力/速度可配）：樱花、雪、雨、萤火、尘埃、星光；对象池实现，总量上限（移动端自动降密度）。
- 震屏（衰减正弦）、闪光、暗角、模糊、去色、泛光（P2）。
- 章节题字：DOM 大字 + 主题样式，淡入停留淡出，期间可点击跳过。

### 8.6 UI 与主题系统

- **设计基调**：日式二次元 × 现代扁平——半透明毛玻璃面板、细线描边、圆角 12px、主题色（默认"蒼" #4A6FA5 与"樱" #E58B9C 双强调色）、思源系字体、克制的弹簧动效（150–250ms）。
- 主题 = CSS 变量集 + 少量图片资源（窗体贴图可选覆盖）；引擎内置「藍」（现代玻璃）与「和」（和纸质感）两套，游戏工程可整包替换（每部作品独立气质）。
- 标题画面：背景图 Ken Burns 缓推 + 标题字渐入 + 菜单（开始/继续/读档/画廊/音乐鉴赏/设置/退出[桌面]）；继续 = 最近档一键续玩。
- UI 语言 zh-CN 默认，en 备选（P1）。

### 8.7 性能预算（硬指标，CI 守护）

| 指标 | 预算 |
|---|---|
| 首包（引擎+UI+标题资产） | ≤ 3MB（gzip 后），20Mbps 下可交互 ≤ 3s |
| 章节包 | 每章资源 ≤ 30MB，进入章节时进度条预载，对话期间**预取下一场景**资产 |
| 帧率 | 桌面 60fps / 移动 ≥ 30fps（粒子+滤镜同开） |
| 纹理内存 | 桌面 ≤ 256MB / 移动 ≤ 128MB；LRU 池自动 dispose（移动端单纹理 ≤ 1024px，构建期产出移动变体） |
| 渲染调度 | 事件驱动：无动画时停止 ticker（省电），动效期间才 rAF |

---

## 9. 音频系统规格

（选型论证见 §5.4，此处为完整行为规格）

- **总线**：BGM/SE/Voice/Ambient → master；各路 0–100% 独立 + 总音量；设置实时生效并存 localStorage。
- **BGM**：同一时刻至多 1 曲（含交叉）；`loop` 点来自 assets.yaml；`@bgm stop fade=1500` 收曲。
- **SE**：一次性触发，复音上限 8，同名快速连触发做节流。
- **Voice**：同时至多 1 条；新行触发时旧行按 `voice_sustain` 设置截断或继续；Auto 模式等待语音自然结束。
- **Ambient**：独立环境循环层（雨声/风声可与 BGM 叠加）。
- **Ducking**：voice 起播 BGM -6dB（800ms 斜坡），结束 1200ms 恢复；可在设置关闭。
- **解锁与生命周期**：标题"点击开始"手势内 resume + 静音 buffer 预播；`visibilitychange` hidden→暂停（可配置为继续播放）；从后台返回时检查 `AudioContext.state` 自动 resume；iOS 静音键致无声时 UI 给出提示文案。
- **资源策略**：章节包随预载下载；语音按需解码 + LRU；BGM 全解码缓存（同章节内）。
- **诊断**：dev overlay 显示当前总线状态/解码队列/缓存命中率。

---

## 10. 附加系统

### 10.1 CG 画廊

- 条目 = 资产组（同 CG 的差分页）；`gallery.yaml` 声明分组与排序，或 `@unlock cg ev_01` 运行时解锁（全局进度）。
- 未解锁显示剪影占位（缩略图高斯模糊 + 锁图标）；解锁后显示真缩略图，点击进入**CG 回想**——跳转到该 CG 首次出现的场景（临时状态重放，退出回画廊，不污染主存档）。

### 10.2 音乐鉴赏

- 曲目表来自 assets.yaml（曲名/作曲/备注）；`@unlock bgm` 或首次播放即解锁（策略可配：默认首播解锁）。
- 播放器：循环点播放、上一曲/下一曲、播放列表顺序；鉴赏内播放独立于游戏 BGM 总线状态（进入游戏时自动停止）。

### 10.3 场景回想

- `@unlock scene chapter2_start` 声明可跳转回想点；回想以临时状态从该 label 重放，Esc 退出回菜单；回想中禁止再解锁/覆盖全局进度中的"首次"标记（防止回想刷解锁）。

### 10.4 成就/流程图（P2）

- 结局流程图：脚本声明节点图（yaml），随解锁进度点亮；成就系统复用 unlock 机制 + 条件表达式。

---

## 11. 开发体验（DX）

- **`yanagi new <game>`**：脚手架（目录结构、示例剧本、game.yaml、主题变量）。
- **`yanagi dev`**：Vite dev server + 文件监视：
  - 剧本改动 → 重编译 → **热替换且尽量保现场**（按当前 label 重新定位，跳到该 label 最近安全点）；
  - 资产改动 → 清对应缓存即时生效；
  - 浏览器内 dev overlay：当前 `文件:行`、变量面板、跳转菜单（label 列表直接传送）、音频总线状态、已读集合开关；
  - 错误友好化：`script/02_school.yn:41:13 — 未知参数 "fade2"，@bg 支持: fade/slide/…`，可点击跳编辑器。
- **`yanagi check`**：全量静态检查（见 §6.3），`--strict` 供 CI；另含剧本统计（字数、分支数、label 覆盖、无语音行清单）。
- **`yanagi build`**：编译 + 资产管线（sharp/ffmpeg/字体子集）+ 分包 + 内容哈希 + `manifest.json`；`--target web|desktop|all`。
- **依赖自检**：首次运行检测 ffmpeg/sharp 可用性，缺失时给平台安装指引；`--no-audio-pipeline` 允许纯前端环境（CI）跳过转码。
- **文档**：`docs/` 内剧本语言手册（本白皮书 §6 扩展而成）+ 引擎架构说明 + 发布手册；M3 时用 mdBook 发布静态文档站。
- **VS Code**：M3 提供语法高亮扩展（TextMate grammar + 片段）；LSP 级诊断（报错直达）P4。

---

## 12. 测试与质量保障

| 层 | 工具 | 覆盖 |
|---|---|---|
| 单元（内核，Node） | Vitest | 解析器 golden 用例、表达式求值、VM 执行序列、**存档序列化往返**、schema 迁移链、随机确定性 |
| 属性/模糊 | fast-check | 随机字节串/随机 token 不崩溃且报错带行列号；`parse→serialize→parse` 幂等；随机合法脚本重放状态快照确定 |
| E2E | Playwright（对 build 产物） | canary 游戏（`games/demo`）全分支自动通关（选项表驱动）、存/读档往返、Skip/Auto/Backlog 交互、破坏性输入（狂点/连点/切菜单） |
| 金像截图 | Playwright `toHaveScreenshot` | 固定视口/DPR、强制 WebGL、内嵌字体、屏蔽动态区域（文本打字机）；基线按浏览器分目录 |
| 性能 | CI 计时预算 | 首包体积、可交互时间、demo 全程播放的纹理内存峰值（Chrome tracing） |
| 真机清单 | 手动 | iPhone Safari（音频解锁/静音键/内存）、Firefox 含私密模式、桌面三平台 WebView |

- **canary 游戏是防线核心**：`games/demo` 永远使用全部已发布特性（每次新特性合入必须同步扩展 demo），任何 PR 破坏 demo 通关即阻塞合并。
- 发布节奏：trunk-based + 特性开关；每里程碑打 tag 并冻结一段时间"只用不修特性"吃自己的狗粮。

---

## 13. 发布与部署

### 13.1 Web 子页面发布管线

```
游戏仓库（独立仓库，含 yanagi 引擎为依赖）
  → GitHub Actions：yanagi build --target web
  → 产物推送到主页仓库 /p/<slug>/（同账号 PAT / deploy key）
  → https://willow.tokiharu.xyz/p/<slug>/ 即可游玩
```

- `<slug>` 规则：公开作品用可读名（如 `p/hanabi/`）；**试运行作品用 10+ 字符不可猜随机串**（§13.2）。
- 产物规范：全部资源带内容哈希文件名（对冲 Pages `max-age=600` 协商缓存）；`index.html` 保持极小；可选 Service Worker 做 stale-while-revalidate（绕开无法自定义响应头的限制）。
- 主页仓库根补 `.nojekyll`；本仓库已有 CNAME，无需改动。
- **体积红线**：Pages 站点 ≤ 1GB、月带宽 100GB 软上限。对策：音频码率预算（§5.4）、按章节分包（首包之外不计入首访）、若未来作品资产超大（>1GB）则音频/CG 外链到 Cloudflare R2 等对象存储（保留预案，架构上 manifest 支持外部 origin）。

### 13.2 试运行期"仅直链可见"策略

**先说边界（诚实声明）**：主页仓库是公开的，GitHub Pages 没有访问控制、也不能自定义响应头。因此"绝对阻断"在纯 Pages 上不存在——拿到 `willow.tokiharu.xyz/p/<slug>/` **或** `tsunami2576.github.io/<repo>/p/<slug>/` 任一 URL 的人都能访问。能做到的最强隐蔽是：

1. **不可猜路径**：`<slug>` = 10–12 位 base58 随机串（≥60bit 熵），每部试运行作品独立。
2. **搜索引擎不可见**：引擎输出的每个 HTML 都带 `<meta name="robots" content="noindex,nofollow">`；**不放 robots.txt Disallow**（Disallow 会阻止爬虫看到 meta noindex，且被 Disallow 的 URL 若被外链仍可能"无抓取索引"；meta 方案更干净）。
3. **站内零入口**：主页不添加任何链接、无 sitemap 收录、社交平台分享时缩略预览关闭（og 标签留空）。
4. **可选软门禁**：构建开关 `gate: passcode`——进入标题画面前先显示口令输入页（纯前端，防君子不防小人，但能挡住偶然访客与爬虫预渲染）。
5. **硬门禁（若需要"不知道口令连直链也不给看"）**：把域名接入 Cloudflare 代理后用 **Cloudflare Access**（免费 50 用户，邮件 OTP）保护 `/p/<slug>/*` 路径。代价：整站经 CF 代理、Pages 回源配置变化——**仅在确有需要时启用**，默认不开。

试运行转正式 = 把 slug 换成可读名 + 主页挂入口 + 提交搜索引擎收录，引擎与产物零改动。

### 13.3 桌面版

- `yanagi build --target desktop` → Tauri 打包（Win NSIS / macOS dmg+notarization 可选 / Linux AppImage+deb）。
- GitHub Actions 三平台矩阵构建，产物挂 GitHub Releases（私有仓库亦可，链接即授权）。
- 存档为 `appDataDir/saves/*.json`（§5.6）；设置页提供"打开存档目录"按钮。
- 文档明示 Linux NVIDIA 环境变量兜底；发行说明包含已知 WebView 差异。

### 13.4 移动端浏览器

- 响应式 letterbox 至 16:9，竖屏时文本窗加高（安全区适配）；防双击缩放（`touch-action`）；横屏建议提示（可关）。
- 触控约定：单击 = 前进（两段式同鼠标）；屏幕左缘右滑 = Backlog；双指缩放关闭；长按 = 连续快进（软键盘设备 Ctrl 不可用的替代）。
- 音频解锁 UX：标题"点击开始"；静音键场景的提示文案（§9）。
- 纹理预算自动降级（§8.7）+ `deviceMemory` 探测。

---

## 14. 路线图与里程碑（持续迭代版）

> 开发主体是可以连续高效迭代的工程流程（AI 驱动开发），因此**不做日历排期**。里程碑由**能力门（验收清单）**定义：清单全绿即里程碑完成，与耗时无关。

### 14.1 迭代模型

每轮迭代固定走完以下闭环，任何一步不绿不进入下一轮：

1. **选题**：从能力门中取优先级最高的未完成项。纵向优先——先打通"解析器→内核→表现层→demo"的完整链路，再横向加厚。
2. **红色测试先行**：为本轮能力写失败测试（内核/解析器测试在 Node 中秒级运行）。
3. **实现**：最小正确实现，TS strict 全程通过。
4. **canary 扩展**：`games/demo` 同步用上新能力（demo 永远使用全部已发布特性）。
5. **全绿**：单测/类型检查/构建全部通过。
6. **留痕**：更新 `docs/ITERATIONS.md`（迭代台账：范围/产出/测试状态/遗留/下轮入口）与 `docs/DECISIONS.md`（偏离白皮书的决策及理由，ADR 风格）。

**回滚原则**：迭代结束时主干不可构建或测试红 → 回退本轮，不带病前进。
**存档安全原则**：任何迭代不得破坏旧存档可读性（存档往返/兼容测试是每轮必跑项）。

### 14.2 里程碑 = 能力门

**M0 · 走通闭环**（切片顺序仅是建议，每片独立可验证）

- [ ] M0.1 仓库与工具链骨架：pnpm monorepo、TS strict、Vitest、构建脚本、CI 占位
- [ ] M0.2 剧本语言 v0.1 核心子集：对话/旁白/行内标记 + `@bg/@show/@hide/@emotion/@bgm/@se/@ambient/@set/@if/@choice/@goto/@call/@return/@wait/@title/@unlock/@end_game`，错误报告带 文件:行:列
- [ ] M0.3 内核：VM（指令/跳转/子程序栈/确定性随机）、表达式求值器、GameState、存档快照与往返
- [ ] M0.4 文本窗：打字机（注音/傍点/变速/停顿/换行）、两段式推进、名前牌
- [ ] M0.5 舞台（bg/立绘/淡入淡出/聚焦压暗/震屏/闪光）+ 音频四总线（循环点/交叉淡化/ducking/手势解锁）
- [ ] M0.6 选择肢（条件显示/once/键盘导航）+ 存读档（缩略图/自动档轮转/快速档）+ 标题画面
- [ ] M0.7 canary demo 成文 + 资源存在性编译校验 + 全量测试绿

**验收**：demo 全分支可玩；`pnpm test` 与类型检查全绿；`pnpm build` 产物可运行。

**M1 · 玩家体验基线**

- [ ] Skip（已读集/全部/按住 Ctrl 临时快进/选择肢前停止）
- [ ] Auto（等待公式全参数化、可被点击打断、等语音结束）
- [ ] Backlog 完整版（200 条/语音重播/已读变色）+ 会话内回溯（环缓冲 20 个安全点）
- [ ] 设置面板全项（速度/Auto/四路音量/不透明度/失焦静音）+ 立绘呼吸与差分交叉
- [ ] 存档兼容策略（schema 迁移链 + scriptHash/label 重定位）+ 存档导出导入 + Firefox 私密模式降级
- [ ] 转场全家（fade/crossfade/slide/blinds/circle/feather）+ 天气粒子 + 章节题字演出
- [ ] 崩溃兜底（全局错误页/日志导出/pagehide 自动存档）
- [ ] 性能预算 CI（首包 ≤3MB/TTI ≤3s）+ Playwright 金像与 E2E 通关框架

**验收**：对照 §2.2 P0 清单逐项打勾；真机手动清单（iPhone Safari / Firefox 含私密模式）通过。

**M2 · 商业作品功能面**

- [ ] CG 画廊 / 音乐鉴赏 / 场景回想（临时状态重放，不污染主进度）
- [ ] Staff Roll；主题系统（藍/和双主题 + 游戏级覆盖）；标题画面正式化
- [ ] i18n 基础（strings 提取→JSON→运行时切换）；UI 语言切换
- [ ] 30 分钟"模拟作品"全功能走查

**验收**：模拟作品走查零阻塞项。

**M3 · 双端发布就绪**

- [ ] Tauri v2 壳 + 文件存档后端（SaveBackend 双实现）+ 三平台 CI 出包
- [ ] 主页部署管线（Actions → 主页仓库 `/p/<slug>/`）+ noindex/口令门构建开关
- [ ] 资产管线完备：字体子集、WebP/AVIF 双出、章节分包、下一场景预取
- [ ] 移动端浏览器全项适配（触控区/手势/安全区）；文档站（剧本手册/发布手册）

**验收**：试运行作品上线 `willow.tokiharu.xyz/p/<随机slug>/`；桌面三平台安装包出炉。**至此可用于真实创作。**

**M4 · 持续增强**（无终点，按创作需要取用）

Live2D 插件（先完成许可确认）· NVL 模式 · 成就/结局流程图 · VS Code 语法扩展→LSP · 剧本统计工具 · PWA/云同步钩子 · 泛光/LUT/自定义 shader 转场

### 14.3 迭代台账与决策日志

- `docs/ITERATIONS.md`：每轮迭代一段记录（范围/产出/测试状态/遗留/下轮入口），是跨会话的"进度总线"。
- `docs/DECISIONS.md`：所有偏离白皮书的实现决策与理由（ADR 风格），保证文档与代码不漂移。

### 14.4 Backlog（无序池，攒着不排期）

脚本变量监视面板 · dev overlay 跳转菜单 · 双击快进 · 剧本 diff 工具 · 语音自动关联规则 · 外部 origin 资产（R2 预案落地） · 剧本字数/分支覆盖统计

---

## 15. 风险与对策

| 风险 | 等级 | 对策 |
|---|---|---|
| **单人投入中断**（avg.js 教训） | 高 | 小内核；里程碑短且各自可玩；canary 测试防回归使"停半年再回来"成本可控；文档随代码走 |
| 浏览器存储逐出/私密模式丢档 | 高 | persist() + 导出/导入一等功能 + 降级策略 + 设置页存储状态可见 |
| iOS Safari 内存/音频怪癖 | 高 | 纹理预算+分包+LRU+移动变体；真机手动清单进每次发版流程 |
| WebKitGTK/WebView 桌面差异 | 中 | Pixi Canvas2D 回退兜底；环境变量文档化；Electron 备胎（架构上仅换宿主） |
| 剧本语言演化破坏旧存档 | 中 | schema 版本+迁移链；scriptHash+label 重定位；demo 的存档往返测试进 CI |
| Pages 1GB/100GB 限制 | 中 | 码率与分包预算；manifest 支持外部 origin（R2 预案） |
| DSL 设计缺陷（写到中期发现表达力不够） | 中 | **M0 前先用 v0.1 语法手写 3 段不同风格的真实剧本样本验证**（已列入 M0 首项任务）；逃生舱：自定义 TS 命令注册 |
| Live2D 许可模糊 | 低 | 默认不带；插件化隔离；启用前官方邮件确认 |
| 工具链依赖（ffmpeg/sharp）安装门槛 | 低 | `yanagi doctor` 自检 + 安装指引 + CI 可跳过转码 |

---

## 16. 附录

### A. 示例剧本（节选，完整版随 M0 交付于 games/demo）

```
;;; 第一章 · 夏蝉

#ch1_start
@bg classroom_afternoon fade=800
@bgm cicada_sunny vol=0.7
@title 第一章 · 夏蝉

蝉声像是把整间教室泡在了温水里。

@show yui normal left
yui「[ruby:放課後;ほうかご]的教室，果然还是太安静了呢。」voice=yui_0101
yui「[em]你[/em]也会留下来吗？」voice=yui_0102

@choice「怎么回答？」
  「留下来陪你」 -> ch1_stay
  「今天先回家」 -> ch1_home
@end

#ch1_stay
@set affection += 1
@emotion yui shy
yui「……那就，[color=#e58b9c]稍微[/color]，只有稍微哦。」voice=yui_0103
@goto ch1_merge

#ch1_home
@emotion yui lonely
yui「是吗……[pause=600]那，明天见。」voice=yui_0104

#ch1_merge
@weather sakura density=0.4
@unlock cg ev_ch1_window
蝉声渐渐远去，窗外的天空开始染上夏天的颜色。
（……这个夏天，或许会和想象中的不太一样。）
```

### B. 默认键位 / 触控手势

| 动作 | 键盘 | 触控 |
|---|---|---|
| 前进/补全 | 鼠标左键 / 空格 / Enter | 单击 |
| 快进（按住） | Ctrl | 长按 |
| Skip 切换 | Tab | 菜单内 |
| Auto 切换 | A | 菜单内 |
| Backlog | 滚轮上 / L 键呼出；居中宽面板（预留头像位）；正序（最新在下）；含选择文本；⏪ 按条回溯；滚到底下滚关闭 | 屏幕左缘右滑 |
| 前进 | Enter / 滚轮下（空格默认为隐藏对话框，可在设置改为下一句） | 单击 |
| 回溯 | 记录界面按条 ⏪（锚点+确定性重放；选择按日志模拟） | 同左 |
| 控制条 | 对话框底部：隐/快存/快读/⏮/◀/AUTO/▶/⏭/⚙/存/读 | 同左 |
| 系统界面 | Esc / 右键（对话中）；页签：画面/声音/文本/操作/其他/存档/读档；页签记忆 | — |
| 右缘快速栏 | 鼠标靠近右缘弹出；存/读切换 + 翻页 | — |
| 风险确认 | 快存/快读/覆盖/读档/上下选择肢/回溯/返回标题/退出 → 确认弹窗（默认聚焦"是"） | — |
| 隐藏 UI | H | 双指单击 |
| 全屏 | F | 菜单内 |
| 菜单 | Esc | 右上角按钮 |

### C. 默认配置项（设置面板）

文字速度（0–80 字/s，默认 30）· Auto 基础等待（0.3–3s，默认 1.2s）· Auto 逐字附加（0–50ms/字，默认 15）· Auto 等待语音（开）· Skip 默认范围（已读）· 选择肢后继续 Skip（关）· 四路音量（默认 80/80/90/70）· 语音压低 BGM（开，-6dB）· 失焦静音（开）· 窗口不透明度（85%）· 已读变色（开）· 转场时长系数（100%）· UI 语言（zh-CN）· 主题（藍）· 全屏（关）

### D. 术语表

- **ADV / NVL**：底部窗口式 / 全屏页面式文本呈现
- **安全点（safe point）**：存档允许生成的指令边界（DIALOGUE/MENU 前）
- **表现意图（PresentIntent）**：内核发给表现层的声明式状态差分
- **已读集合（readSet）**：全局持久的历史已读行 uid 集合，Skip 判定依据
- **剧本指纹（scriptHash）**：编译产物内容哈希，存档兼容判定依据
- **slug**：作品在 `/p/` 下的路径标识，试运行期为不可猜随机串

### E. 调研参考资料（要点）

- Ren'Py Web 导出限制（50MB 缓存上限、无线程、存档导入导出）：renpy.org/doc/html/web.html；偏好基线：renpy.org/doc/html/preferences.html；Firefox 私密模式 IndexedDB：renpy#4793
- WebGAL（MPL-2.0，TS+React+Pixi）与其 issues（#519 性能、#1014 解析器、#1028 字库）：github.com/OpenWebGAL/WebGAL
- TyranoScript（jQuery/DOM 架构、2026-02 修 iOS 后台音频）：github.com/ShikemokuMK/tyranoscript
- Monogatari（MIT、TS 重写进行中）：github.com/Monogatari/Monogatari
- PixiJS v8.16（Canvas2D 回退、Tagged Text）：pixijs.com/blog/8.16.0；可访问性：pixijs.com/8.x/guides/components/accessibility
- Web Audio 循环点与 Safari 解码怪癖：MDN AudioBufferSourceNode；WebKit bug 226922；Howler 维护状态：goldfire/howler.js#1594、#39
- 存储逐出与 persist()：web.dev/articles/persistent-storage；Safari 无法编码 WebP 缩略图：canvas toBlob 兼容性
- Tauri v2 与 webview 数据目录迁移问题：tauri#11252；Linux 图形问题专页：v2.tauri.app/develop/debug/linux-graphics
- GitHub Pages 限制（1GB/100GB/无自定义头/自定义域子路径）：docs.github.com/en/pages；isaacs/github#547
- Live2D SDK 许可（小规模事业者豁免、Expandable Application 条款）：live2d.com/en/sdk/license
- 玩家体验基线（评审视角）：arimiadev.com「I played over 100 visual novels…」；NScripter automode 惯例

---

*本白皮书 v1.1。§14 为"能力门 + 持续迭代"路线图（开发主体为可持续迭代的工程流程，不做日历排期）；迭代进度见引擎仓库 `docs/ITERATIONS.md`，实现决策见 `docs/DECISIONS.md`。*
