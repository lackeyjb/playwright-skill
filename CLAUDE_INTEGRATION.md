# Playwright Skill 与 Claude 集成详解

本文档详细介绍 Playwright Skill 如何与 Claude Code 集成，帮助开发者理解技能系统的工作原理和最佳实践。

---

## 目录

1. [集成概述](#集成概述)
2. [核心概念](#核心概念)
3. [技能发现机制](#技能发现机制)
4. [集成架构](#集成架构)
5. [关键文件详解](#关键文件详解)
6. [工作流程](#工作流程)
7. [模型驱动调用](#模型驱动调用)
8. [渐进式信息披露](#渐进式信息披露)
9. [安装方式对比](#安装方式对比)
10. [最佳实践](#最佳实践)
11. [调试与故障排除](#调试与故障排除)

---

## 集成概述

Playwright Skill 是一个 **Claude Code Skill**，这是 Anthropic 提供的扩展 Claude 功能的模块化能力系统。与需要用户手动调用的斜杠命令（Slash Commands）不同，**Skills 是模型驱动的**——Claude 会根据用户的请求自主决定何时使用它们。

### 核心特点

- **自主调用**：Claude 根据上下文自动决定是否使用此技能
- **零配置使用**：安装后无需手动激活，Claude 自动发现
- **动态代码生成**：Claude 为每个任务编写定制的 Playwright 代码
- **安全隔离**：测试脚本写入 `/tmp` 目录，不污染项目
- **通用执行器**：`run.js` 确保正确的模块解析和执行环境

---

## 核心概念

### 什么是 Claude Skill？

**Skill（技能）** 是 Claude 的模块化能力扩展：

- **自主性**：Claude 根据用户请求自动判断是否需要使用技能
- **专业化**：每个技能专注于特定领域（如浏览器自动化、数据处理等）
- **透明性**：用户只需描述需求，无需了解技能的内部实现
- **可组合性**：多个技能可以协同工作完成复杂任务

### Skill vs Slash Command

| 特性 | Claude Skill | Slash Command |
|------|-------------|---------------|
| **调用方式** | 模型自主决定 | 用户手动输入 `/command` |
| **使用场景** | 通用能力扩展 | 特定任务快捷方式 |
| **用户感知** | 透明（用户无需知道存在） | 显式（需要记忆命令） |
| **灵活性** | 高（动态适应任务） | 低（固定脚本） |
| **示例** | Playwright Skill | `/review-pr` |

---

## 技能发现机制

Claude Code 通过以下路径自动发现技能：

### 全局技能目录
```bash
~/.claude/skills/
```
- 所有 Claude Code 会话都可访问
- 适合通用工具和常用技能
- 需要一次性全局安装

### 项目特定技能目录
```bash
<project-root>/.claude/skills/
```
- 仅在特定项目中可用
- 适合项目定制化工具
- 隔离项目依赖

### 插件系统安装目录
```bash
~/.claude/plugins/marketplaces/<marketplace-name>/skills/<skill-name>/
```
- 通过插件市场管理
- 支持版本控制和更新
- 推荐的企业级分发方式

### 发现规则

Claude 在启动时：
1. 扫描上述目录
2. 查找包含 `SKILL.md` 的文件夹
3. 读取技能元数据（名称、描述、版本）
4. 将技能加载到可用能力列表

---

## 集成架构

### 系统组件图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户请求                              │
│         "Test if the login page works correctly"            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code AI                            │
│  • 理解用户意图                                                │
│  • 决定需要浏览器自动化能力                                     │
│  • 查找可用的 Skills                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│             技能发现与加载 (Skill Discovery)                   │
│  扫描目录:                                                     │
│  • ~/.claude/skills/playwright-skill/                        │
│  • <project>/.claude/skills/playwright-skill/                │
│  • ~/.claude/plugins/marketplaces/.../playwright-skill/      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              读取 SKILL.md (Skill Instructions)              │
│  Claude 读取技能指令:                                          │
│  • 技能名称和描述                                              │
│  • 何时使用此技能                                              │
│  • 执行模式和最佳实践                                          │
│  • 代码示例和模板                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Claude 生成定制的 Playwright 代码                     │
│  1. 检测开发服务器 (helpers.detectDevServers)                 │
│  2. 编写测试脚本到 /tmp/playwright-test-*.js                  │
│  3. 执行: cd $SKILL_DIR && node run.js /tmp/test.js         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               通用执行器 (run.js)                              │
│  • 检查 Playwright 是否安装                                    │
│  • 设置正确的工作目录                                          │
│  • 包装代码（如需要）                                          │
│  • 执行自动化脚本                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            Playwright 浏览器自动化执行                         │
│  • 启动浏览器（默认可见模式）                                   │
│  • 执行测试步骤                                                │
│  • 捕获截图和控制台输出                                         │
│  • 返回结果                                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Claude 处理并呈现结果                           │
│  • 解析执行输出                                                │
│  • 显示截图                                                   │
│  • 总结测试结果                                                │
│  • 提供改进建议                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键文件详解

### 1. SKILL.md - Claude 的指令手册

**位置**: `skills/playwright-skill/SKILL.md`

**作用**: 这是 Claude 读取的核心文件，告诉 Claude：
- 什么时候使用这个技能
- 如何使用这个技能
- 有哪些可用的功能

**关键内容**:

```markdown
---
name: Playwright Browser Automation
description: Complete browser automation with Playwright...
version: 4.0.0
tags: [testing, automation, browser, e2e, playwright]
---

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - 自动检测开发服务器
2. **Write scripts to /tmp** - 将脚本写入临时目录
3. **Use visible browser by default** - 默认使用可见浏览器
4. **Parameterize URLs** - URL 参数化
```

**元数据字段**:
- `name`: 技能显示名称
- `description`: 触发条件描述（Claude 用此判断何时使用）
- `version`: 版本号
- `author`: 作者信息
- `tags`: 关键词标签（帮助 Claude 匹配用户意图）

**为什么 Claude 能理解这个文件？**
- Claude 被训练为理解 Markdown 格式的指令
- 元数据提供结构化信息用于技能匹配
- 代码示例作为模板供 Claude 参考和修改

### 2. run.js - 通用执行器

**位置**: `skills/playwright-skill/run.js`

**作用**: 解决 Node.js 模块解析问题，确保 Playwright 正确加载

**核心功能**:

```javascript
// 1. 切换到技能目录（确保正确的 node_modules 路径）
process.chdir(__dirname);

// 2. 检查 Playwright 是否安装
function checkPlaywrightInstalled() {
  try {
    require.resolve('playwright');
    return true;
  } catch (e) {
    return false;
  }
}

// 3. 支持三种输入方式
// - 文件路径: node run.js /tmp/test.js
// - 内联代码: node run.js "await page.goto(...)"
// - 标准输入: cat test.js | node run.js

// 4. 自动包装代码（如果需要）
function wrapCodeIfNeeded(code) {
  // 如果是简单的 Playwright 命令，自动添加 require 和 async 包装
  if (!code.includes('require(')) {
    return `
const { chromium } = require('playwright');
(async () => {
  ${code}
})();
    `;
  }
  return code;
}
```

**为什么需要这个执行器？**
- **模块解析**：Node.js 从当前工作目录查找 `node_modules`
- **一致性**：无论从哪里调用，都能找到 Playwright
- **灵活性**：支持多种输入方式，适应不同场景

### 3. helpers.js - 辅助函数库

**位置**: `skills/playwright-skill/lib/helpers.js`

**作用**: 提供常用的浏览器自动化功能

**核心功能**:

```javascript
// 自动检测运行中的开发服务器
async function detectDevServers(customPorts = []) {
  // 检查常见端口: 3000, 3001, 5173, 8080...
  // 返回可访问的服务器列表
}

// 安全点击（带重试）
async function safeClick(page, selector, options = {}) {
  // 等待元素可见
  // 重试机制（默认3次）
}

// 安全输入文本
async function safeType(page, selector, text, options = {}) {
  // 清空输入框
  // 模拟真实输入
}

// 处理 Cookie 横幅
async function handleCookieBanner(page, timeout = 3000) {
  // 识别常见的 Cookie 接受按钮
  // 自动点击
}

// 提取表格数据
async function extractTableData(page, tableSelector) {
  // 解析表头
  // 提取行数据
  // 返回结构化数据
}
```

**Claude 如何使用这些辅助函数？**
1. SKILL.md 中有使用示例
2. Claude 根据任务需求选择合适的辅助函数
3. 将辅助函数调用整合到生成的代码中

### 4. plugin.json - 插件元数据

**位置**: `.claude-plugin/plugin.json`

**作用**: Claude Code 插件系统的配置文件

```json
{
  "name": "playwright-skill",
  "version": "4.0.2",
  "description": "Claude Code Skill for browser automation",
  "author": { "name": "lackeyjb" },
  "keywords": [
    "claude-skill",
    "playwright",
    "browser-automation",
    "model-invoked"
  ]
}
```

**关键字段**:
- `name`: 插件标识符
- `version`: 版本号（遵循语义化版本）
- `keywords`: 包含 `claude-skill` 标识这是一个技能
- `model-invoked`: 标识为模型驱动调用

### 5. marketplace.json - 市场配置

**位置**: `.claude-plugin/marketplace.json`

**作用**: 插件市场分发配置

```json
{
  "name": "playwright-skill",
  "plugins": [
    {
      "name": "playwright-skill",
      "source": "./",
      "category": "testing",
      "tags": ["browser", "automation", "playwright"]
    }
  ]
}
```

**用途**:
- 支持通过 `/plugin marketplace add` 添加
- 版本管理和更新
- 分类和标签便于发现

---

## 工作流程

### 完整执行流程示例

**用户请求**:
```
"Test if the login form works correctly"
```

**步骤 1: 意图识别**
```
Claude 分析请求:
- 关键词: "test", "login form", "works"
- 判断: 需要浏览器自动化
- 决策: 使用 Playwright Skill
```

**步骤 2: 加载技能指令**
```
Claude 读取 SKILL.md:
- 发现自动检测服务器的要求
- 了解测试脚本应写入 /tmp
- 获取登录测试的代码模板
```

**步骤 3: 自动检测服务器**
```bash
# Claude 执行
cd ~/.claude/skills/playwright-skill && \
node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"

# 输出
["http://localhost:3001"]
```

**步骤 4: 生成测试代码**
```javascript
// Claude 写入 /tmp/playwright-test-login.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // 来自检测结果

(async () => {
  const browser = await chromium.launch({
    headless: false,  // 可见模式
    slowMo: 100       // 慢动作便于观察
  });
  const page = await browser.newPage();

  try {
    // 访问登录页面
    await page.goto(`${TARGET_URL}/login`);
    console.log('📄 Login page loaded');

    // 填写表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    console.log('✏️  Form filled');

    // 提交
    await page.click('button[type="submit"]');
    console.log('🔘 Submit button clicked');

    // 等待跳转
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ Login successful - redirected to dashboard');

    // 截图验证
    await page.screenshot({
      path: '/tmp/login-success.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to /tmp/login-success.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/login-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
})();
```

**步骤 5: 执行测试**
```bash
# Claude 运行
cd ~/.claude/skills/playwright-skill && \
node run.js /tmp/playwright-test-login.js
```

**步骤 6: 处理输出**
```
Claude 接收输出:
- 控制台日志: "✅ Login successful"
- 截图: /tmp/login-success.png
- 退出码: 0 (成功)

Claude 向用户报告:
"登录表单测试通过！表单能够正确提交，并成功跳转到仪表盘页面。
我已保存了登录成功后的截图供您查看。"
```

---

## 模型驱动调用

### 什么是模型驱动调用？

**传统方式（用户驱动）**:
```
用户: /playwright-test-login
系统: 执行预定义的登录测试脚本
```

**Claude Skill 方式（模型驱动）**:
```
用户: 测试一下登录功能
Claude:
  1. 理解意图（需要测试登录）
  2. 自动选择 Playwright Skill
  3. 检测服务器
  4. 生成定制代码
  5. 执行并报告结果
```

### Claude 如何决定使用这个技能？

Claude 的决策基于多个因素：

**1. 描述匹配（Description Matching）**
```markdown
description: Complete browser automation with Playwright.
Test pages, fill forms, take screenshots, check responsive design,
validate UX, test login flows, check links, automate any browser task.
Use when user wants to test websites, automate browser interactions...
```

**关键触发词**:
- test/testing
- browser
- webpage/website
- form
- screenshot
- automation
- login/signup
- responsive design

**2. 标签匹配（Tag Matching）**
```yaml
tags: [testing, automation, browser, e2e, playwright, web-testing]
```

**3. 上下文理解（Context Understanding）**
Claude 理解用户意图，例如：
- "这个页面加载正常吗？" → 需要浏览器检查
- "表单能提交吗？" → 需要交互测试
- "移动端显示怎么样？" → 需要响应式测试

### 示例：各种用户请求的匹配

| 用户请求 | Claude 判断 | 触发原因 |
|---------|------------|---------|
| "测试首页" | ✅ 使用 Skill | 关键词 "测试" + 隐含浏览器需求 |
| "检查登录流程" | ✅ 使用 Skill | "检查" + "登录" 明确需要浏览器 |
| "截图这个页面" | ✅ 使用 Skill | "截图" 直接匹配技能描述 |
| "表单有几个字段？" | ✅ 使用 Skill | 需要访问页面获取信息 |
| "如何使用 Playwright？" | ❌ 不使用 | 询问信息，不需要执行 |
| "解释这段代码" | ❌ 不使用 | 代码分析任务 |

---

## 渐进式信息披露

### 设计理念

Playwright API 非常庞大（完整文档 630 行），如果每次都加载全部内容会：
- 消耗大量 token
- 增加响应延迟
- 包含许多无关信息

**解决方案：分层文档结构**

```
SKILL.md (314 行)
├── 基础指令和工作流程
├── 常见模式和示例
└── 提示 API_REFERENCE.md 存在

API_REFERENCE.md (630 行)
├── 高级选择器策略
├── 网络拦截
├── 认证处理
├── 视觉回归测试
├── 性能测试
└── 调试技巧
```

### 加载策略

**默认加载（每次任务）**:
```
SKILL.md
- 基础工作流程
- 服务器检测
- 常见测试模式
- 简单示例
```

**按需加载（需要时）**:
```
API_REFERENCE.md
- 用户明确要求高级功能
- 简单方法无法解决问题
- Claude 判断需要更多上下文
```

### 实际示例

**场景 1: 简单测试（仅加载 SKILL.md）**
```
用户: "测试主页是否加载"
Claude:
  1. 读取 SKILL.md（314 行）
  2. 找到基础测试模板
  3. 生成代码并执行
  ✅ 无需 API_REFERENCE.md
```

**场景 2: 复杂需求（额外加载 API_REFERENCE.md）**
```
用户: "测试时拦截 API 请求并返回模拟数据"
Claude:
  1. 读取 SKILL.md - 发现没有网络拦截示例
  2. 读取 API_REFERENCE.md - 找到 "Network Interception" 章节
  3. 使用 page.route() API 生成代码
  ✅ 按需加载完整文档
```

### 文档引用机制

**SKILL.md 中的提示**:
```markdown
## Advanced Usage

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
```

**Claude 如何使用这个提示**:
1. 遇到复杂需求时，识别到可能需要高级功能
2. 读取 API_REFERENCE.md 的相关章节
3. 使用详细 API 生成更复杂的代码

---

## 安装方式对比

### 方式 1: 插件系统（推荐）

**安装命令**:
```bash
# 添加市场
/plugin marketplace add lackeyjb/playwright-skill

# 安装插件
/plugin install playwright-skill@playwright-skill

# 进入技能目录运行设置
cd ~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill
npm run setup
```

**优点**:
- ✅ 版本管理
- ✅ 一键更新
- ✅ 市场分发
- ✅ 依赖跟踪

**缺点**:
- ❌ 需要额外步骤（运行 setup）
- ❌ 路径较深

**适用场景**:
- 企业环境
- 需要版本控制
- 多人协作

### 方式 2: 全局手动安装

**安装命令**:
```bash
cd ~/.claude/skills
git clone https://github.com/lackeyjb/playwright-skill.git
cd playwright-skill/skills/playwright-skill
npm run setup
```

**优点**:
- ✅ 简单直接
- ✅ 所有项目可用
- ✅ 路径清晰

**缺点**:
- ❌ 手动更新
- ❌ 无版本管理

**适用场景**:
- 个人开发
- 快速试用
- 全局工具

### 方式 3: 项目特定安装

**安装命令**:
```bash
cd /your/project
mkdir -p .claude/skills
cd .claude/skills
git clone https://github.com/lackeyjb/playwright-skill.git
cd playwright-skill/skills/playwright-skill
npm run setup
```

**优点**:
- ✅ 项目隔离
- ✅ 可进入版本控制（如果需要）
- ✅ 自定义配置

**缺点**:
- ❌ 每个项目需单独安装
- ❌ 重复依赖

**适用场景**:
- 特定项目需求
- 需要定制化
- 团队共享配置

### 路径解析机制

**SKILL.md 中的关键指令**:
```markdown
**IMPORTANT - Path Resolution:**
Before executing any commands, determine the skill directory
based on where you loaded this SKILL.md file, and use that
path in all commands below. Replace `$SKILL_DIR` with the
actual discovered path.
```

**Claude 如何解析路径**:
```python
# 伪代码
skill_md_path = find_skill_file("SKILL.md")
# 例如: /home/user/.claude/skills/playwright-skill/SKILL.md

skill_dir = dirname(skill_md_path)
# 结果: /home/user/.claude/skills/playwright-skill

# 在所有命令中使用
execute(f"cd {skill_dir} && node run.js /tmp/test.js")
```

**为什么需要动态路径？**
- 支持多种安装方式
- 避免硬编码路径
- 提高可移植性

---

## 最佳实践

### 1. 编写清晰的技能描述

**好的描述（触发准确）**:
```markdown
description: Complete browser automation with Playwright.
Auto-detects dev servers, writes clean test scripts to /tmp.
Test pages, fill forms, take screenshots, check responsive design,
validate UX, test login flows, check links, automate any browser task.
Use when user wants to test websites, automate browser interactions,
validate web functionality, or perform any browser-based testing.
```

**为什么有效？**
- ✅ 明确的关键词（test, automate, browser, forms）
- ✅ 具体的使用场景（login flows, responsive design）
- ✅ 明确的触发条件（"Use when user wants to..."）

**糟糕的描述（触发不准确）**:
```markdown
description: A tool for Playwright
```

**为什么无效？**
- ❌ 过于笼统
- ❌ 缺少关键词
- ❌ 没有使用场景

### 2. 提供丰富的代码示例

**SKILL.md 中的示例应该**:
- ✅ 覆盖常见场景（登录、表单、响应式测试）
- ✅ 包含注释说明
- ✅ 展示最佳实践
- ✅ 可直接复制使用

**示例结构**:
```javascript
// /tmp/playwright-test-login.js
const { chromium } = require('playwright');

// 📝 URL 参数化 - 便于修改
const TARGET_URL = 'http://localhost:3001';

(async () => {
  // 🔧 启动配置
  const browser = await chromium.launch({
    headless: false,  // 默认可见
    slowMo: 100       // 慢动作
  });

  const page = await browser.newPage();

  try {
    // 🌐 访问页面
    await page.goto(`${TARGET_URL}/login`);

    // ✏️ 填写表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // 🔘 提交
    await page.click('button[type="submit"]');

    // ⏳ 等待结果
    await page.waitForURL('**/dashboard');
    console.log('✅ Login successful');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    await browser.close();
  }
})();
```

### 3. 实现关键工作流程

**本技能的关键工作流程**:
```markdown
**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - 避免硬编码 URL
2. **Write scripts to /tmp** - 不污染项目
3. **Use visible browser by default** - 便于调试
4. **Parameterize URLs** - 提高可复用性
```

**为什么重要？**
- Claude 会遵循这些步骤
- 确保一致的用户体验
- 避免常见错误

### 4. 提供辅助函数

**helpers.js 的设计原则**:
- ✅ 解决常见痛点（服务器检测、重试逻辑）
- ✅ 提供合理默认值
- ✅ 支持自定义配置
- ✅ 错误处理健壮

**示例：服务器检测**
```javascript
async function detectDevServers(customPorts = []) {
  // 常见端口列表
  const commonPorts = [3000, 3001, 5173, 8080, 8000, 4200];

  // 合并自定义端口
  const allPorts = [...new Set([...commonPorts, ...customPorts])];

  // 并发检测（高效）
  const detected = [];
  for (const port of allPorts) {
    if (await checkPort(port)) {
      detected.push(`http://localhost:${port}`);
    }
  }

  return detected;
}
```

**好处**:
- 用户无需手动提供 URL
- 支持多服务器场景
- 失败时提供清晰提示

### 5. 错误处理和用户反馈

**关键原则**:
```javascript
try {
  // 主要逻辑
  await page.goto(url);
  console.log('✅ Page loaded');
} catch (error) {
  console.error('❌ Failed to load page:', error.message);

  // 保存错误截图
  await page.screenshot({ path: '/tmp/error.png' });
  console.log('📸 Error screenshot saved');

  // 抛出以便 Claude 知道失败
  throw error;
}
```

**用户看到**:
```
❌ Failed to load page: net::ERR_CONNECTION_REFUSED
📸 Error screenshot saved to /tmp/error.png

Claude: "看起来服务器没有运行。请确保开发服务器已启动，
或者提供一个可访问的 URL。"
```

---

## 调试与故障排除

### 常见问题及解决方案

#### 问题 1: Claude 没有使用技能

**症状**:
```
用户: "测试登录页面"
Claude: "我无法直接测试网页，建议您使用 Playwright..."
```

**诊断步骤**:
1. 检查技能是否安装
   ```bash
   ls ~/.claude/skills/
   ls <project>/.claude/skills/
   ```

2. 检查 SKILL.md 是否存在
   ```bash
   find ~/.claude -name "SKILL.md"
   ```

3. 检查描述是否匹配
   ```bash
   head -20 ~/.claude/skills/playwright-skill/SKILL.md
   ```

**解决方案**:
- 确保 `description` 包含相关关键词
- 尝试更明确的用户请求："使用 Playwright 测试登录"
- 重启 Claude Code（重新加载技能）

#### 问题 2: Module not found

**症状**:
```
❌ Error: Cannot find module 'playwright'
```

**原因**:
- Playwright 未安装
- 从错误的目录执行

**解决方案**:
```bash
# 进入技能目录
cd ~/.claude/skills/playwright-skill/skills/playwright-skill

# 运行设置
npm run setup

# 验证安装
node -e "console.log(require('playwright'))"
```

#### 问题 3: 浏览器无法启动

**症状**:
```
❌ browserType.launch: Executable doesn't exist
```

**原因**:
- Chromium 未安装

**解决方案**:
```bash
cd ~/.claude/skills/playwright-skill/skills/playwright-skill
npx playwright install chromium

# 或安装所有浏览器
npm run install-all-browsers
```

#### 问题 4: 路径解析错误

**症状**:
```
❌ Error: ENOENT: no such file or directory
```

**原因**:
- `$SKILL_DIR` 未正确替换

**检查 Claude 是否正确解析路径**:
```bash
# Claude 应该使用类似这样的命令
cd /home/user/.claude/skills/playwright-skill && node run.js /tmp/test.js

# 而不是
cd $SKILL_DIR && node run.js /tmp/test.js  # ❌ 变量未展开
```

**确保 SKILL.md 包含路径解析指令**:
```markdown
**IMPORTANT - Path Resolution:**
Before executing any commands, determine the skill directory
based on where you loaded this SKILL.md file...
```

### 调试技巧

#### 1. 启用详细输出

**在生成的代码中添加**:
```javascript
// 页面事件监听
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error));
page.on('request', request => console.log('→', request.method(), request.url()));
page.on('response', response => console.log('←', response.status(), response.url()));
```

#### 2. 使用慢动作模式

```javascript
const browser = await chromium.launch({
  headless: false,
  slowMo: 500  // 每个操作延迟 500ms
});
```

#### 3. 保存执行痕迹

```javascript
// 每个关键步骤后截图
await page.screenshot({ path: '/tmp/step-1-login-page.png' });
await page.fill('input[name="email"]', 'test@example.com');
await page.screenshot({ path: '/tmp/step-2-email-filled.png' });
```

#### 4. 测试辅助函数

```bash
# 直接测试服务器检测
cd ~/.claude/skills/playwright-skill/skills/playwright-skill
node -e "require('./lib/helpers').detectDevServers().then(s => console.log(s))"

# 输出: [ 'http://localhost:3000', 'http://localhost:3001' ]
```

---

## 高级主题

### 自定义技能开发

基于 Playwright Skill 的经验，开发自己的技能：

**最小化技能结构**:
```
my-skill/
├── SKILL.md          # 必需：Claude 的指令
├── execute.js        # 推荐：执行器
├── lib/
│   └── helpers.js    # 可选：辅助函数
└── package.json      # 可选：依赖管理
```

**SKILL.md 模板**:
```markdown
---
name: My Custom Skill
description: [描述技能功能和使用场景，包含触发关键词]
version: 1.0.0
author: Your Name
tags: [relevant, keywords, here]
---

# Skill Name

## 使用场景

[说明什么时候 Claude 应该使用这个技能]

## 执行模式

[提供清晰的步骤和代码示例]

## 示例

[至少 3-5 个常见场景的完整代码示例]
```

### 技能组合

**多技能协同示例**:
```
用户: "测试 API 端点，然后在浏览器中验证数据显示正确"

Claude 的决策:
1. 使用 HTTP/API 技能测试端点
2. 使用 Playwright 技能验证前端
3. 交叉验证数据一致性
```

### 性能优化

**减少技能加载时间**:
- 保持 SKILL.md 简洁（< 500 行）
- 高级内容放入单独的参考文档
- 使用清晰的章节结构便于查找

**减少执行时间**:
- 提供并行执行示例
- 默认使用快速选择器
- 避免不必要的等待

---

## 总结

### Playwright Skill 集成的核心要点

1. **自主调用**: Claude 根据描述和标签自动匹配用户意图
2. **动态代码生成**: 为每个任务编写定制代码，而非固定脚本
3. **渐进式信息披露**: 分层文档减少 token 消耗
4. **通用执行器**: 解决模块解析问题
5. **智能工作流程**: 自动检测服务器、参数化 URL、安全清理

### 关键成功因素

- ✅ **清晰的描述**: 准确的关键词和使用场景
- ✅ **丰富的示例**: 覆盖常见场景的完整代码
- ✅ **健壮的执行**: 错误处理和用户反馈
- ✅ **灵活的安装**: 支持多种安装方式
- ✅ **详细的文档**: 帮助用户和 Claude 理解功能

### 技能开发建议

1. 从用户需求出发，而非技术实现
2. 提供清晰的工作流程指导
3. 包含足够多的代码示例
4. 实现关键的辅助函数
5. 测试各种安装方式
6. 编写清晰的故障排除指南

---

## 参考资源

- [Claude Skills 官方文档](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Plugins 文档](https://docs.claude.com/en/docs/claude-code/plugins)
- [Playwright 官方文档](https://playwright.dev/)
- [项目 GitHub 仓库](https://github.com/lackeyjb/playwright-skill)
- [API 参考文档](./API_REFERENCE.md)
- [贡献指南](./CONTRIBUTING.md)

---

**版本**: 1.0.0
**最后更新**: 2024年
**维护者**: Playwright Skill Community
**许可证**: MIT
