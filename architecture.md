# 学习快照浏览器插件 - 架构设计文档

**版本**: v1.0  
**日期**: 2025-10-04  
**架构师**: Development Team  
**状态**: Draft

---

## 1. 架构概述

### 1.1 系统定位
基于Chrome/Edge的Manifest V3浏览器扩展，采用前端单体架构，本地数据存储，通过第三方API实现翻译和AI功能。

### 1.2 架构原则
- **模块化**: 功能模块高内聚、低耦合
- **可扩展**: 支持插件式扩展新功能
- **高性能**: 异步处理、惰性加载、缓存优先
- **安全性**: API密钥加密、内容安全策略
- **离线优先**: 核心功能支持离线使用

### 1.3 技术栈总览

```
前端框架:      React 18 + TypeScript
状态管理:      Zustand / Jotai
UI组件:        Tailwind CSS + shadcn/ui
构建工具:      Vite + CRXJS
数据存储:      IndexedDB (Dexie.js)
内容提取:      Readability.js
翻译服务:      DeepL/Google/OpenAI/Claude/Ollama
AI服务:        OpenAI/Claude/Gemini/Ollama
文件处理:      File System Access API
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Extension                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Popup UI   │  │  Options UI  │  │  Sidebar UI  │  │
│  │   (React)    │  │   (React)    │  │   (React)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └─────────────────┼──────────────────┘           │
│                           │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │           Background Service Worker               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │  │
│  │  │ Message  │ │   Task   │ │   API Manager     │ │  │
│  │  │  Router  │ │  Queue   │ │ (Translation/AI)  │ │  │
│  │  └──────────┘ └──────────┘ └───────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │            Content Scripts                        │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │   Snapshot   │  │  Translation Overlay    │  │  │
│  │  │   Extractor  │  │   (Bilingual Display)   │  │  │
│  │  └──────────────┘  └──────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │      Annotation & Highlight Manager         │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │              Data Layer                           │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │  IndexedDB   │  │   Chrome Storage API     │  │  │
│  │  │  (Dexie.js)  │  │   (Settings & Configs)   │  │  │
│  │  └──────────────┘  └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
     │ Translation │ │ AI APIs  │ │   Ollama   │
     │   APIs      │ │  (GPT/   │ │  (Local)   │
     │ (DeepL/GT)  │ │  Claude) │ │            │
     └─────────────┘ └──────────┘ └────────────┘
```

### 2.2 关键组件说明

#### Background Service Worker
- **职责**: 
  - 管理扩展生命周期
  - 处理跨组件消息通信
  - 执行后台任务（翻译、AI调用）
  - API请求队列管理和限流

#### Content Scripts
- **职责**:
  - 注入到网页进行DOM操作
  - 内容捕获与提取
  - 翻译UI渲染
  - 批注交互处理

#### Data Layer
- **职责**:
  - 数据持久化
  - 数据查询与索引
  - 缓存管理

---

## 3. 技术架构详解

### 3.1 Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "Learning Snapshot",
  "version": "1.0.0",
  "description": "智能学习快照与笔记管理工具",
  
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus",
    "scripting"
  ],
  
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  "commands": {
    "create-snapshot": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "创建学习快照"
    }
  }
}
```

### 3.2 项目目录结构

```
learning-snapshot/
├── src/
│   ├── background/              # Background Service Worker
│   │   ├── index.ts            # 入口文件
│   │   ├── messageRouter.ts    # 消息路由
│   │   ├── taskQueue.ts        # 任务队列
│   │   └── apiManager.ts       # API管理器
│   │
│   ├── content/                 # Content Scripts
│   │   ├── index.ts            # 入口文件
│   │   ├── extractor.ts        # 内容提取器
│   │   ├── translator.ts       # 翻译UI
│   │   ├── annotator.ts        # 批注管理器
│   │   └── components/         # UI组件
│   │       ├── TranslationOverlay.tsx
│   │       ├── HighlightTool.tsx
│   │       └── TermPopup.tsx
│   │
│   ├── popup/                   # Popup UI
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── SnapshotList.tsx
│   │       └── QuickActions.tsx
│   │
│   ├── options/                 # Options UI
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── APISettings.tsx
│   │       ├── CategoryManager.tsx
│   │       └── ExportSettings.tsx
│   │
│   ├── sidepanel/              # Sidebar UI
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── NoteEditor.tsx
│   │       └── SnapshotViewer.tsx
│   │
│   ├── services/               # 业务逻辑层
│   │   ├── snapshot/
│   │   │   ├── SnapshotService.ts
│   │   │   └── ContentExtractor.ts
│   │   ├── translation/
│   │   │   ├── TranslationService.ts
│   │   │   ├── DeepLProvider.ts
│   │   │   ├── OpenAIProvider.ts
│   │   │   └── OllamaProvider.ts
│   │   ├── ai/
│   │   │   ├── AIService.ts
│   │   │   ├── TermExplainer.ts
│   │   │   └── NoteSummarizer.ts
│   │   ├── archive/
│   │   │   ├── ArchiveService.ts
│   │   │   ├── CategoryManager.ts
│   │   │   └── AutoClassifier.ts
│   │   └── export/
│   │       ├── ExportService.ts
│   │       ├── MarkdownExporter.ts
│   │       └── ObsidianFormatter.ts
│   │
│   ├── storage/                # 数据存储层
│   │   ├── database.ts         # IndexedDB配置
│   │   ├── models/
│   │   │   ├── Snapshot.ts
│   │   │   ├── Annotation.ts
│   │   │   └── Category.ts
│   │   └── repositories/
│   │       ├── SnapshotRepository.ts
│   │       └── CategoryRepository.ts
│   │
│   ├── utils/                  # 工具函数
│   │   ├── crypto.ts          # 加密解密
│   │   ├── dom.ts             # DOM操作
│   │   ├── markdown.ts        # Markdown处理
│   │   └── validator.ts       # 数据验证
│   │
│   ├── types/                  # TypeScript类型定义
│   │   ├── snapshot.ts
│   │   ├── translation.ts
│   │   ├── ai.ts
│   │   └── messages.ts
│   │
│   └── constants/              # 常量定义
│       ├── config.ts
│       └── events.ts
│
├── public/                     # 静态资源
│   ├── icons/
│   ├── _locales/              # 国际化
│   └── manifest.json
│
├── tests/                      # 测试文件
│   ├── unit/
│   └── integration/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. 核心模块设计

### 4.1 快照捕获模块

#### 4.1.1 内容提取流程

```typescript
// ContentExtractor.ts
class ContentExtractor {
  // 1. 提取主体内容
  async extractMainContent(doc: Document): Promise<ExtractedContent> {
    const reader = new Readability(doc);
    const article = reader.parse();
    
    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      dir: article.dir,
      siteName: article.siteName,
      lang: article.lang
    };
  }
  
  // 2. 资源本地化
  async localizeResources(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 处理图片
    const images = doc.querySelectorAll('img');
    for (const img of images) {
      const dataUrl = await this.imageToDataURL(img.src);
      img.src = dataUrl;
    }
    
    // 内联CSS
    const styles = await this.extractInlineStyles(doc);
    
    return doc.documentElement.outerHTML;
  }
  
  // 3. 元数据采集
  extractMetadata(doc: Document): SnapshotMetadata {
    return {
      title: doc.title,
      url: window.location.href,
      favicon: this.getFavicon(doc),
      author: this.getMetaContent(doc, 'author'),
      publishDate: this.getMetaContent(doc, 'article:published_time'),
      description: this.getMetaContent(doc, 'description'),
      capturedAt: new Date().toISOString()
    };
  }
}
```

#### 4.1.2 快照数据结构

```typescript
// types/snapshot.ts
interface Snapshot {
  id: string;                    // UUID
  title: string;
  url: string;
  content: {
    html: string;                // 本地化的HTML
    text: string;                // 纯文本
    markdown?: string;           // Markdown版本（可选）
  };
  metadata: {
    author?: string;
    publishDate?: string;
    favicon?: string;
    description?: string;
    capturedAt: string;
    wordCount: number;
    language: string;
  };
  annotations: Annotation[];     // 批注列表
  translations?: Translation[];  // 翻译缓存
  categories: string[];          // 分类标签
  rating?: number;               // 评分(1-5)
  createdAt: string;
  updatedAt: string;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'note' | 'bookmark';
  range: {                       // 文本范围
    start: number;
    end: number;
    xpath?: string;              // DOM路径
  };
  content: string;               // 批注内容
  color?: string;                // 高亮颜色
  createdAt: string;
}
```

---

### 4.2 翻译模块

#### 4.2.1 翻译服务架构

```typescript
// services/translation/TranslationService.ts
interface TranslationProvider {
  translate(text: string, from: string, to: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
  getSupportedLanguages(): Promise<Language[]>;
}

class TranslationService {
  private providers: Map<string, TranslationProvider>;
  private cache: TranslationCache;
  
  constructor() {
    this.providers = new Map([
      ['deepl', new DeepLProvider()],
      ['google', new GoogleTranslateProvider()],
      ['openai', new OpenAIProvider()],
      ['claude', new ClaudeProvider()],
      ['ollama', new OllamaProvider()]
    ]);
  }
  
  async translate(params: TranslateParams): Promise<Translation> {
    const { text, provider, from, to } = params;
    
    // 1. 检查缓存
    const cached = await this.cache.get(text, from, to);
    if (cached) return cached;
    
    // 2. 调用翻译服务
    const selectedProvider = this.providers.get(provider);
    const result = await selectedProvider.translate(text, from, to);
    
    // 3. 存入缓存
    await this.cache.set(text, from, to, result);
    
    return {
      original: text,
      translated: result,
      from,
      to,
      provider,
      timestamp: Date.now()
    };
  }
  
  // 批量翻译（段落级）
  async batchTranslate(
    paragraphs: string[], 
    options: TranslateOptions
  ): Promise<Translation[]> {
    const queue = new TaskQueue(5); // 并发限制
    
    return Promise.all(
      paragraphs.map(p => 
        queue.add(() => this.translate({ text: p, ...options }))
      )
    );
  }
}
```

#### 4.2.2 双语对照UI组件

```typescript
// content/components/TranslationOverlay.tsx
interface BillingualDisplayProps {
  original: string[];
  translations: Translation[];
  mode: 'paragraph' | 'sentence' | 'hover';
}

const BilingualDisplay: React.FC<BillingualDisplayProps> = ({
  original,
  translations,
  mode
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  if (mode === 'paragraph') {
    return (
      <div className="bilingual-container">
        {original.map((para, idx) => (
          <div key={idx} className="paragraph-pair">
            <p className="original" lang={translations[idx].from}>
              {para}
            </p>
            <p className="translation" lang={translations[idx].to}>
              {translations[idx].translated}
            </p>
          </div>
        ))}
      </div>
    );
  }
  
  if (mode === 'hover') {
    return (
      <div className="hover-translation">
        {original.map((para, idx) => (
          <p
            key={idx}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {para}
            {activeIndex === idx && (
              <div className="translation-tooltip">
                {translations[idx].translated}
              </div>
            )}
          </p>
        ))}
      </div>
    );
  }
  
  // sentence mode...
};
```

#### 4.2.3 Ollama本地翻译

```typescript
// services/translation/OllamaProvider.ts
class OllamaProvider implements TranslationProvider {
  private baseURL: string;
  
  async translate(text: string, from: string, to: string): Promise<string> {
    const prompt = `Translate the following ${from} text to ${to}. 
    Only output the translation, no explanations:
    
    ${text}`;
    
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',  // 或其他模型
        prompt,
        stream: false,
        options: {
          temperature: 0.3  // 降低随机性，提高翻译准确度
        }
      })
    });
    
    const data = await response.json();
    return data.response.trim();
  }
  
  // 健康检查
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

### 4.3 AI知识增强模块

#### 4.3.1 术语解释服务

```typescript
// services/ai/TermExplainer.ts
class TermExplainer {
  private aiService: AIService;
  private cache: Map<string, Explanation>;
  
  async explain(term: string, context?: string): Promise<Explanation> {
    // 检查缓存
    if (this.cache.has(term)) {
      return this.cache.get(term)!;
    }
    
    const prompt = `Explain the term "${term}" in a clear and concise way.
    ${context ? `Context: ${context}` : ''}
    
    Provide:
    1. Definition (2-3 sentences)
    2. Key concepts
    3. Example usage
    4. Related terms (if applicable)
    
    Format as JSON:
    {
      "term": "...",
      "definition": "...",
      "concepts": ["...", "..."],
      "example": "...",
      "related": ["...", "..."]
    }`;
    
    const response = await this.aiService.complete({
      prompt,
      temperature: 0.5,
      maxTokens: 500
    });
    
    const explanation = JSON.parse(response);
    this.cache.set(term, explanation);
    
    return explanation;
  }
  
  // 批量提取专业术语
  async extractTerms(text: string): Promise<string[]> {
    const prompt = `Extract technical terms and important concepts from:
    
    ${text}
    
    Return as JSON array: ["term1", "term2", ...]`;
    
    const response = await this.aiService.complete({ prompt });
    return JSON.parse(response);
  }
}
```

#### 4.3.2 自动笔记生成

```typescript
// services/ai/NoteSummarizer.ts
class NoteSummarizer {
  async generateSummary(
    content: string, 
    template: NoteTemplate
  ): Promise<GeneratedNote> {
    const prompts = {
      academic: `Summarize this academic content:
        - Main argument/thesis
        - Key findings
        - Methodology (if applicable)
        - Implications`,
      
      technical: `Summarize this technical content:
        - Problem being solved
        - Solution approach
        - Key technologies
        - Implementation notes`,
      
      general: `Summarize this content:
        - Main points (3-5 bullet points)
        - Key takeaways
        - Action items (if any)`
    };
    
    const prompt = prompts[template] + `\n\n${content}`;
    
    const response = await this.aiService.complete({
      prompt,
      temperature: 0.7,
      maxTokens: 1000
    });
    
    return {
      summary: response,
      template,
      generatedAt: new Date().toISOString()
    };
  }
  
  // 生成Q&A对
  async generateQA(content: string): Promise<QAPair[]> {
    const prompt = `Based on this content, generate 5 important Q&A pairs:
    
    ${content}
    
    Format: {"questions": [{"q": "...", "a": "..."}]}`;
    
    const response = await this.aiService.complete({ prompt });
    const data = JSON.parse(response);
    return data.questions;
  }
}
```

---

### 4.4 数据存储模块

#### 4.4.1 IndexedDB配置

```typescript
// storage/database.ts
import Dexie, { Table } from 'dexie';

class SnapshotDatabase extends Dexie {
  snapshots!: Table<Snapshot, string>;
  categories!: Table<Category, string>;
  annotations!: Table<Annotation, string>;
  translations!: Table<TranslationCache, string>;
  
  constructor() {
    super('LearningSnapshotDB');
    
    this.version(1).stores({
      snapshots: 'id, title, url, *categories, createdAt, rating',
      categories: 'id, name, parentId',
      annotations: 'id, snapshotId, type, createdAt',
      translations: '[text+from+to], timestamp'
    });
    
    // 索引优化
    this.version(2).stores({
      snapshots: 'id, title, url, *categories, createdAt, rating, *tags'
    });
  }
}

export const db = new SnapshotDatabase();
```

#### 4.4.2 仓储模式

```typescript
// storage/repositories/SnapshotRepository.ts
class SnapshotRepository {
  async create(snapshot: Omit<Snapshot, 'id'>): Promise<Snapshot> {
    const id = crypto.randomUUID();
    const newSnapshot = {
      ...snapshot,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.snapshots.add(newSnapshot);
    return newSnapshot;
  }
  
  async findById(id: string): Promise<Snapshot | undefined> {
    return db.snapshots.get(id);
  }
  
  async findByCategory(category: string): Promise<Snapshot[]> {
    return db.snapshots
      .where('categories')
      .equals(category)
      .reverse()
      .sortBy('createdAt');
  }
  
  async search(query: string): Promise<Snapshot[]> {
    const lowerQuery = query.toLowerCase();
    
    return db.snapshots
      .filter(s => 
        s.title.toLowerCase().includes(lowerQuery) ||
        s.content.text.toLowerCase().includes(lowerQuery) ||
        s.metadata.description?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }
  
  async update(id: string, updates: Partial<Snapshot>): Promise<void> {
    await db.snapshots.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
  
  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.snapshots, db.annotations], async () => {
      await db.annotations.where('snapshotId').equals(id).delete();
      await db.snapshots.delete(id);
    });
  }
}
```

---

### 4.5 消息通信架构

#### 4.5.1 消息类型定义

```typescript
// types/messages.ts
type MessageType =
  | 'CAPTURE_SNAPSHOT'
  | 'TRANSLATE_TEXT'
  | 'EXPLAIN_TERM'
  | 'GENERATE_NOTE'
  | 'EXPORT_TO_OBSIDIAN'
  | 'GET_SNAPSHOTS'
  | 'UPDATE_SETTINGS';

interface Message<T = any> {
  type: MessageType;
  payload: T;
  requestId?: string;
}

interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}
```

#### 4.5.2 消息路由

```typescript
// background/messageRouter.ts
class MessageRouter {
  private handlers: Map<MessageType, MessageHandler>;
  
  constructor() {
    this.handlers = new Map();
    this.registerHandlers();
  }
  
  registerHandlers() {
    this.handlers.set('CAPTURE_SNAPSHOT', async (payload) => {
      const extractor = new ContentExtractor();
      const snapshot = await extractor.extract(payload);
      return snapshotRepository.create(snapshot);
    });
    
    this.handlers.set('TRANSLATE_TEXT', async (payload) => {
      return translationService.translate(payload);
    });
    
    this.handlers.set('EXPLAIN_TERM', async (payload) => {
      return termExplainer.explain(payload.term, payload.context);
    });
    
    // ... 其他handlers
  }
  
  async route(message: Message): Promise<MessageResponse> {
    try {
      const handler = this.handlers.get(message.type);
      if (!handler) {
        throw new Error(`No handler for ${message.type}`);
      }
      
      const result = await handler(message.payload);
      
      return {
        success: true,
        data: result,
        requestId: message.requestId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        requestId: message.requestId
      };
    }
  }
}

// Background入口
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageRouter.route(message).then(sendResponse);
  return true; // 异步响应
});
```

---

## 5. 导出与集成

### 5.1 Obsidian导出

#### 5.1.1 Markdown格式化器

```typescript
// services/export/ObsidianFormatter.ts
class ObsidianFormatter {
  formatSnapshot(snapshot: Snapshot): string {
    const frontMatter = this.generateFrontMatter(snapshot);
    const content = this.formatContent(snapshot);
    const annotations = this.formatAnnotations(snapshot.annotations);
    
    return `${frontMatter}\n\n${content}\n\n${annotations}`;
  }
  
  private generateFrontMatter(snapshot: Snapshot): string {
    return `---
title: ${snapshot.title}
url: ${snapshot.url}
author: ${snapshot.metadata.author || 'Unknown'}
date: ${snapshot.metadata.publishDate || snapshot.createdAt}
captured: ${snapshot.createdAt}
tags: [${snapshot.categories.map(c => `"${c}"`).join(', ')}]
rating: ${snapshot.rating || 0}
---`;
  }
  
  private formatContent(snapshot: Snapshot): string {
    let md = `# ${snapshot.title}\n\n`;
    md += `> 原文链接: [${snapshot.url}](${snapshot.url})\n\n`;
    
    // 转换HTML为Markdown
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    md += turndown.turndown(snapshot.content.html);
    
    return md;
  }
  
  private formatAnnotations(annotations: Annotation[]): string {
    if (annotations.length === 0) return '';
    
    let md = '## 📝 我的批注\n\n';
    
    annotations.forEach((anno, idx) => {
      md += `### ${idx + 1}. ${anno.type === 'highlight' ? '高亮' : '笔记'}\n`;
      md += `> ${anno.content}\n\n`;
    });
    
    return md;
  }
  
  // 生成双链
  generateWikiLinks(text: string, terms: string[]): string {
    let result = text;
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, `[[${term}]]`);
    });
    return result;
  }
}
```

#### 5.1.2 文件导出服务

```typescript
// services/export/ExportService.ts
class ExportService {
  private formatter: ObsidianFormatter;
  
  async exportToObsidian(
    snapshotIds: string[],
    options: ExportOptions
  ): Promise<void> {
    const snapshots = await db.snapshots.bulkGet(snapshotIds);
    
    for (const snapshot of snapshots) {
      const markdown = this.formatter.formatSnapshot(snapshot);
      const filename = this.generateFilename(snapshot, options);
      const filepath = this.getFilepath(snapshot, options);
      
      // 使用File System Access API
      await this.saveFile(filepath, filename, markdown);
      
      // 处理附件（图片）
      if (options.includeImages) {
        await this.exportImages(snapshot, filepath);
      }
    }
  }
  
  private async saveFile(
    dirPath: string,
    filename: string,
    content: string
  ): Promise<void> {
    // 请求目录访问权限
    const dirHandle = await window.showDirectoryPicker();
    
    // 创建文件
    const fileHandle = await dirHandle.getFileHandle(filename, {
      create: true
    });
    
    // 写入内容
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
  
  private generateFilename(
    snapshot: Snapshot,
    options: ExportOptions
  ): string {
    const date = new Date(snapshot.createdAt);
    const dateStr = date.toISOString().split('T')[0];
    const titleSlug = snapshot.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .slice(0, 50);
    
    return `${dateStr}_${titleSlug}.md`;
  }
  
  private getFilepath(
    snapshot: Snapshot,
    options: ExportOptions
  ): string {
    if (options.organizeby === 'category') {
      return snapshot.categories[0] || 'Uncategorized';
    }
    
    if (options.organizeBy === 'date') {
      const date = new Date(snapshot.createdAt);
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    }
    
    return '';
  }
}
```

---

## 6. 性能优化策略

### 6.1 内容提取优化
```typescript
// 使用Web Worker处理大文档
class ExtractorWorker {
  private worker: Worker;
  
  async extract(html: string): Promise<ExtractedContent> {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ html });
      
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.onerror = (e) => reject(e);
    });
  }
}
```

### 6.2 翻译优化
```typescript
// 1. 请求去重
class TranslationDeduplicator {
  private pending: Map<string, Promise<string>>;
  
  async translate(text: string): Promise<string> {
    const key = this.hashText(text);
    
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    const promise = this.doTranslate(text);
    this.pending.set(key, promise);
    
    promise.finally(() => this.pending.delete(key));
    
    return promise;
  }
}

// 2. 智能批处理
class BatchTranslator {
  private queue: string[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(text: string): Promise<string> {
    return new Promise((resolve) => {
      this.queue.push(text);
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), 100);
      }
    });
  }
  
  private async flush() {
    const batch = this.queue.splice(0, 10); // 每批10个
    const results = await translationService.batchTranslate(batch);
    // ... 返回结果
  }
}
```

### 6.3 存储优化
```typescript
// 1. 惰性加载
class LazySnapshotLoader {
  async loadSnapshots(limit = 20): Promise<Snapshot[]> {
    // 只加载元数据
    const metadata = await db.snapshots
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
    
    // 按需加载完整内容
    return metadata.map(m => ({
      ...m,
      content: {
        html: '',  // 延迟加载
        text: m.content.text.slice(0, 200) + '...'  // 摘要
      }
    }));
  }
}

// 2. 缓存策略
class CacheManager {
  private memCache: LRUCache<string, any>;
  
  async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // 1. 检查内存缓存
    if (this.memCache.has(key)) {
      return this.memCache.get(key);
    }
    
    // 2. 加载数据
    const data = await loader();
    
    // 3. 存入缓存
    this.memCache.set(key, data);
    
    return data;
  }
}
```

---

## 7. 安全性设计

### 7.1 API密钥加密

```typescript
// utils/crypto.ts
class SecureStorage {
  private async getEncryptionKey(): Promise<CryptoKey> {
    // 使用用户设备指纹生成密钥
    const deviceId = await this.getDeviceId();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(deviceId),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('learning-snapshot-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encryptAPIKey(apiKey: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(apiKey)
    );
    
    // 返回 iv + encrypted 的Base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  async decryptAPIKey(encrypted: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
```

### 7.2 内容安全策略

```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self'"
  }
}
```

### 7.3 权限最小化

```typescript
// 动态权限请求
async function requestHostPermission(url: string) {
  const { origin } = new URL(url);
  
  const granted = await chrome.permissions.request({
    origins: [origin + '/*']
  });
  
  if (!granted) {
    throw new Error('Permission denied');
  }
}
```

---

## 8. 测试策略

### 8.1 单元测试

```typescript
// tests/unit/ContentExtractor.test.ts
describe('ContentExtractor', () => {
  let extractor: ContentExtractor;
  
  beforeEach(() => {
    extractor = new ContentExtractor();
  });
  
  test('should extract main content from HTML', async () => {
    const html = '<article><h1>Title</h1><p>Content</p></article>';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const result = await extractor.extractMainContent(doc);
    
    expect(result.title).toBe('Title');
    expect(result.content).toContain('Content');
  });
  
  test('should convert images to data URLs', async () => {
    const html = '<img src="https://example.com/image.jpg">';
    
    const result = await extractor.localizeResources(html);
    
    expect(result).toContain('data:image');
  });
});
```

### 8.2 集成测试

```typescript
// tests/integration/translation.test.ts
describe('Translation Flow', () => {
  test('should translate and cache result', async () => {
    const service = new TranslationService();
    
    // 第一次翻译
    const result1 = await service.translate({
      text: 'Hello World',
      from: 'en',
      to: 'zh',
      provider: 'deepl'
    });
    
    // 第二次应该从缓存读取
    const result2 = await service.translate({
      text: 'Hello World',
      from: 'en',
      to: 'zh',
      provider: 'deepl'
    });
    
    expect(result1).toEqual(result2);
    expect(result2.fromCache).toBe(true);
  });
});
```

### 8.3 E2E测试

```typescript
// tests/e2e/snapshot.spec.ts
import { test, expect } from '@playwright/test';

test('create snapshot from webpage', async ({ page, context }) => {
  // 加载扩展
  const extensionId = await loadExtension(context);
  
  // 访问测试页面
  await page.goto('https://example.com/article');
  
  // 触发快照
  await page.click(`chrome-extension://${extensionId}/popup.html`);
  await page.click('button[data-action="snapshot"]');
  
  // 验证快照创建
  const snapshots = await page.evaluate(() => {
    return chrome.storage.local.get('snapshots');
  });
  
  expect(snapshots.length).toBeGreaterThan(0);
});
```

---

## 9. 部署与发布

### 9.1 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        sidepanel: 'src/sidepanel/index.html'
      }
    }
  }
});
```

### 9.2 发布流程

```bash
# 1. 版本更新
npm version patch  # or minor, major

# 2. 构建生产版本
npm run build

# 3. 打包扩展
cd dist
zip -r ../learning-snapshot-v1.0.0.zip .

# 4. 上传到Chrome Web Store
# - 访问 https://chrome.google.com/webstore/devconsole
# - 上传zip文件
# - 填写应用描述、截图等
# - 提交审核
```

### 9.3 版本管理

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write 'src/**/*.{ts,tsx}'",
    "release": "npm run build && npm run package",
    "package": "cd dist && zip -r ../extension.zip ."
  }
}
```

---

## 10. 运维与监控

### 10.1 错误追踪

```typescript
// utils/errorTracking.ts
class ErrorTracker {
  static track(error: Error, context?: any) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // 本地存储错误日志
    chrome.storage.local.get(['errorLogs'], (result) => {
      const logs = result.errorLogs || [];
      logs.push(errorInfo);
      
      // 保留最近100条
      if (logs.length > 100) {
        logs.shift();
      }
      
      chrome.storage.local.set({ errorLogs: logs });
    });
    
    // 可选: 发送到远程服务器
    // fetch('https://api.example.com/errors', {
    //   method: 'POST',
    //   body: JSON.stringify(errorInfo)
    // });
  }
}

// 全局错误处理
window.addEventListener('error', (event) => {
  ErrorTracker.track(event.error, { type: 'uncaught' });
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorTracker.track(
    new Error(event.reason),
    { type: 'unhandled-promise' }
  );
});
```

### 10.2 性能监控

```typescript
// utils/performanceMonitor.ts
class PerformanceMonitor {
  static measure(name: string, fn: () => Promise<any>) {
    return async (...args: any[]) => {
      const start = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        
        this.record(name, duration, 'success');
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.record(name, duration, 'error');
        throw error;
      }
    };
  }
  
  private static record(
    name: string,
    duration: number,
    status: 'success' | 'error'
  ) {
    chrome.storage.local.get(['metrics'], (result) => {
      const metrics = result.metrics || {};
      
      if (!metrics[name]) {
        metrics[name] = {
          count: 0,
          totalDuration: 0,
          errors: 0
        };
      }
      
      metrics[name].count++;
      metrics[name].totalDuration += duration;
      
      if (status === 'error') {
        metrics[name].errors++;
      }
      
      chrome.storage.local.set({ metrics });
    });
  }
}
```

---

## 11. 扩展性设计

### 11.1 插件系统

```typescript
// Plugin架构
interface Plugin {
  name: string;
  version: string;
  init(): void;
  onSnapshot?(snapshot: Snapshot): void;
  onTranslate?(translation: Translation): void;
  onExport?(data: ExportData): void;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  register(plugin: Plugin) {
    plugin.init();
    this.plugins.set(plugin.name, plugin);
  }
  
  async emit(event: string, data: any) {
    for (const plugin of this.plugins.values()) {
      const handler = plugin[`on${event}`];
      if (handler) {
        await handler.call(plugin, data);
      }
    }
  }
}

// 示例插件: Anki集成
class AnkiPlugin implements Plugin {
  name = 'anki-integration';
  version = '1.0.0';
  
  init() {
    console.log('Anki plugin initialized');
  }
  
  async onTranslate(translation: Translation) {
    // 自动创建Anki卡片
    await this.createAnkiCard({
      front: translation.original,
      back: translation.translated
    });
  }
}
```

### 11.2 主题系统

```typescript
// 主题配置
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

class ThemeManager {
  applyTheme(theme: Theme) {
    document.documentElement.style.setProperty(
      '--color-primary',
      theme.colors.primary
    );
    // ... 其他CSS变量
  }
}
```

---

## 12. 附录

### 12.1 技术选型对比

| 技术项 | 方案A | 方案B | 选型 | 原因 |
|--------|-------|-------|------|------|
| 状态管理 | Redux | Zustand | Zustand | 更轻量,API简单 |
| 数据库 | LocalStorage | IndexedDB | IndexedDB | 更大容量,更好性能 |
| 翻译 | 仅API | API+本地 | API+本地 | 离线支持 |
| UI框架 | Vue | React | React | 生态更丰富 |

### 12.2 API速率限制

| 服务 | 免费额度 | 速率限制 | 备注 |
|------|----------|----------|------|
| DeepL | 500k字符/月 | 无明确限制 | 需API Key |
| OpenAI | 按使用付费 | 3500 req/min | GPT-3.5 |
| Claude | 按使用付费 | 5 req/min | Sonnet |
| Ollama | 无限制 | 本地硬件限制 | 需本地部署 |

### 12.3 浏览器兼容性矩阵

| 功能 | Chrome | Edge | 备注 |
|------|--------|------|------|
| Service Worker | ✅ | ✅ | MV3支持 |
| IndexedDB | ✅ | ✅ | 完整支持 |
| File System API | ✅ | ✅ | 需用户授权 |
| Side Panel | ✅ | ✅ | Chrome 114+ |

---

**文档审核记录**

| 版本 | 日期 | 审核人 | 状态 |
|------|------|--------|------|
| v1.0 | 2025-10-04 | Tech Lead | Approved |

---

**参考文档**

- [Chrome Extension Architecture](https://developer.chrome.com/docs/extensions/mv3/architecture-overview/)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
- [Readability.js](https://github.com/mozilla/readability)
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
