# Playwright Skill

[English](README.md) | [简体中文](README.zh-CN.md)

**面向编码智能体的通用 Playwright 自动化**

一个 [Agent Skill](https://agentskills.io)，让编码智能体能够即时编写并执行 Playwright 自动化，从简单的页面测试到复杂的多步骤流程。它同时被打包为 [Claude Code Plugin](https://code.claude.com/docs/en/plugins)，便于安装。

Claude 会根据你的浏览器自动化需求自主决定何时使用本技能，并且只加载当前任务所需的最少信息。

使用 Claude Code 制作。

## 功能特性

- **任意自动化任务** - Claude 针对你的具体需求编写自定义代码，不受限于预置脚本
- **默认显示浏览器窗口** - 通过 `headless: false` 实时查看自动化过程
- **可移植的执行器** - 以稳定的模块解析方式运行文件脚本与内联脚本
- **渐进式披露** - 精简的 SKILL.md，完整的 API 参考仅在需要时加载
- **安全的清理机制** - 智能管理临时文件，无竞态条件
- **完善的辅助函数** - 为常见任务提供可选的工具函数

## 安装

本仓库同时包含一个标准 Agent Skill 和一个 Claude Code 插件封装。推荐的使用方式是通过 Vercel 的 [`skills`](https://github.com/vercel-labs/skills) CLI 安装，它会把技能装到受支持智能体的原生位置。

## 为什么需要这个技能？

当智能体需要编写真正的 Playwright 程序时使用本技能：循环、断言、多上下文、
网络拦截、截图、录像，或者你想保留下来反复运行的脚本。它还提供开发服务器检测
以及一小组职责单一的辅助函数。

如果只是直接的交互式浏览，请优先使用微软官方的
[`@playwright/cli`](https://github.com/microsoft/playwright-cli)，并用
`playwright-cli install --skills` 安装其智能体技能。如果需要基于工具的浏览器
控制以及可访问性快照，请使用
[`playwright-mcp`](https://github.com/microsoft/playwright-mcp)。当自动化脚本
本身就是有价值的产出时，本项目是那个“以代码为先”的选择。

### 理解目录结构

本仓库采用插件格式，内部为嵌套结构：

```
playwright-skill/              # Plugin root
├── .claude-plugin/           # Plugin metadata
└── skills/
    └── playwright-skill/     # The actual skill
        └── SKILL.md
```

仓库把技能放在插件的 `skills/` 目录下。安装工具会自动处理这种布局；只有在客户端没有安装工具时，才需要手动复制。

---

### 方式一：使用 `skills` 安装（推荐）

为你的用户全局安装：

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --global --yes
```

省略 `--global` 则只为当前项目安装：

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --yes
```

要指定具体的智能体，在 `--agent` 后跟一个或多个智能体 ID：

```bash
npx skills add lackeyjb/playwright-skill --skill playwright-skill --agent claude-code cursor --global --yes
```

安装完成后，进入已安装的技能目录运行初始化：

```bash
npm run setup
```

支持的智能体与可选参数见 [`skills` CLI 文档](https://github.com/vercel-labs/skills)。

### 方式二：Claude Code 插件

通过 Claude Code 的插件系统安装，可获得自动更新与团队分发能力：

```bash
# Add this repository as a marketplace
/plugin marketplace add lackeyjb/playwright-skill

# Install the plugin
/plugin install playwright-skill@playwright-skill

# Navigate to the skill directory and run setup
cd ~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill
npm run setup
```

运行 `/help` 确认技能已可用，以此验证安装结果。

---

### 方式三：其他智能体的安装方式

Agent Skills 已得到 Claude Code、Cursor、GitHub Copilot、Codex、
Gemini CLI、OpenCode 等客户端支持。请按照各客户端文档中的技能路径安装包含
`SKILL.md` 的目录。若客户端没有安装工具，把 `skills/playwright-skill/` 复制到
其文档所述的技能目录，并在该目录运行 `npm run setup`。

### 方式四：下载发行版

1. 从 [GitHub Releases](https://github.com/lackeyjb/playwright-skill/releases) 下载并解压最新版本
2. 只把 `skills/playwright-skill/` 文件夹复制到：
   - 全局：`~/.claude/skills/playwright-skill`
   - 项目：`/path/to/your/project/.claude/skills/playwright-skill`
3. 进入技能目录并运行初始化：
   ```bash
   cd ~/.claude/skills/playwright-skill  # or your project path
   npm run setup
   ```

---

### 验证安装

运行 `/help` 确认技能已加载，然后让 Claude 执行一个简单的浏览器任务，例如“测试 google.com 能否打开”。

## 快速开始

安装完成后，直接让你的智能体测试或自动化某个浏览器任务。它会编写自定义
Playwright 代码、执行代码，并连同截图与控制台输出返回结果。

## 使用示例

### 测试任意页面

```
“测试首页”
“检查联系表单能否正常提交”
“验证注册流程”
```

### 视觉测试

```
“分别在移动端和桌面端给仪表盘截图”
“在不同视口尺寸下测试响应式布局”
```

### 交互测试

```
“填写并提交注册表单”
“依次点击主导航”
“测试搜索功能”
```

### 校验

```
“检查失效链接”
“确认所有图片都能加载”
“测试表单校验”
```

## 工作原理

1. 描述你想测试或自动化的内容
2. 你的智能体为该任务编写自定义 Playwright 代码
3. 通用执行器（run.js）以正确的模块解析方式运行它
4. 打开浏览器（默认可见）并执行自动化
5. 展示结果，包含控制台输出与截图

## 配置

默认设置：

- **Headless：** `false`（除非明确要求，否则浏览器窗口可见）
- **Slow Motion：** 默认 `0ms`；需要时设置 `SLOW_MO`
- **截图：** 辅助函数截图使用系统临时目录；设置 `PW_ARTIFACT_DIR` 可改到其他位置

## 项目结构

```
playwright-skill/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata for distribution
│   └── marketplace.json     # Marketplace configuration
├── skills/
│   └── playwright-skill/    # The actual skill (Claude discovers this)
│       ├── SKILL.md         # What Claude reads
│       ├── run.js           # Universal executor (proper module resolution)
│       ├── package.json     # Dependencies & setup scripts
│       └── lib/
│           └── helpers.js   # Optional utility functions
│       └── API_REFERENCE.md # Full Playwright API reference
├── README.md                # This file - user documentation
├── CONTRIBUTING.md          # Contribution guidelines
└── LICENSE                  # MIT License
```

## 进阶用法

需要关于选择器、网络拦截、身份认证、视觉回归测试、移动端模拟、性能测试与
调试的完整文档时，Claude 会自动加载 `API_REFERENCE.md`。

## 依赖

- Node.js
- Playwright（通过 `npm run setup` 安装）
- Chromium（通过 `npm run setup` 安装）

## 故障排查

**Playwright 未安装？**
进入技能目录运行 `npm run setup`。

**出现 Module not found 错误？**
请确认自动化脚本是通过 `run.js` 运行的，它会处理模块解析。

**浏览器没有打开？**
确认设置了 `headless: false`。除非请求无头模式，本技能默认使用可见浏览器。

**安装全部浏览器？**
在技能目录运行 `npm run install-all-browsers`。

## 什么是 Skill？

[Agent Skills](https://agentskills.io) 是一组包含指令、脚本和资源的文件夹，智能体可以发现并使用它们，从而更准确、更高效地完成事情。当你让 Claude 测试某个网页或自动化浏览器交互时，Claude 会发现本技能、加载必要的指令、编写并执行自定义 Playwright 代码，并连同截图与控制台输出返回结果。

本 Playwright 技能实现了开放的 [Agent Skills 规范](https://agentskills.io)，因此可以跨智能体平台使用。

## 贡献

欢迎贡献。Fork 本仓库、创建特性分支、提交你的改动并发出 pull request。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 延伸阅读

- [Agent Skills Specification](https://agentskills.io) - 智能体技能的开放规范
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Claude Code Plugins Documentation](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [API_REFERENCE.md](skills/playwright-skill/API_REFERENCE.md) - 完整的 Playwright 文档
- [GitHub Issues](https://github.com/lackeyjb/playwright-skill/issues)

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)。
