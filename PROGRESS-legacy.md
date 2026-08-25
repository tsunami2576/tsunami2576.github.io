# 项目进度追踪板

## 宏观目标
构建一套可长期维护的虚拟手机礼物系统：同一 LumiOS 内核支持标准版与专属 Ad Astra Edition，通过 App SDK、皮肤包和内容包实现高质感、强定制、易扩展与易维护。

## 阶段一：需求与系统设计 (状态：已完成)
- [x] 任务 1：阅读“情侣礼物建议”对话，提炼虚拟手机、记忆、故事、音乐、花园、隐藏彩蛋与 Companion 的产品方向。
- [x] 任务 2：扫描当前仓库，确认根站点、`valentine/`、`per-aspera-ad-astra-2026/` 与 `vn-engine/WHITEPAPER.md` 的边界和可复用资产。
- [x] 任务 3：在 `PHONE_OS_DESIGN.md` 中冻结 LumiOS、App 平台、Edition 皮肤、Content Pack 四层架构。
- [x] 任务 4：在 `PHONE_OS_DESIGN.md` 中完成标准版与 Ad Astra Edition 的体验、视觉、动效、隐私、性能和路线图设计。

## 阶段二：M0 工程骨架与交互原型 (状态：未开始)
- [ ] 任务 5：创建独立 `lumi-phone` 源码仓库或经确认后创建 `phone-src/` pnpm workspace，配置 TypeScript strict、Vite、React、ESLint、Prettier、Vitest 与 Playwright。
- [ ] 任务 6：创建 `packages/core/src/machines/phone.machine.ts`，实现 session、workspace、overlay、orientation、audioFocus、privacy 与 network 并发状态。
- [ ] 任务 7：在 `packages/core/src/machines/phone.machine.test.ts` 覆盖非法并发 overlay、启动期间二次启动、锁屏恢复和方向切换不变量。
- [ ] 任务 8：创建 `packages/app-sdk/src/types.ts` 与 `registry.ts`，定义 App Descriptor、生命周期、能力申请、命名空间存储和懒加载注册。
- [ ] 任务 9：创建 `packages/theme/src/schema.ts`、`resolve-theme.ts` 与 token 类型，完成 primitive → semantic → component → edition → context 合并。
- [ ] 任务 10：创建 `packages/motion/src/transition-coordinator.ts`，实现全屏转场串行、取消、手势接管与 reduced motion 回退。
- [ ] 任务 11：在 `apps/playground/` 建立锁屏、桌面、两个占位 App、Halo 和桌面设备壳的可切换原型。
- [ ] 任务 12：实现桌面设备壳 portrait ↔ landscape 转化，并验证真实手机方向变化下路由、滚动与焦点保持。
- [ ] 任务 13：创建 `editions/standard/` 与 `editions/ad-astra/` 最小 token、图标和壁纸占位包，实现运行时热切换。
- [ ] 任务 14：添加 M0 Playwright 用例与截图基线，覆盖手机/桌面、横/竖、标准/专属和 reduced motion。

## 阶段三：M1 LumiOS 系统壳 (状态：未开始)
- [ ] 任务 15：在 `packages/shell/src/boot/` 实现首次启动、真实加载进度、跳过和后续快速恢复。
- [ ] 任务 16：在 `packages/shell/src/lock-screen/` 实现真实时间、纪念日计算、通知预览、上滑解锁和键盘替代。
- [ ] 任务 17：在 `packages/shell/src/home/` 实现稳定 App 网格、Dock、分页、编辑模式和图标共享元素启动。
- [ ] 任务 18：在 `packages/shell/src/halo/` 实现通知、音乐、计时和解锁反馈的互斥队列与形变。
- [ ] 任务 19：在 `packages/shell/src/overlays/` 实现 Quick Panel、Notification Shade、Search、App Switcher 和 modal 焦点恢复。
- [ ] 任务 20：在 `packages/apps/settings/` 实现主题、系统音效、动效、隐私预览、存储、导出与 About。
- [ ] 任务 21：在 `packages/storage/` 实现 IndexedDB adapter、localStorage preferences、版本 migration、导入导出与失败回滚。
- [ ] 任务 22：在 `apps/phone/` 配置 manifest、Service Worker、离线 App Shell、版本原子更新和 GitHub Pages 子路径。
- [ ] 任务 23：补齐 Shell 的错误边界、离线态、低性能模式、键盘操作、200% 文字缩放和屏幕阅读器语义。

## 阶段四：M2 礼物核心 App (状态：未开始)
- [ ] 任务 24：在 `packages/content/` 定义 memory、letter、storyChapter、track、gardenMilestone、place 与 secret 的 Zod schema 和 JSON Schema。
- [ ] 任务 25：在 `packages/content/` 实现稳定 ID、交叉引用、解锁依赖图、不可达内容、循环规则与隐私分级校验。
- [ ] 任务 26：创建 `tools/import-valentine/`，把 `valentine/assets/photos/photos.json` 与原图转成 Memory 草稿和响应式衍生。
- [ ] 任务 27：创建 `tools/import-letter/`，把 `per-aspera-ad-astra-2026/` 的毕业信和精选照片转成 Letter 与关联 Memory 草稿。
- [ ] 任务 28：在 `packages/apps/memories/` 实现时间轴、稳定比例照片、详情共享元素、标签、地点、关联与搜索索引。
- [ ] 任务 29：在 `packages/apps/letters/` 实现收件箱、未来解锁、附件、收藏、通知深链和毕业信呈现。
- [ ] 任务 30：在 `packages/apps/garden/` 实现日期驱动成长、里程碑、留言、无惩罚缺席和专注模式联动。
- [ ] 任务 31：在 `packages/apps/story/` 实现 Story Lite 章节、对话、选择、变量、基础音频与持久进度。
- [ ] 任务 32：在 `packages/apps/story/src/adapters/` 定义 Yanagi Adapter 接口与 fixture，不让未完成引擎阻塞首发。
- [ ] 任务 33：整理 `content-packs/girlfriend-private/` 的首批真实材料，逐条人工确认日期、地点、文案与隐私级别。

## 阶段五：M3 Edition 与 Creator Studio (状态：未开始)
- [ ] 任务 34：完成 `editions/standard/` 的明/暗配色、完整图标、壁纸、系统声音、动效 token 与 Demo Content Pack。
- [ ] 任务 35：完成 `editions/ad-astra/` 的多色视觉、真实照片壁纸、主体蒙版、珐琅图标、系统文案与 Focus 模式。
- [ ] 任务 36：在 `apps/studio/src/content-tree/` 实现内容树和基于 schema 的 Memory、Letter、Story、Garden 编辑表单。
- [ ] 任务 37：在 `apps/studio/src/device-preview/` 实现 Edition、明暗、横竖、日期、解锁事件和设备尺寸实时预览。
- [ ] 任务 38：在 `apps/studio/src/theme-lab/` 实现安全 token 编辑、对比度、触控尺寸、文本溢出与 reduced motion 检查。
- [ ] 任务 39：在 `tools/asset-pipeline/` 实现 EXIF、重复检测、焦点裁切、AVIF/WebP/JPEG、缩略图、内容哈希与体积报告。
- [ ] 任务 40：实现 `pnpm content:check`、`preview --date`、`build --edition` 与 `publish` 的端到端工作流。

## 阶段六：M4 扩展 App 与质量收束 (状态：未开始)
- [ ] 任务 41：在 `packages/audio/` 和 `packages/apps/music/` 实现音频焦点、播放列表、Now Playing、锁屏/Halo 连续状态和离线曲目。
- [ ] 任务 42：在 `packages/apps/atlas/` 实现足迹、愿望地、关联内容和离线地点列表。
- [ ] 任务 43：在 `packages/core/src/unlocks/` 与 `packages/apps/vault/` 实现组合规则、口令冷却、线索与 append-only 事件日志。
- [ ] 任务 44：完成跨 App 搜索与 Memories、Letters、Music、Atlas 之间的共享内容深链。
- [ ] 任务 45：为 320×568 至 1920×1080、亮/暗、横/竖、标准/专属、常规/reduced 建立视觉回归矩阵。
- [ ] 任务 46：在中档 Android、iPhone Safari 和桌面低功耗模式验证首包、交互延迟、60fps、内存、音频和后台暂停。
- [ ] 任务 47：完成密钥/明文扫描、锁屏清理、加密备份、更新回滚、无障碍和离线验收。

## 阶段七：发布与可选在线能力 (状态：未开始)
- [ ] 任务 48：根据最终隐私等级选择受控托管或 GitHub Pages 加密内容包，并记录威胁模型与恢复方案。
- [ ] 任务 49：配置 CI 构建、测试、资产预算、内容校验、产物哈希和向 `/phone/` 或私密作品路径的发布。
- [ ] 任务 50：准备二维码/实体承载、PWA 安装图标、首次赠送流程和发布后回滚包。
- [ ] 任务 51：首发稳定后再评审 Companion；若通过，在独立服务中实现短时鉴权、用量限制、知识授权、删除导出和离线真实留言回退。
