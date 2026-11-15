# Biulight 文档

本仓库维护 Biulight 项目的公开产品入口、实践指南与持续沉淀的知识，并使用 [Docusaurus](https://docusaurus.io/) 构建和发布。

访问线上站点：[blog.biulight.top/timeline](https://blog.biulight.top/timeline/)

## 内容结构

- `docs/products/`：产品入口与旧链接兼容页；已迁移的完整手册由产品仓库维护。
- `docs/knowledge/`：可跨项目复用的通用知识。
- `docs/developing/`：开发实践与文档维护说明。
- `docs/learning/`：个人学习记录。
- `blog/`：按时间发布的文章。

## 本地运行

需要准备以下环境：

- Node.js 22 或更高版本
- pnpm 11 或更高版本

`pnpm` 11 的最低支持 Node 版本为 22，因此本仓库统一按 Node.js 22+ 作为本地开发前提。

安装依赖并启动本地开发服务器：

```bash
pnpm install
pnpm start
```

生成生产构建：

```bash
pnpm build
```

修改 React、TypeScript、导航或主题代码后，还需要执行类型检查：

```bash
pnpm typecheck
```

## 维护文档

产品仓库是行为、命令、配置、兼容性和版本信息的事实来源；已迁移的中英文用户手册也由产品仓库维护，本仓库负责产品入口、通用知识和博客。不要根据 issue、计划或 TODO 推测尚未发布的行为，也不要机械复制产品 README。

更完整的内容分类和更新流程见[文档维护指南](docs/developing/documentation.md)，AI 协作约束见 [AGENTS.md](AGENTS.md)。

## 站点发布

站点以 Git 提交为发布记录，不维护站点版本号，也不自动创建 tag 或 GitHub Release。

仓库保留两个长期分支：`dev` 汇集待发布改动，`main` 保存已进入生产发布流程的内容。仓库默认分支仍为 `main`，开发 PR 需要明确选择 `dev` 为目标。

1. 从 `dev` 创建短期工作分支，将文档修改、功能调整或依赖升级提交为目标为 `dev` 的 PR。Renovate 也向 `dev` 提交依赖更新。
2. 指向 `dev` 或 `main` 的 PR 都由 `Check Documentation` 执行 `pnpm typecheck` 和 `pnpm build`。合入 `dev` 不触发生产部署。
3. 准备发布时，创建 `dev` → `main` 的 PR，检查通过并满足审批要求后，以 merge commit 合并，保留两个长期分支的共同历史。
4. 合入 `main` 后，`Deploy Production` 检查部署配置，再执行相同检查并构建一次。同一份静态站点产物部署到 `blog.biulight.top` 对应的服务器和 GitHub Pages；两边都成功才算发布成功。Actions 运行摘要记录提交 SHA 和部署结果。
5. 发布成功后，创建 `main` → `dev` 的同步 PR。等待 `Typecheck and build` 通过，再以 merge commit 合并；即使没有新的开发内容，也通过 PR 同步发布合并提交，不直接快进推送到受保护的 `dev`。如果 `main` 已被 `dev` 完整包含，则无需重复创建同步 PR。

生产工作流只允许 `main`，也可以在 Actions 中选择 `main` 手动启动新的部署。服务器和 Pages 部署前均核对提交是否仍为 `main` 的最新提交；过期运行会失败，避免重跑旧任务覆盖新内容。Artifact 保留两天，到期自动清理。日常预览使用 `pnpm start`，不再提供 dev / uat 部署。

### 部署配置

当前部署目标为 [blog.biulight.top/timeline](https://blog.biulight.top/timeline/) 和 [GitHub Pages](https://biulight.github.io/timeline/)。`blog.biulight.cn` 对应的旧服务器已停止接收部署；保留其已有站点文件和 Nginx 配置。

- `prod` Environment：配置 Secret `ALY_SSH_TOKEN` 和 Variable `DEPLOY_SERVERS`。后者保留 JSON 数组格式，但当前只配置 `.top` 对应的一台服务器，例如 `[{"host":"web.example.com","user":"deploy"}]`，不要加入已停用的 `.cn` 节点。工作流按此清单生成服务器部署任务。
- `ALY_SSH_TOKEN` 是沿用的 Secret 名称，当前用于 `.top` 服务器的 SSH 部署，不代表仍向旧服务器发布；无需因部署目标调整而改名。
- `github-pages` Environment：允许 `main` 分支部署；仓库 Pages 的构建来源选择 GitHub Actions。
- 服务器：通过 SSH 22 端口同步到 `/var/www/timeline`。同步带有 `--delete`，会清理目标目录内产物中已不存在的文件，目录不得混放其他业务数据。

生产部署不会被新运行取消；同一时间只执行一次生产工作流，等待中的运行可能被更新的运行取代。服务器仍采用原地同步，没有自动回滚；部分部署失败时，检查 `.top` 服务器及 Pages 的结果，排除故障后从当前 `main` 启动新的部署，不要重跑历史发布任务。需要恢复旧内容时，将对应变更回退后经 PR 合入 `main`，由新提交重新部署。

### 分支维护

`dev` 和 `main` 都通过 PR 接收改动，并启用 `Typecheck and build` 必需检查；`main` 保留生产发布的审批要求。仓库只允许 merge commit 合并，已关闭 squash 和 rebase merge，避免长期分支同步时丢失共同历史。日常只删除已合并的短期工作分支，不删除 `dev`。旧 `release` 分支已退出工作流，不再保留独立发布职责。

紧急修复如绕过 `dev` 先通过 PR 合入 `main`，发布后也要通过 `main` → `dev` PR 同步，避免后续发布遗漏修复。恢复旧内容时同样通过新提交回退，不移动已发布的分支历史。

已有 tag 和 Release 属于历史记录，不需要删除；当前流程不再生成这些记录，也不会自动创建跨分支回合 PR。不要重跑分支切换前的历史部署工作流，它们仍使用旧配置。
