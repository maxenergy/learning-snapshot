# 项目开发任务清单 (TODO.md)

**目标:** 完成产品需求文档(PRD)中定义的MVP(P0)核心功能，使产品达到基本可用状态。

---

## 🚀 P0 - MVP核心功能

### 1. 【核心】完善快照功能 (Blocking)

-   [ ] **创建 `SnapshotService.ts` 文件**
    -   **路径**: `src/services/snapshot/SnapshotService.ts`
    -   **职责**:
        -   实现 `createSnapshot(doc, url)` 方法，用于协调 `ContentExtractor` 和 `SnapshotRepository`。
        -   实现 `getSnapshot(id)`、`getAllSnapshots()`、`deleteSnapshot(id)` 等基础管理方法。
        -   将该服务集成到 `background` 脚本的消息路由中，以响应来自UI的请求。

-   [ ] **完善资源本地化和元数据**
    -   **文件**: `src/services/snapshot/ContentExtractor.ts`
    -   **任务**:
        -   改进 `localizeImages` 方法，增强其健壮性。
        -   实现 `getMetaContent` 来提取更完整的元数据（如发布日期 `article:published_time`）。
        -   (可选) 实现基本的HTML到Markdown的转换，填充 `content.markdown` 字段。

-   [ ] **实现快照基础UI交互**
    -   **文件**: `src/popup/App.tsx`, `src/background/index.ts`
    -   **任务**:
        -   在Popup界面添加一个“创建快照”按钮。
        -   点击按钮时，通过 `chrome.runtime.sendMessage` 向后台发送 `CAPTURE_SNAPSHOT` 消息。
        -   后台服务（`SnapshotService`）处理消息，完成快照创建。
        -   在Popup界面展示已创建快照的列表（标题和URL）。

### 2. 【核心】实现云翻译服务 (Blocking)

-   [ ] **创建至少一个云翻译提供商**
    -   **路径**: `src/services/translation/`
    -   **任务**:
        -   创建 `OpenAIProvider.ts` (或 `DeepLProvider.ts`)，实现 `TranslationProvider` 接口。
        -   该提供商应能通过API Key调用相应的翻译API。
        -   在 `TranslationService.ts` 中注册新的提供商。

-   [ ] **实现批量翻译逻辑**
    -   **文件**: `src/services/translation/TranslationService.ts`
    -   **任务**:
        -   实现架构文档中描述的 `batchTranslate` 方法。
        -   该方法应接受段落数组，并使用任务队列（可简化实现）进行并发翻译，以提高效率。

-   [ ] **实现翻译配置UI**
    -   **文件**: `src/options/App.tsx`
    -   **任务**:
        -   在选项页面创建一个表单，允许用户输入并保存他们的翻译API密钥（例如 OpenAI API Key）。
        -   使用 `chrome.storage.sync` 或 `local` 来安全地存储API密钥。

### 3. 【核心】数据库与类型定义

-   [ ] **完善数据库索引和模型**
    -   **文件**: `src/storage/database.ts`, `src/types/`
    -   **任务**:
        -   检查 `db.version().stores()` 中的索引是否最优，特别是为搜索和过滤。
        -   确保所有相关的TypeScript类型 (`Snapshot`, `TranslationResult`等) 定义完整且与实现一致。

---

## ⏳ P1 - 重要功能 (MVP完成后)

-   [ ] **实现划词翻译UI**
    -   **文件**: `src/content/`
    -   **任务**:
        -   在内容脚本中监听文本选择事件。
        -   选择文本后，显示一个包含译文的小浮窗。

-   [ ] **实现Obsidian导出功能**
    -   [ ] 创建 `ExportService.ts` 和 `MarkdownExporter.ts`。
    -   [ ] 实现符合Obsidian规范的Markdown格式化。
    -   [ ] 提供从UI导出单个或多个快照的功能。

-   [ ] **实现AI术语解释**
    -   [ ] 创建 `AIService.ts` 和 `OpenAIProvider.ts` (for AI)。
    -   [ ] 实现点击页面上的术语时，调用AI进行解释的功能。

-   [ ] **实现自动归档**
    -   [ ] 创建 `ArchiveService.ts`。
    -   [ ] 实现基于规则（如域名）的简单自动分类。

---

## 🛠️ P2 - 增强功能 (未来规划)

-   [ ] 知识图谱关联
-   [ ] 高级批注管理
-   [ ] 高级检索（语义搜索）
-   [ ] 数据统计面板
-   [ ] 云同步