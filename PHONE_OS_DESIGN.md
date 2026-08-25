# Lumi Phone / 专属虚拟手机系统设计方案

| 项目项 | 决策 |
|---|---|
| 文档版本 | v0.1，2026-08-25 |
| 工作代号 | Lumi Phone / LumiOS（正式名称可由皮肤覆盖） |
| 产品定位 | 一件可长期生长、可探索、可收藏的私人数字物件，而不是 iPhone 仿制网页 |
| 首发载体 | Web + PWA，移动端全屏优先；桌面端呈现完整虚拟设备 |
| 首发版本 | 标准版 Lumi Standard + 专属版 Ad Astra Edition |
| 部署建议 | 源码独立仓库维护，构建产物发布到本站 `/phone/` 或不易猜测的作品路径 |
| 当前状态 | 方案评审；尚未进入实现 |

---

## 0. 核心结论

推荐把项目拆成四个彼此独立、可以组合的层：

1. **LumiOS 内核**：启动、锁屏、桌面、手势、窗口、通知、横竖屏、存档和解锁规则。
2. **App 平台**：统一的 App 生命周期、导航、权限、事件和数据接口；新 App 不需要修改系统壳。
3. **Edition 皮肤**：视觉、图标、声音、动效性格、系统文案与可选布局，不承载业务数据。
4. **Content Pack 内容包**：照片、信件、音乐、章节、纪念日、地点和隐藏条件，不写进组件源码。

这四层的分离是可拓展性和可定制性的根本。标准版证明系统本身完整、克制、好用；专属版通过一个 `Ad Astra Edition` 皮肤和一个私密内容包变成“只属于她的手机”，而不是复制一套代码。

第一版不追求把所有想法都做完。先交付一个能让人相信“这真的是一部手机”的系统壳，再把 **Memories、Story、Garden、Letters** 四个 App 做深。Music、Atlas、Vault、Companion 逐期加入。

---

## 1. 项目上下文与可复用资产

当前仓库已经提供三类重要基础：

- 旧 `valentine/` 与 `per-aspera-ad-astra-2026/` 私人素材已移出公开仓库，并在历史清理前保存到本地加密边界内的离线备份。
- 当前 Ad Astra 只发布加密文字内容；Story 与 Memories 使用程序化星图和坐标视觉，不携带私人照片。
- `vn-engine/WHITEPAPER.md`：已经设计了 Yanagi 视觉小说引擎。Story App 应预留 Yanagi 适配器，但不能等待完整引擎开发完毕才启动手机项目。

根站点目前是无构建工具的静态个人主页。虚拟手机会包含状态机、内容编译、PWA、按 App 分包和自动化测试，不宜继续堆叠在根目录的 Vanilla JS 中。因此建议：

```text
独立源码仓库 lumi-phone/       GitHub Pages 仓库（当前仓库）
TypeScript + Vite + React       /phone/ 仅接收构建产物
          |                                 ^
          +------- CI build + publish ------+
```

若暂时不拆仓库，次优方案是在本仓库新建隔离的 `phone-src/` 工作区，构建到 `phone/`，但禁止把依赖和源码散落到个人主页根目录。

---

## 2. 目标、边界与设计原则

### 2.1 产品目标

- **第一眼可信**：启动、锁屏、桌面、App 开合、状态区域和手势形成完整设备感。
- **第二眼独特**：不复制 iOS 的品牌、几何和图标，而是有自己的材质、动效语言和系统词汇。
- **长期可回访**：内容能按日期、事件和成就逐步解锁，而非一次看完的贺卡。
- **低成本扩展**：增加 App、皮肤或内容包时，不修改系统核心。
- **作者易维护**：日常增加一封信、一段音乐或一组照片时，不需要改 React 组件。
- **接收者易使用**：无需教程，依靠熟悉的手机习惯、清楚的层级和一致的返回行为完成探索。
- **隐私优先**：亲密内容、API 密钥和管理凭据不以明文进入公开仓库或前端包。

### 2.2 非目标

- 不逐像素复刻 iPhone，不使用 Apple 商标、系统图标资产或完全相同的交互命名。
- 不在第一版实现通话、真实短信、社交网络等低情感价值的完整系统模拟。
- 不为炫技堆叠持续运动、重度玻璃、3D 景深和粒子；所有动效必须传达空间、因果或情绪。
- 不在纯前端暴露 AI Key，也不把 Companion 伪装成真人实时回复。
- 不让 Yanagi 引擎、AI Companion 或可视化编辑器成为首发阻塞项。

### 2.3 六条设计原则

1. **内容先于界面**：最好的动画最终要把注意力交还给照片、文字和声音。
2. **空间连续**：图标从原位置长成 App，照片从缩略图长成回忆，关闭时原路返回。
3. **一层一个惊喜**：首开、首次解锁、第一次打开 App、特定日期分别揭示内容，不在首页倾倒全部彩蛋。
4. **系统一致、App 有性格**：系统层统一导航、触感和状态；每个 App 只有一个最强的视觉主意。
5. **渐进增强**：高级转场、震动和横屏锁定失败时，功能仍然完整。
6. **动效可退出**：频繁动画短而准，可被手势打断，并完整支持 `prefers-reduced-motion`。

---

## 3. 体验叙事：从礼物到长期陪伴

### 3.1 用户情绪曲线

```text
拥有感          识别感           探索欲             被理解            持续回访
开机/命名  ->   专属锁屏   ->    App 与彩蛋   ->     记忆/信件   ->    花园/未来解锁
```

- **拥有感**：这不是打开一个网页，而是唤醒一台有型号、有序列号、有系统版本的设备。
- **识别感**：锁屏图像、日期、图标物件和一句克制的文案让她立刻知道它与自己有关。
- **探索欲**：桌面不解释功能，只用状态、图标细节和通知线索引导她打开 App。
- **被理解**：每份内容不是通用情话，而是带有时间、地点、当时细节和你的真实观察。
- **持续回访**：新花、未来信件、纪念日和新章节让它在赠送日之后仍有生命。

### 3.2 首次启动流程

1. 黑场中出现一枚微弱呼吸的 Lumi 标记；首次加载进度藏在标记的描边完成度里。
2. 标记聚拢为一句专属开机署名，例如 `Designed for [Name]`；不超过 2.4 秒，点击可立即完成。
3. 设备进入锁屏，显示真实时间、“我们一起走过的第 N 天”和一张可辨认的真实照片或定制插画。
4. 上滑时壁纸轻微后退、时钟向上让位，桌面图标从景深中逐个落定。
5. 顶部 Halo 收到第一条系统通知，例如一封带日期的未读信；不弹教程。
6. 首次旅程结束后，后续启动直接回到上次状态；完整开机动画只在设置中主动重播。

### 3.3 日常启动流程

- 冷启动恢复上次打开的 App、页面和滚动位置。
- 超过设定时间再次访问时回到锁屏；短时间切回不重复打断。
- 当天有新内容时，只通过通知点、Halo 短暂展开和一声极轻的提示音表达。
- 没有新内容时保持安静，不为了“活跃度”制造无意义红点。

---

## 4. 系统信息架构

### 4.1 系统层级

```text
Boot
└── Lock Screen
    └── Home Surface
        ├── App Workspace
        │   ├── System Apps
        │   └── Gift Apps
        ├── Halo（当前活动 / 轻通知 / Now Playing）
        ├── Quick Panel（亮度、声音、主题、专注模式）
        ├── Notification Shade
        ├── App Switcher
        └── Search（App、记忆、信件与地点统一搜索）
```

### 4.2 系统表面

| 表面 | 功能 | 质感重点 |
|---|---|---|
| Boot | 品牌、首次加载、版本迁移 | 标记形变、声音同步、可跳过 |
| Lock Screen | 时间、日期、纪念日、通知预览 | 壁纸景深、时钟避让主体、上滑连续过渡 |
| Home Surface | App 网格、组件、Dock | 图标真实落点、分页磁吸、编辑模式轻震 |
| Halo | 当前播放、计时器、解锁反馈、轻通知 | 同一胶囊的形变，不堆多个浮层 |
| Quick Panel | 常用设置与情境模式 | 手势跟手、控制密度高、不过度卡片化 |
| Notification Shade | 新信、花园、纪念日 | 时间分组、可直接进入目标内容 |
| App Switcher | 最近 App、恢复位置、关闭 | 卡片位置连续、内容预览隐私模糊可配置 |
| Search | 跨内容检索与快速启动 | 结果按 App 分组、键盘与触屏同等可用 |
| Settings | 外观、声音、动效、存储、关于 | 真正可操作，不用笑话填满每一项 |

### 4.3 首发 App

| App | 核心用途 | 第一版范围 | 专属版差异 |
|---|---|---|---|
| Memories | 回看共同经历 | 时间轴、照片详情、标签、地点、收藏 | 星座式年份索引、导入现有相册、专属照片卡面 |
| Story | 互动叙事 | 章节、对话、选择、进度、基础音频 | 相遇、旅行、备考、未来四章；后续接 Yanagi |
| Garden | 长期陪伴 | 每日一小步、成长阶段、留言、离线进度 | 备考主题植物、里程碑开花、避免签到惩罚 |
| Letters | 信件与定时内容 | 收件箱、定时解锁、附件、收藏 | 毕业信迁移、未来信、纪念日信 |
| Music | 共同 BGM | 播放列表、歌词/说明、后台播放状态 | Night Study、旅行、章节主题曲 |
| Atlas | 地点与愿望 | 地图/列表、足迹、愿望地、关联记忆 | 东京、北京、旅行与未来计划 |
| Vault | 隐藏内容 | 口令/日期/成就解锁、线索、收藏 | 私人彩蛋和最终章节；隐私级别单独控制 |
| Settings | 系统设置 | 主题、声音、动效、导出、存储、关于 | 型号、制造者、纪念日和署名字段 |

`Companion` 作为可选 P3 App：它需要服务端鉴权、隐私策略、用量控制和明确身份提示，不进入纯静态首发版。

### 4.4 标准手机方案：Lumi Standard

标准版不是空白 Demo，而是一套可以给任何内容包复用的完整系统：

- 中性名称、示例内容和一套经过完整 QA 的默认 App 排列。
- 明亮与暗色两种外观，材质克制，强调信息和照片。
- 默认图标由清晰几何符号与多色功能分类构成，不复刻任何现成系统图标。
- 默认系统文案直接、简短，不在每个设置项里塞爱情隐喻。
- 默认动效是所有 Edition 的性能基线；皮肤只能在预算内改变参数。
- 自带 `Demo Content Pack`，用于自动化测试、截图回归和新皮肤预览。

### 4.5 专属手机方案：Ad Astra Edition

专属版以 `PER ASPERA / AD ASTRA` 为核心，不做“全粉色爱心主题”。视觉关键词是：**雨后清晨、珐琅小物、星图、坐标、成长**。

#### 视觉个性

- 色彩：墨黑与瓷白作背景，日出珊瑚、柳叶绿、微金和清澈天蓝作并列强调色，避免单一色调统治界面。
- 壁纸：默认使用程序化星图与抽象坐标，不依赖照片；未来若重新启用影像，必须由内容所有者明确选择并进入受控私有源。
- 图标：把共同记忆中的具体物件做成小型珐琅徽章，例如相机、车票、游戏手柄、错题本、海边烟花和戒指文字。
- 字体：系统正文保持高可读无衬线；章节标题和信件日期使用一款克制的衬线体。手写体只用于真实署名。
- 声音：纸张落下、玻璃轻碰、相机快门和两到三音的短铃；不使用持续甜腻的环境音。

#### 专属系统内容

- 锁屏：`我们一起走过的第 N 天`，可切换为下一个共同目标倒计时。
- About：型号 `[Name] Edition`、系统 `Ad Astra OS 1.0`、制造者署名、首次启动日期。
- Focus：备考专注模式只保留 Garden、Music、Letters，并将通知降到最低。
- Halo：学习计时结束时展开一朵小花；新信到达时是一枚纸封；播放音乐时显示极简波形。
- Memory Constellation：年份不是普通列表，而是可缩放星图；星与星之间只连接有真实关联的事件。
- Garden：成长依赖“回来看看”与真实日期，不因漏签枯萎，不制造负罪感。
- 最终彩蛋：完成首批 Story、打开若干关键记忆后，Vault 解锁 `Future` 章节；日期条件仍由内容配置控制。

#### 皮肤不是硬编码

专属版由以下可替换文件组成，删除它们不会影响系统运行：

```text
editions/ad-astra/
├── edition.yaml           # 名称、日期、App 排列、功能开关
├── theme.tokens.json      # 颜色、字型、尺寸、材质
├── motion.tokens.json     # 动效时长、曲线、弹簧和强度
├── sounds.yaml            # 系统音效映射
├── icons/                 # 专属 App 图标
├── wallpapers/            # 锁屏/桌面素材与主体蒙版
├── copy.zh-CN.json        # 系统文案覆盖
└── content/               # 私密内容包入口
```

---

## 5. 交互与动效系统

### 5.1 统一动效词汇

| 类型 | 用途 | 建议节奏 |
|---|---|---|
| Press | 按下反馈 | 70–110ms，缩放不低于 0.96，松手立即恢复 |
| Micro | 开关、红点、选中态 | 140–220ms，低位移或无位移 |
| Navigate | 同一 App 内前进/返回 | 220–320ms，方向与导航一致 |
| Launch | 图标与 App 开合 | 360–480ms，可手势打断 |
| Reveal | 首次解锁、彩蛋、章节题字 | 600–1200ms，仅偶发场景 |
| Ambient | 壁纸、花园、音乐 | 低幅度、低频率，后台和省电时暂停 |

动效参数必须来自 token，不允许组件里散落 `transition: 0.3s`。统一的 `TransitionCoordinator` 负责：

- 同一时间只允许一个全屏转场；新操作可完成或取消旧转场。
- 手势中使用真实位移，松手后才使用弹簧收束。
- DOM 更新永远不依赖动画成功；View Transitions API 只做渐进增强。
- `reduced` 模式把位移、缩放、模糊替换为 80–160ms 淡入淡出。

### 5.2 关键动效分镜

#### 图标打开 App

1. 指尖压下：图标缩到 0.96，阴影收紧，标签淡出。
2. 松手确认：图标背景从原位置扩展，保持同一圆角连续变化。
3. 120ms 后 App 首屏关键元素开始出现；非关键内容可在后续帧加载。
4. Halo 与底部 Home Indicator 保持稳定，建立系统层连续性。
5. 返回桌面时完整反演到原图标；图标跨页或被移动时回到当前真实位置。

#### 锁屏上滑解锁

1. 壁纸与时钟跟随手指移动，速度不同形成轻微深度。
2. 到阈值前松手，界面按当前速度回弹；过阈值后继续完成，不突然跳变。
3. 桌面图标不是统一淡入：按离手位置向外传播 40–70ms 的错峰，但总时长小于 500ms。
4. 解锁声音只在用户开启系统音效且浏览器音频已被手势解锁时播放。

#### Halo 形变

1. 状态图标先在原位缩小，为内容让位。
2. 外壳宽度扩张，曲线保持连续；内容在外壳完成 60% 后显现。
3. 轻通知 2.5–4 秒后自动收起，音乐与计时器保持常驻。
4. 多事件进入队列，不同时叠出多个胶囊。

#### 手机横屏转换（重点）

系统区分两种场景：

**真实手机**：尊重物理方向变化，页面使用 `visualViewport`、安全区和容器查询立即建立目标布局，再用元素级过渡保持内容连续；不把“请旋转手机”作为常规流程。

**桌面虚拟设备**：允许 App 请求 `portrait`、`landscape` 或 `adaptive`。外壳执行完整转化：

```text
0ms       冻结交互并记录焦点、滚动位置、共享元素几何
0–160ms   外壳轻微缩小到 0.96，环境阴影收拢
80–420ms  设备旋转 90°；宽高以同一中心交换，避免先拉伸后旋转
180–500ms App 布局从 portrait 模式重排为 landscape，共享元素移动到新位置
420–620ms 外壳回到 1.0，阴影展开，焦点与交互恢复
```

细节要求：

- 图像、视频和 VN 舞台保持同一内容裁切中心，不能在旋转中闪成另一张构图。
- 状态区与 Halo 走最短路径重排，而非跟着画面倒转文字。
- 横屏只改变布局，不丢失 App 路由、播放进度、表单内容和滚动语义位置。
- 用户在动画中再次旋转时取消当前时间线，从实时矩阵继续到最新目标。
- Screen Orientation Lock 仅在安装/全屏且浏览器允许时尝试；失败时静默退回自适应布局。
- reduced motion 下不旋转外壳：150ms 淡出、交换宽高、150ms 淡入。

#### 照片进入记忆

- 缩略图与详情图使用同一共享元素 ID，照片不闪白、不重新裁切。
- 详情文字从图片下沿自然出现；关闭时回到原时间轴位置。
- 连续左右浏览使用固定画框尺寸，避免不同宽高比推动周围 UI。

### 5.3 触觉、声音与光影

- Android 支持时使用极短震动作为可选增强；iOS 和不支持设备不模拟失败提示。
- 每个动作最多一个声音；频繁导航默认无声。
- 桌面端可用指针位置驱动外壳边缘 1–2px 的高光变化，离开设备后归中；移动端不运行。
- 阴影、模糊和滤镜不能承担核心信息，低性能模式自动关闭背景模糊与动态壁纸。
- 所有重要声音同时有视觉反馈；所有视觉动效不作为唯一提示。

### 5.4 手势与可访问替代

| 手势 | 行为 | 替代方式 |
|---|---|---|
| 锁屏上滑 | 解锁 | 键盘 Enter / 可访问按钮 |
| 底边上滑 | 回桌面 | Home 图标按钮 / Escape |
| 底边上滑停留 | App Switcher | 键盘快捷入口 / Quick Panel |
| 屏幕左缘右滑 | App 内返回 | 导航栏返回图标 / Alt+Left |
| 顶部下拉 | 通知或 Quick Panel | 状态区按钮 |
| 桌面长按 | 编辑桌面 | 图标上下文菜单 |

触控目标默认至少 44×44 CSS px；文字缩放到 200% 时仍能访问核心功能。横屏和竖屏都必须保持完整功能，而不是把某一方向作为无法操作的提示页。

---

## 6. 视觉系统与皮肤契约

### 6.1 视觉层级

1. **Wallpaper / Scene**：内容背景，必须可辨识且服务人物或地点。
2. **Content Plane**：照片、文字、时间轴、VN 舞台，是最高注意力层。
3. **Control Material**：导航、按钮、滑条和 Halo；材质统一但不过度覆盖内容。
4. **Feedback Plane**：焦点、按压、通知、加载和错误；出现短暂、含义明确。
5. **Device Shell**：仅桌面/平板环境显示；移动端让内容真正占满设备。

系统不使用“页面区块全都漂浮成卡片”的设计。列表、时间轴和设置是无框结构；卡片只用于单个重复记忆、信件、通知和确实需要边界的工具。

### 6.2 Token 层次

```text
primitive       原始颜色、字体、间距、时长
semantic        surface / text / accent / danger / focus
component       halo / icon / dock / sheet / memory-card
edition         Ad Astra 对 semantic 与少量 component 的覆盖
context         dark / light / portrait / landscape / reduced / low-power
```

皮肤可以配置：

- 颜色、字型、字重、阴影、边框、纹理强度和系统材质。
- App 图标、壁纸、开机标记、系统音效和品牌文案。
- 动效曲线、弹簧、错峰幅度和环境运动强度。
- 桌面网格、Dock 容量、组件位置和 App 默认排序。
- 各 App 公开的命名插槽，例如 Memories 的节点形状、Garden 的物种和 Story 的文本窗样式。

皮肤不可以：

- 注入任意运行时代码。
- 改写存储结构、路由协议或解锁安全语义。
- 缩小核心触控目标、隐藏焦点、破坏文字对比度或绕过 reduced motion。
- 直接引用系统组件内部 DOM 结构；只能使用稳定 token 和 slot。

### 6.3 图标与品牌

- App 图标保持统一光源、边缘语言和视觉重量，但各自拥有至少一个独立强调色。
- 图标是可替换的位图/WebP 或受控 SVG 资产；系统按钮优先使用成熟图标库的符号。
- `Lumi` 标记应是简单几何或字标，可从开机动画自然形变到 Halo 或 Home Indicator。
- 任何专属照片都不直接塞进 48px 图标里；小尺寸使用明确物件，照片留给组件和壁纸。

---

## 7. 技术架构

### 7.1 技术选型

| 领域 | 推荐方案 | 理由 |
|---|---|---|
| 语言与构建 | TypeScript strict + Vite + pnpm workspace | 类型贯穿 App SDK、内容与工具；静态发布简单 |
| UI | React | 组件生态成熟，适合多 App 壳、懒加载和 Creator Studio |
| 状态机 | XState（系统状态）+ App 内局部状态 | Boot/Lock/Home/App/Overlay/Orientation 的并发状态适合显式状态图 |
| 路由 | Hash Router + 内部 Navigation API | GitHub Pages 子路径刷新可靠，支持可分享深链 |
| 动效 | Motion/WAAPI + CSS；View Transitions 渐进增强 | 手势弹簧、共享元素和浏览器原生过渡各取所长 |
| 2D 舞台 | PixiJS 按 App 懒加载 | Garden、Story、星图需要时使用，系统壳不承担 Canvas 成本 |
| 校验 | Zod + JSON Schema 导出 | 构建期阻止坏内容上线，也方便 Studio 生成表单 |
| 持久化 | IndexedDB + localStorage 小设置 | 进度、内容索引和 Blob 分层存放，支持迁移与导出 |
| PWA | Manifest + Service Worker | 安装、离线壳和加密静态资产缓存 |
| 测试 | Vitest + Testing Library + Playwright | 状态机、组件、手势、横竖屏和视觉回归完整覆盖 |

系统壳使用 DOM，不用 Three.js 制作“3D 手机”。设备质感由响应式几何、阴影、材质和少量指针高光完成；只有明确需要空间内容的 App 才引入 Pixi/Three，避免首包与移动端耗电失控。

### 7.2 Monorepo 骨架

```text
lumi-phone/
├── apps/
│   ├── phone/                  # 发布给接收者的 PWA
│   ├── studio/                 # 仅本地运行的内容/皮肤编辑器
│   └── playground/             # App SDK 与动效沙盒
├── packages/
│   ├── core/                   # 状态机、事件、规则、迁移；零 React
│   ├── shell/                  # Boot/Lock/Home/Halo/Panel/Switcher
│   ├── app-sdk/                # App 注册、生命周期、导航、能力接口
│   ├── theme/                  # token 解析、皮肤校验、上下文合并
│   ├── motion/                 # TransitionCoordinator 与动效预设
│   ├── content/                # 内容 schema、编译器、索引、加密
│   ├── storage/                # IndexedDB、导入导出、版本迁移
│   ├── audio/                  # 系统提示音与 Music 共用音频总线
│   ├── ui/                     # 基础控件、图标、无障碍能力
│   ├── testing/                # Demo Pack、fixtures、手势 helpers
│   └── apps/
│       ├── memories/
│       ├── story/
│       ├── garden/
│       ├── letters/
│       ├── music/
│       ├── atlas/
│       ├── vault/
│       └── settings/
├── editions/
│   ├── standard/
│   └── ad-astra/
├── content-packs/
│   ├── demo/
│   └── girlfriend-private/     # 私有仓库或加密源，不进公开历史
├── tools/
│   ├── import-valentine/       # 迁移现有 photos.json 与图片
│   ├── import-letter/          # 迁移毕业信内容
│   └── asset-pipeline/         # 尺寸、格式、主体蒙版、哈希
└── docs/
    ├── architecture.md
    ├── app-authoring.md
    ├── edition-authoring.md
    └── content-authoring.md
```

### 7.3 运行时分层

```text
Edition + Content Pack
        |
        v  build-time validate / hash / encrypt / index
Static Runtime Manifest
        |
        v
Phone Shell ---- App Registry ---- Lazy App Module
     |                |                  |
     +------ OS Event Bus ---------------+
                     |
          Core State Machine / Rule Engine
                     |
      Storage / Audio / Clock / Platform Adapters
```

- `core` 不访问 DOM、React、IndexedDB 或真实时钟；所有平台能力通过接口注入，因此状态机可以确定性测试。
- `shell` 只知道 App Descriptor，不 import 具体 App 页面。
- App 通过 SDK 请求通知、方向、音频焦点和解锁事件，不直接操作系统 DOM。
- Edition 与 Content 在构建期合并出 manifest；运行时不扫描目录，也不执行字符串代码。

### 7.4 系统状态模型

系统状态不是一个巨大的 `isOpen` 布尔集合，而是并发状态图：

```text
session:       booting | locked | active | background
workspace:     home | launching | app | switching
overlay:       none | halo | notifications | quickPanel | search | modal
orientation:   portrait | changing | landscape
audioFocus:    none | system | music | story
privacy:       public | unlocked | relocked
network:       offline | online | degraded
```

关键不变量：

- 全屏 overlay 同时最多一个；系统 modal 可在其上，但必须恢复原焦点。
- App 启动过程中不能再次启动另一个 App；新意图进入 transition queue。
- 锁屏时暂停 App 交互和隐私预览，但音乐是否继续由用户设置决定。
- 方向变化不改变当前路由；恢复存档时不播放入场动效。
- 所有解锁通过 Rule Engine 写入事件日志，不能由 UI 组件自己改布尔值。

### 7.5 App SDK 契约

```ts
interface LumiAppDescriptor {
  id: string;
  name: LocalizedText;
  icon: AssetRef;
  entry: () => Promise<LumiAppModule>;
  orientation: 'portrait' | 'landscape' | 'adaptive';
  capabilities: AppCapability[];
  unlock?: UnlockRule;
}

interface LumiAppContext {
  navigation: AppNavigation;
  events: TypedEventBus;
  storage: NamespacedStorage;
  notifications: NotificationClient;
  audio: AudioFocusClient;
  orientation: OrientationClient;
  theme: ResolvedTheme;
  content: ReadonlyContentClient;
}

interface LumiAppModule {
  mount(context: LumiAppContext): Promise<void>;
  suspend(reason: 'switcher' | 'lock' | 'background'): void;
  resume(): void;
  unmount(): void;
}
```

每个 App 的存储自动加 namespace；权限默认拒绝。App 请求横屏、后台音频或通知时由系统决定是否支持，不能假设浏览器一定成功。

### 7.6 Content Pack 契约

内容使用 YAML/Markdown/媒体文件，但构建后成为只读、带版本的 JSON 索引：

```yaml
id: memory.tokyo.day-1
type: memory
date: 2026-04-18
title: 第一次走过这条街
body: ./tokyo-day-1.md
assets:
  - ./photos/tokyo-01.jpg
tags: [旅行, 东京]
location: { lat: 35.6812, lng: 139.7671, label: 东京 }
visibility: private
unlock:
  type: all
  rules:
    - { type: dateAfter, value: 2026-09-01T00:00:00+08:00 }
    - { type: completed, target: story.episode-02 }
```

统一内容类型至少包括：

- `memory`：时间、地点、人物、媒体、文字与关联内容。
- `letter`：寄出/解锁时间、正文、附件和重要级别。
- `storyChapter`：场景、对话、选择、变量和结局。
- `track`：音频、封面、说明、循环点和关联内容。
- `gardenMilestone`：成长条件、视觉阶段和留言。
- `place`：足迹或愿望地、状态、坐标和关联内容。
- `secret`：解锁规则、线索、失败冷却和目标内容。

所有 ID 一经发布不随标题改变。schema 带 `version`；破坏性变更必须提供 migration。

### 7.7 解锁规则引擎

支持数据化组合，不允许内容包注入 JS：

```text
always
dateAfter / dateBefore
daysSince(relationshipStart)
opened(contentId, count)
completed(contentId)
collected(tag, count)
code(hash, attempts, cooldown)
sequence(eventIds)
all([...]) / any([...]) / not(rule)
```

- 客户端日期只能用于浪漫的渐进体验，不被当作安全边界；改系统时间可能提前解锁，应接受或由服务端签名时间增强。
- 口令只保存强哈希和 salt；私密内容本体仍需加密或服务端门禁。
- 规则计算结果可缓存，但事实来源始终是 append-only event journal。
- 规则提供 `hint` 和 `nextCheckAt`，UI 才能显示自然线索并避免轮询。

---

## 8. 易操作的创作与维护流程

### 8.1 接收者侧

- 首屏只有锁屏，不先展示产品说明、功能列表或操作教程。
- App 数量首屏控制在 8–12 个；核心 App 放在拇指易达区域，设置与次要功能移到第二屏或搜索。
- 返回逻辑全局一致：App 内返回上一层，底边手势回桌面，关闭 overlay 恢复之前焦点。
- 空状态给出内容本身的状态，例如下一封信的封蜡或花园土壤，不用大段说明“这里以后会有什么”。
- 删除、重置、导入等不可逆操作二次确认；普通探索永远不惩罚误触。

### 8.2 作者侧：Local Creator Studio

`apps/studio` 只在本机启动，不发布给接收者：

- 左侧内容树：Memories、Letters、Story、Music、Garden、Unlocks。
- 中央编辑器：基于 schema 自动生成表单，Markdown 正文可视预览。
- 右侧实时设备：标准版/专属版、亮/暗、横/竖、桌面/手机一键切换。
- 资产导入：批量照片、EXIF 时间、重复检测、焦点裁切、WebP/AVIF 衍生和缩略图。
- 时间旅行：指定模拟日期、完成事件和口令状态，检查未来解锁。
- Theme Lab：只暴露允许覆盖的 token；对比度、触控尺寸和文本溢出实时告警。
- 发布前报告：坏链接、未使用资产、缺失 alt、过大文件、重复 ID、不可达内容和循环解锁依赖。

### 8.3 命令行最短路径

```bash
pnpm studio                    # 打开本地内容与皮肤编辑器
pnpm content:check             # 校验 schema、引用、解锁图和隐私标记
pnpm preview --edition ad-astra --date 2027-02-14
pnpm build --edition ad-astra  # 生成静态、哈希化、可离线的发布产物
pnpm publish                   # 推送构建产物；源码与私密原件不进入 Pages 仓库
```

### 8.4 旧内容迁移

1. 历史照片导入器已停用；当前 `memory` 只生成文字、坐标和色彩标记。
2. Studio 展示每张照片的时间、方向、清晰度和重复项，由作者补地点与故事，不让 AI 自动虚构。
3. `import-letter` 将毕业信拆成 `letter` 正文与相关记忆引用，原文保持可追溯。
4. Ad Astra 锁屏、Memories 与 Story 均由程序化星图呈现，不从历史照片生成素材。
5. 旧页面和私人素材已从当前分支与可达 Git 历史中移除；新系统不依赖旧页面运行时代码。

---

## 9. 存储、隐私、离线与 AI

### 9.1 数据分级

| 等级 | 示例 | 存储策略 |
|---|---|---|
| Public | 标准皮肤、示例图标、通用 App 代码 | 可进入公开仓库和 CDN |
| Personal | 普通合照、地点、纪念日 | 私有源；发布时按风险选择加密 |
| Private | 信件、聊天片段、隐藏照片、AI 知识库 | 加密内容包或受控服务，默认不进公开 Git 历史 |
| Secret | API Key、管理 Token、部署凭据 | 只在 CI Secret 或服务端，永不发到浏览器 |

现有 Valentine 页面把 GitHub Token 放在 localStorage（即使 Base64 编码也不是加密），这一模式不能沿用。新版只允许本地 Studio/CI 使用部署凭据，接收者端是只读客户端。

### 9.2 推荐发布模式

**首选：受控发布。** 源码和原始内容位于私有仓库，产物发布在带访问控制的静态/边缘平台；适合包含大量私人照片和信件。

**兼容当前 GitHub Pages：加密内容包。** Phone 发布产物只含应用壳和 AES-GCM 加密内容包；Standard 不请求内容包，首次输入专属口令后才在内存中解密。Service Worker 不缓存内容包或明文。它能显著降低随手浏览风险，但无法抵御拿到口令或长期控制客户端的攻击者。

当前分支与可达 Git 历史已经重写，原始私人素材不再由 Pages 或仓库分支提供。历史重写无法召回第三方此前已经复制的内容；离线备份只保存在本机受限目录中。

**仅直链隐藏：只适合低敏内容。** `noindex`、无站内入口和难猜路径不是访问控制。

### 9.3 本地数据

- localStorage：主题、音量、reduced motion 覆盖等少量非敏感设置。
- IndexedDB：App 进度、事件日志、索引、缩略图缓存和离线密文。
- 内存：解密后的私密正文与媒体 URL；锁屏、登出或超时后撤销 Object URL 并清理引用。
- 导入/导出：版本化加密备份，包含进度与设置，不默认包含可以重新下载的媒体。
- migration：每个存储版本都必须有向前迁移和失败回滚；错误时不白屏，提供导出诊断信息。

### 9.4 PWA 与网络

- App Shell、标准皮肤和首屏关键资源预缓存。
- 内容按 App/章节分包；第一次进入前可后台预取，但尊重省流量模式。
- 新版本采用 manifest 原子切换，避免一半旧 JS 配一半新内容。
- 离线时 Memories、Letters、Garden、已下载 Story 完整可用；Atlas 地图降级为静态地点列表。
- 更新不弹技术化提示；在安全状态通过 Settings 的版本项或 Halo 轻提示完成刷新。

### 9.5 Companion 的后端边界

若后续增加 Companion：

- 前端只拿短时会话令牌；模型 Key、系统提示和额度规则都在服务端。
- 知识库按明确同意的内容建立，可逐项排除聊天、照片说明或私人信件。
- 回复标注为“陪伴助手生成”，不冒充你本人正在实时说话。
- 支持删除会话、导出、单日额度、速率限制和安全兜底。
- 离线时提供你预先写好的真实留言，而不是生成内容。

---

## 10. 性能与质量门槛

### 10.1 性能预算

- App Shell 首次压缩传输目标不超过 350KB JS；Pixi、Story、地图与 Studio 全部不进入首包。
- 首屏关键资源目标不超过 2.5MB；壁纸按设备尺寸提供响应式衍生。
- 所有触控在 100ms 内出现视觉响应；常规系统动画以稳定 60fps 为目标。
- 动画优先使用 `transform` 与 `opacity`；大面积 `filter: blur()`、实时阴影和 Canvas 粒子受性能模式约束。
- 后台、锁屏、不可见页面停止 requestAnimationFrame、粒子、视差和非必要音频分析。
- 图片在构建期生成 AVIF/WebP/JPEG 回退、缩略图和焦点元数据；不把 12MP 原图直接作为桌面图标或时间轴卡片加载。

### 10.2 测试矩阵

| 层 | 必测内容 |
|---|---|
| Core 单测 | 状态转换、不变量、解锁组合、日期边界、存储 migration |
| Component | 键盘/触摸等价、焦点恢复、长文本、空状态、错误状态 |
| App 契约 | mount/suspend/resume/unmount、权限拒绝、离线行为 |
| E2E | 首开、解锁、启动/关闭 App、App Switcher、通知、PWA 更新 |
| Orientation | 竖→横→竖、动画中二次旋转、视频/VN/滚动位置保持 |
| Visual | 标准/专属、亮/暗、桌面/手机、常规/reduced 的截图回归 |
| Performance | 中档 Android、iPhone Safari、桌面低功耗模式的长任务和掉帧 |
| Privacy | 产物扫描密钥/明文、公开 URL 枚举、锁屏后的解密对象清理 |

### 10.3 设备视口

- 小屏手机：320×568、360×800。
- 主流手机：390×844、412×915。
- 手机横屏：844×390、915×412，左右安全区都测试。
- 平板：768×1024、1024×768。
- 桌面虚拟设备：1366×768、1440×900、1920×1080。
- 文字 200%、系统 reduced motion、暗色、高对比和屏幕阅读器都进入验收。

---

## 11. 质感增强清单

下面这些细节按系统能力组织，不应一次性堆在首屏：

1. 首次开机标记兼作真实资源加载进度，避免假等待。
2. 锁屏时间自动避开壁纸主体，构建期生成安全排版区域。
3. 壁纸在解锁时与桌面保持同一视觉锚点，不突然换裁切。
4. App 图标按压有边缘高光和阴影收紧，而不是只做透明度。
5. 图标到 App 使用共享元素开合，关闭能回到准确位置。
6. Dock 在页面切换时保持稳定，图标标签不挤压布局。
7. Halo 统一承接音乐、计时、新信和花园反馈，避免 toast 泛滥。
8. 通知按真实时间进入，打开后直接定位目标段落或记忆。
9. App Switcher 预览保留上次状态，锁屏时可选择隐藏私密内容。
10. 横竖屏转化保留图像焦点、滚动语义位置、音频与路由。
11. 系统音效根据动作大小分层，频繁操作保持安静。
12. 花园在离线日期变化时自然生长，不依赖服务端签到。
13. 漏看或漏签没有枯萎、扣分或催促，避免礼物变成压力。
14. 记忆时间轴的照片比例稳定，不因竖图横图导致布局跳动。
15. 照片详情保留原色与清晰度，不用重模糊和暗色蒙版遮住内容。
16. Story 的选择结果会在后续信件或花园里产生轻微呼应。
17. Music 的 Now Playing 可在 Halo、锁屏与 Music App 间连续形变。
18. 一封未来信解锁时，桌面图标的封蜡发生一次性变化。
19. Vault 线索来自已经看过的真实内容，不靠随机猜谜拖延。
20. About 页面记录“首次唤醒日期”和内容版本，建立物件历史。
21. 更新内容后保留旧进度，并在变更日志里用情绪化事件而非技术提交描述。
22. 搜索结果能跨 App 找到同一地点关联的照片、信和音乐。
23. 日期、地点和人物标签可以生成自动回顾，但原始文字不被 AI 擅自改写。
24. 真实手机全屏使用安全区；桌面虚拟设备才显示金属边框和环境影子。
25. 鼠标悬停图标显示简短 tooltip；触屏不依赖 hover。
26. 加载失败保留已缓存内容，并在原位给出重试，不切到技术错误页。
27. 所有长动画可点击完成，重复启动不会强迫再次观看。
28. reduced motion 仍有完整的层级反馈，只去掉空间位移和持续运动。
29. 专属皮肤的 icon、声音和文案可以单独回退到标准版，方便排错。
30. 每个 App 都有一个可被记住的核心交互，不把所有炫技平均撒在每个页面。

---

## 12. 分阶段路线图（以能力门验收，不绑定日历）

### M0：可验证原型

目标：证明“设备感、图标开合、横屏转化、皮肤切换”四件最难的事成立。

- 完成 Core 状态图和 App SDK 最小接口。
- 一个锁屏、一个桌面、两个占位 App、Halo 和桌面设备壳。
- 标准/专属 token 实时切换。
- 竖屏 App 请求横屏并完整返回；覆盖真实设备与桌面模拟器。
- Playwright 截图和动画过程中间帧检查。

**退出标准**：在手机和桌面上连续完成 30 次解锁、开关 App、旋转和换肤，无白屏、跳位、丢状态或明显掉帧。

### M1：可信的 LumiOS

- Boot、Lock、Home、Halo、Quick Panel、Notification、Switcher、Search、Settings 全链路。
- PWA 安装、离线 App Shell、版本更新、IndexedDB 基础和导出。
- 完整键盘/触摸/返回语义、reduced motion 和错误边界。

**退出标准**：即使 App 还是示例内容，也会被体验为一个逻辑完整的独立系统。

### M2：礼物核心内容

- Memories：导入现有照片、时间轴、详情、关联与搜索。
- Letters：毕业信迁移、未来信、定时解锁。
- Garden：日期成长、里程碑、专注模式联动。
- Story Lite：四章内容模型、基础选择与音频；定义 Yanagi 适配边界。

**退出标准**：专属版从首次启动到最终首批彩蛋形成 20–40 分钟完整体验，并有至少一个长期回访点。

### M3：Edition 与创作工具

- Edition schema、Standard 和 Ad Astra 完整资产。
- Local Studio 的内容表单、设备预览、模拟日期、Theme Lab。
- `content:check`、资产管线、隐私扫描和一键发布。

**退出标准**：新增一封信、一组记忆或一个新皮肤只改内容/Edition 文件，不修改系统组件。

### M4：深度打磨与长期内容

- Music、Atlas、Vault。
- 共享元素跨 App 跳转、系统级搜索和统一媒体状态。
- Yanagi Story Adapter 或保持 Story Lite 的明确决策。
- 视觉回归、低性能模式、完整设备矩阵和私密部署。

**退出标准**：满足性能、隐私、无障碍和横竖屏质量门槛，可正式赠送并长期维护。

### M5：可选在线能力

- Companion 边缘服务、短时鉴权、RAG 内容选择、用量和安全策略。
- 服务端签名的时间解锁、可选同步和远程投递新信。

**退出标准**：断网时核心礼物不降级为不可用；在线服务停运不会损坏已有内容和进度。

---

## 13. 决策日志

| ID | 决策 | 原因 |
|---|---|---|
| D-001 | 系统壳与内容/皮肤彻底分离 | 支持标准版与专属版共享同一运行时 |
| D-002 | 源码建议独立仓库，Pages 仓库只接收产物 | 避免污染个人主页，允许私有内容与现代工具链 |
| D-003 | 移动端全屏，桌面端显示设备壳 | 避免“手机里套手机”，同时保留桌面展示感 |
| D-004 | React + TypeScript + 状态机 | 多 App、并发 overlay 和方向状态需要明确边界 |
| D-005 | 系统 UI 使用 DOM；Pixi 按 App 懒加载 | 可访问、清晰排版、低首包，同时保留表现力 |
| D-006 | View Transitions 只做渐进增强 | 浏览器能力不一致，不能让转场失败破坏导航 |
| D-007 | 首发四个 App 做深，不模拟完整手机 | 控制范围，把投入集中在情感价值最高处 |
| D-008 | Companion 推迟到静态核心完成后 | AI 需要后端、隐私、额度和身份边界 |
| D-009 | 专属版采用 Ad Astra 母题而非粉色爱心 | 延续已有共同叙事，更成熟且更可长期使用 |
| D-010 | 不再让浏览器持有 GitHub 管理 Token | 现有 Valentine 模式风险过高，不可复制 |
| D-011 | Standard 默认启动；Ad Astra 以口令解密文字内容包 | 未授权会话不请求私人内容，锁定或退出时卸载解密后的会话数据 |

---

## 14. 进入实现前需要冻结的内容决策

这些问题不影响 M0 原型，但必须在 M2 前确定：

1. 正式名称、她的称呼、关系起始日期、首发/赠送日期。
2. 她对颜色、动效、公开照片、亲密文案和 AI Companion 的明确偏好与边界。
3. 第一批 30–60 条 Memory、4–8 封 Letter、4 个 Story 章节的真实材料清单。
4. 隐私等级：仅直链、客户端加密，还是带真实访问控制的部署。
5. 首发是否需要远程新增内容；若不需要，保持纯静态最稳妥。
6. Yanagi 是首发集成目标还是后续替换 Story Lite；建议后者。
7. 最终赠送方式：二维码、实体盒/卡片、PWA 安装，或桌面收藏版。

---

## 15. 参考与平台约束

- Apple HIG 建议界面适应方向、屏幕和安全区变化，并在方向切换后保持熟悉与一致：<https://developer.apple.com/design/human-interface-guidelines/layout>
- Apple HIG 强调动效应有目的、短而准确、允许取消，并为 reduced motion 提供替代：<https://developer.apple.com/design/human-interface-guidelines/motion>
- W3C Screen Orientation 规范指出方向锁定可能要求全屏或已安装 Web App，因此它只能是可失败的增强能力：<https://www.w3.org/TR/screen-orientation/>
- Same-document View Transitions 可以捕获旧/新 DOM 状态并做共享元素转场，但应提供无 API 时的直接更新回退：<https://developer.chrome.com/docs/web-platform/view-transitions/same-document>
- GitHub Pages 发布站点有 1GB 体积和每月 100GB 软带宽限制，内容必须按需分包和压缩：<https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
