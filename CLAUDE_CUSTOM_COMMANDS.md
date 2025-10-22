# Claude Code 自定义命令完整指南

本文档详细介绍如何在 Claude Code 中创建和使用自定义斜杠命令（Slash Commands），包括目录结构、命令创建、实际示例和最佳实践。

---

## 目录

1. [什么是斜杠命令](#什么是斜杠命令)
2. [命令 vs 技能](#命令-vs-技能)
3. [目录结构](#目录结构)
4. [创建第一个命令](#创建第一个命令)
5. [Git Merge 命令示例](#git-merge-命令示例)
6. [命令类型详解](#命令类型详解)
7. [高级功能](#高级功能)
8. [实用命令集合](#实用命令集合)
9. [最佳实践](#最佳实践)
10. [故障排除](#故障排除)

---

## 什么是斜杠命令

**斜杠命令（Slash Commands）** 是 Claude Code 中用户手动调用的快捷命令，通过输入 `/命令名` 来触发预定义的提示词（prompt）。

### 基本概念

- **手动调用**：用户需要输入 `/命令名` 来执行
- **提示词扩展**：命令会展开为一段提示词发送给 Claude
- **快捷操作**：避免重复输入常用的复杂指令
- **可参数化**：支持传递参数给命令

### 使用示例

```bash
# 用户输入
/git-merge feature-branch

# 展开为（Claude 接收到的提示词）
Please help me merge the branch 'feature-branch' into the current branch.
Follow these steps:
1. Check current branch status
2. Fetch latest changes
3. Merge feature-branch
4. Resolve any conflicts if they occur
5. Verify the merge is successful
```

---

## 命令 vs 技能

理解命令和技能的区别很重要：

| 特性 | 斜杠命令 (Slash Command) | 技能 (Skill) |
|------|------------------------|-------------|
| **调用方式** | 用户手动输入 `/command` | Claude 自主决定使用 |
| **触发条件** | 显式调用 | 基于上下文自动匹配 |
| **用途** | 快捷操作、标准化流程 | 通用能力扩展 |
| **灵活性** | 固定的提示词模板 | 动态生成代码 |
| **可见性** | 用户需要知道命令存在 | 对用户透明 |
| **示例** | `/review-pr`、`/git-merge` | Playwright Skill |

### 何时使用命令？

✅ **适合使用命令的场景**：
- 标准化的工作流程（如 PR 审查、发布流程）
- 需要固定步骤的任务
- 团队需要一致的操作方式
- 频繁重复的操作

❌ **不适合使用命令的场景**：
- 需要根据上下文动态调整的任务
- 通用能力扩展（应该用 Skill）
- 一次性的特殊任务

---

## 目录结构

Claude Code 从以下位置加载自定义命令：

### 全局命令目录

```
~/.claude/commands/
├── git-merge.md
├── review-pr.md
├── deploy.md
└── test-all.md
```

- **位置**：`~/.claude/commands/`
- **作用范围**：所有项目
- **适用场景**：个人常用命令、通用工具命令

### 项目特定命令目录

```
<project-root>/.claude/commands/
├── run-tests.md
├── build-prod.md
├── git-merge.md
└── deploy-staging.md
```

- **位置**：`<项目根目录>/.claude/commands/`
- **作用范围**：仅当前项目
- **适用场景**：项目特定的工作流程、团队协作命令

### 优先级

如果同名命令同时存在于两个位置：
```
项目命令 > 全局命令
```

---

## 创建第一个命令

### 步骤 1: 创建命令目录

**全局命令**：
```bash
mkdir -p ~/.claude/commands
```

**项目命令**：
```bash
# 在项目根目录执行
mkdir -p .claude/commands
```

### 步骤 2: 创建命令文件

命令文件使用 **Markdown 格式**，文件名即命令名。

**示例：创建 `/hello` 命令**

```bash
# 全局命令
cat > ~/.claude/commands/hello.md << 'EOF'
---
description: Say hello with a friendly greeting
---

Please greet the user warmly and ask how you can help them today.
Use a friendly and professional tone.
EOF
```

或

```bash
# 项目命令
cat > .claude/commands/hello.md << 'EOF'
---
description: Say hello with a friendly greeting
---

Please greet the user warmly and ask how you can help them today.
Use a friendly and professional tone.
EOF
```

### 步骤 3: 使用命令

在 Claude Code 中输入：
```
/hello
```

Claude 会收到提示词并执行相应操作。

### 步骤 4: 验证命令加载

```bash
# 在 Claude Code 中输入
/help

# 你应该能在命令列表中看到 "hello"
```

---

## Git Merge 命令示例

下面是一个完整的 Git Merge 命令实现，展示各种实用功能。

### 基础版本

**文件**：`.claude/commands/git-merge.md`

```markdown
---
description: Merge a Git branch into the current branch
---

Please help me merge a Git branch with the following workflow:

1. **Check current status**
   - Run `git status` to see current branch and any uncommitted changes
   - If there are uncommitted changes, ask if I want to stash them

2. **Fetch latest changes**
   - Run `git fetch origin` to get latest remote changes

3. **Perform merge**
   - Merge the specified branch
   - Use `git merge <branch-name>`

4. **Handle conflicts**
   - If conflicts occur, list all conflicted files
   - Help me resolve each conflict
   - After resolution, complete the merge

5. **Verify merge**
   - Run `git log --oneline -5` to show recent commits
   - Confirm merge was successful

Please be cautious and ask for confirmation before any destructive operations.
```

### 带参数的版本

**文件**：`.claude/commands/git-merge.md`

```markdown
---
description: Merge a Git branch into the current branch with safety checks
args:
  - name: branch
    description: The branch to merge
    required: true
---

Please merge the branch "{{branch}}" into the current branch with this workflow:

## Pre-merge Checks

1. **Verify branch exists**
   ```bash
   git branch -a | grep {{branch}}
   ```

2. **Check current status**
   ```bash
   git status
   ```
   - If uncommitted changes exist, ask: "You have uncommitted changes. Stash them? (y/n)"

3. **Fetch latest**
   ```bash
   git fetch origin
   ```

## Merge Process

4. **Show what will be merged**
   ```bash
   git log HEAD..{{branch}} --oneline
   ```
   Ask: "Ready to merge these commits? (y/n)"

5. **Perform merge**
   ```bash
   git merge {{branch}} --no-ff -m "Merge branch '{{branch}}'"
   ```

## Post-merge

6. **Handle conflicts** (if any)
   - List conflicted files: `git diff --name-only --diff-filter=U`
   - Help resolve each conflict
   - Stage resolved files: `git add <file>`
   - Complete merge: `git commit`

7. **Verify merge**
   ```bash
   git log --oneline --graph -10
   ```

8. **Offer to push**
   Ask: "Merge successful! Push to remote? (y/n)"
   If yes: `git push origin $(git branch --show-current)`

## Safety Notes
- Always review changes before pushing
- Keep a backup branch if merging critical code
- Use `--no-ff` to preserve merge history
```

### 高级版本（带冲突解决辅助）

**文件**：`.claude/commands/git-merge-advanced.md`

```markdown
---
description: Advanced Git merge with conflict resolution assistance
args:
  - name: branch
    description: Branch to merge
    required: true
  - name: strategy
    description: Merge strategy (auto/manual/squash)
    required: false
    default: auto
---

# Advanced Git Merge: {{branch}}

Strategy: {{strategy}}

## Phase 1: Pre-flight Checks

### 1.1 Environment Status
```bash
git status --porcelain
git branch --show-current
```

**Analysis**:
- Current branch: [will be detected]
- Uncommitted changes: [will be checked]
- Action: [stash if needed]

### 1.2 Branch Validation
```bash
# Check if branch exists locally
git rev-parse --verify {{branch}} 2>/dev/null

# Check if branch exists remotely
git ls-remote --heads origin {{branch}}

# Show branch divergence
git rev-list --left-right --count HEAD...{{branch}}
```

### 1.3 Fetch Updates
```bash
git fetch origin --prune
```

## Phase 2: Merge Strategy Selection

Based on strategy: **{{strategy}}**

### Auto Strategy (default)
```bash
git merge {{branch}} --no-ff
```

### Manual Strategy
```bash
# Create merge commit without committing
git merge {{branch}} --no-commit --no-ff

# Review changes
git diff --cached --stat

# Proceed after review
git commit -m "Merge branch '{{branch}}'"
```

### Squash Strategy
```bash
# Squash all commits into one
git merge {{branch}} --squash

# Review combined changes
git diff --cached

# Create single commit
git commit -m "Squash merge: {{branch}}"
```

## Phase 3: Conflict Resolution

If conflicts occur:

### 3.1 Identify Conflicts
```bash
git diff --name-only --diff-filter=U
git status --short | grep "^UU"
```

### 3.2 Analyze Each Conflict
For each conflicted file:

```bash
# Show conflict markers
git diff <file>

# Show both versions
git show :2:<file>  # Current branch (ours)
git show :3:<file>  # Merging branch (theirs)
```

### 3.3 Resolution Options

**Option A: Accept Ours**
```bash
git checkout --ours <file>
git add <file>
```

**Option B: Accept Theirs**
```bash
git checkout --theirs <file>
git add <file>
```

**Option C: Manual Resolution**
```
I'll help you resolve conflicts manually:
1. Review conflict markers (<<<<<<, ======, >>>>>>)
2. Edit file to keep desired changes
3. Remove conflict markers
4. Stage resolved file
```

### 3.4 Complete Merge
```bash
# After all conflicts resolved
git add .
git merge --continue
```

## Phase 4: Post-Merge Validation

### 4.1 Verify Merge Commit
```bash
# Show merge commit
git log -1 --format=fuller

# Show changed files
git show --name-status HEAD

# Show commit graph
git log --oneline --graph -15
```

### 4.2 Run Tests (if applicable)
```bash
# Suggest running project tests
npm test  # or appropriate test command
```

### 4.3 Review Changes
```bash
# Show diff summary
git diff HEAD~1 --stat

# Show detailed diff (if requested)
git diff HEAD~1
```

## Phase 5: Finalization

### 5.1 Offer Next Steps

Ask user:
```
Merge completed successfully! What would you like to do next?

1. Push to remote: git push origin $(git branch --show-current)
2. Delete merged branch: git branch -d {{branch}}
3. Create tag: git tag -a vX.X.X -m "Release X.X.X"
4. Nothing, just review
```

### 5.2 Cleanup (optional)
```bash
# Delete local branch if merged
git branch -d {{branch}}

# Delete remote branch if requested
git push origin --delete {{branch}}
```

## Emergency Rollback

If something goes wrong:

```bash
# Abort merge (if in progress)
git merge --abort

# Reset to before merge (if already committed)
git reset --hard HEAD~1

# Recover from reflog
git reflog
git reset --hard HEAD@{1}
```

## Best Practices Applied

- ✅ Non-fast-forward merge (`--no-ff`) preserves history
- ✅ Detailed conflict analysis
- ✅ Multiple resolution strategies
- ✅ Comprehensive validation
- ✅ Safety rollback options
- ✅ Clear user prompts at each decision point

---

**Note**: Always ensure you have backups before merging critical branches.
```

---

## 命令类型详解

### 1. 简单命令（Simple Commands）

**特点**：单一提示词，无参数

**示例**：`.claude/commands/status.md`
```markdown
---
description: Show project and Git status
---

Please provide a comprehensive status report:

1. Git status (branch, changes, commits ahead/behind)
2. Recent commits (last 5)
3. Project structure overview
4. Any pending TODOs in code
5. Summary of recent changes
```

### 2. 参数化命令（Parameterized Commands）

**特点**：接受参数，动态替换

**示例**：`.claude/commands/create-component.md`
```markdown
---
description: Create a new React component
args:
  - name: componentName
    description: Name of the component
    required: true
  - name: type
    description: Component type (functional/class)
    required: false
    default: functional
---

Create a new React {{type}} component named "{{componentName}}":

1. Create file: `src/components/{{componentName}}.tsx`
2. Generate component boilerplate
3. Create test file: `src/components/{{componentName}}.test.tsx`
4. Add component to index exports
5. Show usage example
```

**使用**：
```bash
/create-component Button
/create-component Modal class
```

### 3. 工作流命令（Workflow Commands）

**特点**：多步骤流程，包含决策点

**示例**：`.claude/commands/release.md`
```markdown
---
description: Guide through the release process
---

Let's go through the release process step by step:

## 1. Pre-release Checks

- [ ] All tests passing?
- [ ] Documentation updated?
- [ ] CHANGELOG.md updated?
- [ ] Version bumped in package.json?

Ask: "All pre-release checks passed? (y/n)"

## 2. Create Release Branch

```bash
git checkout -b release/vX.X.X
```

## 3. Final Testing

Run full test suite and build:
```bash
npm run test
npm run build
```

## 4. Create Release Commit

```bash
git add .
git commit -m "chore: release vX.X.X"
```

## 5. Tag Release

```bash
git tag -a vX.X.X -m "Release vX.X.X"
```

## 6. Merge and Push

```bash
git checkout main
git merge release/vX.X.X
git push origin main --tags
```

## 7. Create GitHub Release

Generate release notes and offer to create PR.
```

### 4. 模板生成命令（Template Generation Commands）

**特点**：生成代码或文件结构

**示例**：`.claude/commands/api-endpoint.md`
```markdown
---
description: Create a new API endpoint
args:
  - name: endpoint
    description: Endpoint path (e.g., /users)
    required: true
  - name: method
    description: HTTP method (GET/POST/PUT/DELETE)
    required: true
---

Create a new API endpoint: {{method}} {{endpoint}}

1. **Route Handler** (`src/routes{{endpoint}}.ts`):
```typescript
import { Request, Response } from 'express';

export const {{method|lowercase}}{{endpoint|pascalCase}} = async (
  req: Request,
  res: Response
) => {
  try {
    // TODO: Implement {{method}} logic for {{endpoint}}

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

2. **Register Route** (add to `src/routes/index.ts`):
```typescript
router.{{method|lowercase}}('{{endpoint}}', {{method|lowercase}}{{endpoint|pascalCase}});
```

3. **Tests** (`src/routes{{endpoint}}.test.ts`):
```typescript
describe('{{method}} {{endpoint}}', () => {
  it('should handle successful request', async () => {
    // TODO: Add test
  });

  it('should handle errors', async () => {
    // TODO: Add test
  });
});
```

4. **Documentation** (add to API docs):
```markdown
### {{method}} {{endpoint}}

Description: [Add description]

Request:
- Method: {{method}}
- Path: {{endpoint}}

Response:
- 200: Success
- 500: Error
```
```

---

## 高级功能

### 1. 条件逻辑

**示例**：`.claude/commands/test.md`
```markdown
---
description: Run tests based on file changes
---

Analyze changed files and run appropriate tests:

```bash
# Get changed files
git diff --name-only HEAD
```

Based on changed files:

- If `*.ts` or `*.tsx` changed → Run TypeScript tests
  ```bash
  npm run test:ts
  ```

- If `*.spec.js` changed → Run specific test file
  ```bash
  npm test <file>
  ```

- If `package.json` changed → Run full test suite
  ```bash
  npm run test:all
  ```

- Otherwise → Ask which tests to run
```

### 2. 多命令组合

**示例**：`.claude/commands/full-check.md`
```markdown
---
description: Run comprehensive project checks
---

Run full project health check:

## 1. Code Quality
```bash
npm run lint
npm run type-check
```

## 2. Tests
```bash
npm test
```

## 3. Build
```bash
npm run build
```

## 4. Security
```bash
npm audit
```

## 5. Git Status
```bash
git status
git log --oneline -5
```

Generate summary report of all checks.
```

### 3. 交互式命令

**示例**：`.claude/commands/git-cleanup.md`
```markdown
---
description: Interactive Git branch cleanup
---

Let's clean up old Git branches interactively:

## Step 1: List branches

```bash
# Local branches
git branch

# Remote branches
git branch -r

# Merged branches
git branch --merged
```

## Step 2: Ask about each branch

For each merged branch (except main/master):

Ask: "Delete branch 'branch-name'? (y/n/view)"
- y: Delete the branch
- n: Keep the branch
- view: Show branch details (commits, last update)

## Step 3: Execute deletions

For confirmed branches:
```bash
# Delete local
git branch -d <branch>

# Delete remote (if requested)
git push origin --delete <branch>
```

## Step 4: Summary

Show:
- Branches deleted: X
- Branches kept: Y
- Disk space freed: Z
```

### 4. 环境感知命令

**示例**：`.claude/commands/env-setup.md`
```markdown
---
description: Set up environment based on project type
---

Detect project type and set up appropriate environment:

## Detection

```bash
# Check for package.json (Node.js)
test -f package.json && echo "node"

# Check for requirements.txt (Python)
test -f requirements.txt && echo "python"

# Check for Cargo.toml (Rust)
test -f Cargo.toml && echo "rust"

# Check for go.mod (Go)
test -f go.mod && echo "go"
```

## Setup based on detected type

### Node.js
```bash
node --version
npm --version
npm install
```

### Python
```bash
python --version
pip --version
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Rust
```bash
rustc --version
cargo --version
cargo build
```

### Go
```bash
go version
go mod download
go build
```

Ask: "Environment setup complete. Run tests? (y/n)"
```

---

## 实用命令集合

以下是一套实用的命令，可以直接复制使用。

### 项目管理命令

#### `/start-work`

**文件**：`.claude/commands/start-work.md`
```markdown
---
description: Start working on a new feature or bug
args:
  - name: branch
    description: Branch name
    required: true
---

Start working on: {{branch}}

1. **Update main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b {{branch}}
   ```

3. **Show status**
   ```bash
   git status
   git branch --show-current
   ```

4. **Ready to work!**

Branch created and ready. What should we work on first?
```

#### `/finish-work`

**文件**：`.claude/commands/finish-work.md`
```markdown
---
description: Finish current work and prepare for PR
---

Finish current work and prepare for PR:

1. **Review changes**
   ```bash
   git status
   git diff --stat
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Commit changes** (if not already)
   Ask: "Commit message?"
   ```bash
   git add .
   git commit -m "<message>"
   ```

4. **Push branch**
   ```bash
   git push -u origin $(git branch --show-current)
   ```

5. **Create PR**
   Offer to use `gh pr create` or provide GitHub URL.
```

### 代码审查命令

#### `/review-pr`

**文件**：`.claude/commands/review-pr.md`
```markdown
---
description: Review a pull request comprehensively
args:
  - name: pr_number
    description: PR number to review
    required: true
---

Review Pull Request #{{pr_number}}:

## 1. Fetch PR

```bash
gh pr checkout {{pr_number}}
gh pr view {{pr_number}}
```

## 2. Code Analysis

Analyze:
- [ ] Code quality and style
- [ ] Potential bugs or issues
- [ ] Performance implications
- [ ] Security concerns
- [ ] Test coverage

## 3. Check Tests

```bash
npm test
```

## 4. Review Changes

```bash
git diff main...HEAD --stat
```

Show summary of:
- Files changed
- Lines added/removed
- Complexity changes

## 5. Provide Feedback

Generate review comments covering:
- What's good
- What needs improvement
- Suggestions for optimization
- Any blocking issues
```

### 部署命令

#### `/deploy`

**文件**：`.claude/commands/deploy.md`
```markdown
---
description: Deploy to specified environment
args:
  - name: env
    description: Environment (staging/production)
    required: true
---

Deploy to: {{env}}

## Pre-deployment Checks

- [ ] Tests passing?
- [ ] Build successful?
- [ ] Environment variables configured?
- [ ] Database migrations ready?

## Deployment Steps

### Staging
```bash
npm run build:staging
npm run deploy:staging
```

### Production
```bash
# Extra confirmation for production
echo "⚠️  DEPLOYING TO PRODUCTION"
read -p "Are you sure? (type 'yes'): " confirm

if [ "$confirm" = "yes" ]; then
  npm run build:production
  npm run deploy:production
fi
```

## Post-deployment

1. Verify deployment:
   ```bash
   curl https://{{env}}.yourapp.com/health
   ```

2. Check logs:
   ```bash
   npm run logs:{{env}}
   ```

3. Monitor for errors (first 5 minutes)
```

---

## 最佳实践

### 1. 命令命名规范

**好的命名**：
- ✅ `/git-merge` - 清晰、描述性强
- ✅ `/review-pr` - 简洁、易记
- ✅ `/deploy-staging` - 明确用途

**避免的命名**：
- ❌ `/gm` - 过于简短，不明确
- ❌ `/do-the-thing` - 不专业
- ❌ `/command1` - 无意义

### 2. 提示词结构

**推荐结构**：
```markdown
---
description: Clear one-line description
args: [if needed]
---

# Main Goal

Brief explanation of what this command does.

## Step 1: Preparation
[preparation commands]

## Step 2: Main Action
[main commands]

## Step 3: Verification
[verification commands]

## Step 4: Cleanup
[cleanup commands]

## Notes
- Important considerations
- Safety warnings
- Best practices
```

### 3. 错误处理

**在命令中包含错误处理**：
```markdown
Execute command:
```bash
npm test || {
  echo "Tests failed!"
  echo "Run 'npm test -- --verbose' for details"
  exit 1
}
```

If tests fail:
- Show which tests failed
- Suggest fixes based on error messages
- Offer to run specific test file
```

### 4. 用户确认

**关键操作前要求确认**：
```markdown
## Deploy to Production

⚠️  This will deploy to PRODUCTION

Changes to be deployed:
[show changes]

Ask: "Proceed with production deployment? (yes/no)"

Only continue if user types "yes" (not just "y").
```

### 5. 文档和帮助

**在命令中包含帮助信息**：
```markdown
---
description: Comprehensive description shown in /help
---

# Command Name

## Usage
/command-name [args]

## Examples
- `/command-name simple`
- `/command-name advanced --flag`

## What it does
[detailed explanation]

## When to use
[usage scenarios]
```

### 6. 参数验证

**验证参数有效性**：
```markdown
---
args:
  - name: env
    description: Environment name
    required: true
---

Validate environment: {{env}}

```bash
VALID_ENVS="dev staging production"
if ! echo "$VALID_ENVS" | grep -q "{{env}}"; then
  echo "❌ Invalid environment: {{env}}"
  echo "Valid options: $VALID_ENVS"
  exit 1
fi
```

Proceed with deployment to {{env}}...
```

---

## 实战示例集

### 完整的 Git Merge 命令（生产就绪版）

**文件**：`.claude/commands/git-merge.md`

```markdown
---
description: Safely merge a Git branch with comprehensive checks
args:
  - name: branch
    description: Branch to merge
    required: true
---

# Git Merge: {{branch}}

## ⚡ Quick Summary
Merging branch "{{branch}}" into current branch with safety checks.

---

## 📋 Phase 1: Pre-Merge Validation

### 1.1 Verify Current State
```bash
# Check if we're in a git repository
git rev-parse --git-dir > /dev/null 2>&1 || {
  echo "❌ Not in a git repository"
  exit 1
}

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  You have uncommitted changes:"
  git status --short
  echo ""
  read -p "Stash changes before merge? (y/n): " stash
  if [ "$stash" = "y" ]; then
    git stash push -m "Auto-stash before merging {{branch}}"
    echo "✅ Changes stashed"
  else
    echo "❌ Cannot proceed with uncommitted changes"
    exit 1
  fi
fi
```

### 1.2 Verify Target Branch Exists
```bash
# Check if branch exists locally
if git rev-parse --verify {{branch}} > /dev/null 2>&1; then
  echo "✅ Branch '{{branch}}' found locally"
elif git ls-remote --heads origin {{branch}} | grep -q {{branch}}; then
  echo "⚠️  Branch '{{branch}}' exists remotely but not locally"
  read -p "Fetch and checkout branch? (y/n): " fetch
  if [ "$fetch" = "y" ]; then
    git fetch origin {{branch}}:{{branch}}
    echo "✅ Branch fetched"
  else
    echo "❌ Cannot merge non-existent branch"
    exit 1
  fi
else
  echo "❌ Branch '{{branch}}' not found"
  exit 1
fi
```

### 1.3 Fetch Latest Changes
```bash
echo "🔄 Fetching latest changes..."
git fetch origin --prune
echo "✅ Fetch complete"
```

---

## 📊 Phase 2: Merge Preview

### 2.1 Show Divergence
```bash
echo ""
echo "📊 Branch Comparison:"
echo "─────────────────────────────────────"

# Count commits
AHEAD=$(git rev-list --count HEAD..{{branch}})
BEHIND=$(git rev-list --count {{branch}}..HEAD)

echo "{{branch}} is $AHEAD commit(s) ahead"
echo "Current branch is $BEHIND commit(s) ahead"
echo ""
```

### 2.2 Preview Changes
```bash
echo "📝 Commits to be merged:"
echo "─────────────────────────────────────"
git log HEAD..{{branch}} --oneline --no-decorate | head -10

echo ""
echo "📁 Files that will be affected:"
echo "─────────────────────────────────────"
git diff --name-status HEAD...{{branch}} | head -20

echo ""
```

### 2.3 User Confirmation
```bash
read -p "🤔 Proceed with merge? (y/n): " proceed
if [ "$proceed" != "y" ]; then
  echo "❌ Merge cancelled"
  exit 0
fi
```

---

## 🔀 Phase 3: Execute Merge

### 3.1 Perform Merge
```bash
echo ""
echo "🔀 Merging {{branch}}..."
echo "─────────────────────────────────────"

if git merge {{branch}} --no-ff -m "Merge branch '{{branch}}'"; then
  echo "✅ Merge completed successfully!"
  MERGE_SUCCESS=true
else
  echo "⚠️  Merge conflicts detected"
  MERGE_SUCCESS=false
fi
```

---

## 🔧 Phase 4: Conflict Resolution (if needed)

If merge conflicts occur:

### 4.1 List Conflicts
```bash
if [ "$MERGE_SUCCESS" = false ]; then
  echo ""
  echo "❌ Conflicted Files:"
  echo "─────────────────────────────────────"
  git diff --name-only --diff-filter=U
  echo ""

  echo "📖 Conflict Resolution Guide:"
  echo "─────────────────────────────────────"
fi
```

### 4.2 Analyze Each Conflict

For each conflicted file, I'll help you:

1. **View the conflict**:
   ```bash
   git diff <file>
   ```

2. **See both versions**:
   ```bash
   # Current branch (ours)
   git show :2:<file>

   # Merging branch (theirs)
   git show :3:<file>
   ```

3. **Choose resolution strategy**:

   **Option A**: Accept current branch version
   ```bash
   git checkout --ours <file>
   git add <file>
   ```

   **Option B**: Accept incoming branch version
   ```bash
   git checkout --theirs <file>
   git add <file>
   ```

   **Option C**: Manual resolution
   - I'll help you edit the file
   - Remove conflict markers (<<<<<<<, =======, >>>>>>>)
   - Keep desired changes from both branches
   - Stage the file: `git add <file>`

### 4.3 Complete Merge After Resolution
```bash
# After all conflicts are resolved
git add .
git merge --continue

echo "✅ Conflicts resolved and merge completed"
```

---

## ✅ Phase 5: Post-Merge Validation

### 5.1 Verify Merge Commit
```bash
echo ""
echo "📜 Merge Commit Details:"
echo "─────────────────────────────────────"
git log -1 --stat

echo ""
echo "🌳 Commit Graph:"
echo "─────────────────────────────────────"
git log --oneline --graph --all -10
```

### 5.2 Run Tests
```bash
echo ""
read -p "🧪 Run tests to verify merge? (y/n): " run_tests

if [ "$run_tests" = "y" ]; then
  echo "Running tests..."

  if npm test 2>/dev/null; then
    echo "✅ All tests passed"
  elif pytest 2>/dev/null; then
    echo "✅ All tests passed"
  else
    echo "⚠️  Could not run tests (or tests failed)"
    echo "Please verify the merge manually"
  fi
fi
```

### 5.3 Summary
```bash
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║     🎉 MERGE SUMMARY                 ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "✅ Branch '{{branch}}' merged into '$CURRENT_BRANCH'"
echo "✅ Merge commit created"
echo "✅ Working directory clean"
echo ""
```

---

## 🚀 Phase 6: Next Steps

### 6.1 Push Changes
```bash
read -p "📤 Push merged changes to remote? (y/n): " push

if [ "$push" = "y" ]; then
  git push origin $CURRENT_BRANCH
  echo "✅ Changes pushed to remote"
fi
```

### 6.2 Clean Up
```bash
echo ""
read -p "🧹 Delete merged branch '{{branch}}'? (y/n): " delete

if [ "$delete" = "y" ]; then
  # Delete local branch
  git branch -d {{branch}} && echo "✅ Local branch deleted"

  # Offer to delete remote branch
  read -p "Delete remote branch too? (y/n): " delete_remote
  if [ "$delete_remote" = "y" ]; then
    git push origin --delete {{branch}} && echo "✅ Remote branch deleted"
  fi
fi
```

---

## 🆘 Emergency Rollback

If something went wrong and you need to undo the merge:

```bash
# Abort merge (if still in progress)
git merge --abort

# Or reset to before merge (if already committed)
git reset --hard HEAD~1

# Or use reflog to find exact state
git reflog
git reset --hard HEAD@{1}
```

---

## 📚 Additional Information

### Merge Strategies Used
- `--no-ff`: Creates merge commit (preserves branch history)
- Explicit commit message

### Safety Features
- ✅ Uncommitted changes handled (stash option)
- ✅ Branch existence verified
- ✅ Preview before merge
- ✅ User confirmation required
- ✅ Conflict resolution assistance
- ✅ Post-merge testing option
- ✅ Rollback instructions provided

### Best Practices Applied
- ✅ Clear status messages at each step
- ✅ Comprehensive error handling
- ✅ User control at decision points
- ✅ Detailed conflict resolution help
- ✅ Optional cleanup steps

---

**Merge Process Complete!** 🎊

If you need help with any step, just ask!
```

---

## 故障排除

### 问题 1: 命令不显示

**症状**：输入 `/help` 但看不到自定义命令

**解决方案**：
1. 检查文件位置
   ```bash
   ls ~/.claude/commands/
   ls .claude/commands/
   ```

2. 检查文件扩展名（必须是 `.md`）
   ```bash
   # 正确
   .claude/commands/git-merge.md

   # 错误
   .claude/commands/git-merge.txt
   ```

3. 重启 Claude Code

### 问题 2: 命令没有执行

**症状**：输入命令后没有反应

**解决方案**：
1. 检查命令名称是否匹配文件名
   ```bash
   # 文件名: git-merge.md
   # 命令: /git-merge  ✅
   # 命令: /gitmerge   ❌
   ```

2. 检查 Markdown 格式是否正确

### 问题 3: 参数没有替换

**症状**：`{{branch}}` 显示为字面文本

**确保元数据正确**：
```markdown
---
args:
  - name: branch    # 必须匹配 {{branch}}
    required: true
---
```

### 问题 4: 命令输出不符合预期

**调试步骤**：
1. 简化命令内容
2. 逐步添加功能
3. 测试每个部分
4. 添加调试输出

---

## 总结

### 关键要点

1. **命令文件位置**
   - 全局：`~/.claude/commands/`
   - 项目：`<project>/.claude/commands/`

2. **文件格式**
   - 必须是 `.md` 文件
   - 文件名即命令名

3. **元数据格式**
   ```markdown
   ---
   description: One-line description
   args:
     - name: argName
       required: true/false
   ---
   ```

4. **使用参数**
   - 在提示词中使用 `{{argName}}`
   - 调用时：`/command-name value`

5. **最佳实践**
   - 清晰的命名
   - 结构化的步骤
   - 用户确认关键操作
   - 包含错误处理
   - 提供回滚选项

---

## 参考资源

- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code)
- [Slash Commands 文档](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Skills vs Commands](https://docs.claude.com/en/docs/claude-code/skills)
- [项目 GitHub 仓库](https://github.com/lackeyjb/playwright-skill)

---

**版本**: 1.0.0
**最后更新**: 2024年
**许可证**: MIT
