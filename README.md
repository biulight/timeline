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

1. 向 `main` 提交 PR，`Check Documentation` 自动执行 `pnpm typecheck` 和 `pnpm build`。
2. 合并后，`Deploy Production` 检查部署配置，再执行相同检查并构建一次。
3. 同一份静态站点产物部署到服务器和 GitHub Pages；两边都成功才算发布成功。Actions 运行摘要记录提交 SHA 和部署结果。

生产工作流只允许 `main`，也可以在 Actions 中选择 `main` 手动启动新的部署。服务器和 Pages 部署前均核对提交是否仍为 `main` 的最新提交；过期运行会失败，避免重跑旧任务覆盖新内容。Artifact 保留两天，到期自动清理。日常预览使用 `pnpm start`，不再提供 dev / uat 部署。

### 部署配置

- `prod` Environment：配置 Secret `ALY_SSH_TOKEN` 和 Variable `DEPLOY_SERVERS`。后者为非空 JSON 数组，例如 `[{"host":"web.example.com","user":"deploy"}]`。
- `github-pages` Environment：允许 `main` 分支部署；仓库 Pages 的构建来源选择 GitHub Actions。
- 服务器：通过 SSH 22 端口同步到 `/var/www/timeline`。同步带有 `--delete`，会清理目标目录内产物中已不存在的文件，目录不得混放其他业务数据。

生产部署不会被新运行取消；同一时间只执行一次生产工作流，等待中的运行可能被更新的运行取代。服务器仍采用原地同步，没有自动回滚；部分部署失败时，检查各节点及 Pages 的结果，排除故障后从当前 `main` 启动新的部署，不要重跑历史发布任务。需要恢复旧内容时，将对应变更回退后经 PR 合入 `main`，由新提交重新部署。

### 从 release 切换到 main

以下切换需在启用新流程时完成，修改本地工作流不会自动更改 GitHub 设置：

1. 暂停向 `release` 合并其他改动，等待旧生产工作流全部结束；旧工作流与新工作流的并发组不同，不能依靠新配置阻止旧部署。切换期间不要重跑历史部署。
2. 将包含本次工作流调整的 `release` 完整提交为目标为 `main` 的 PR，保留尚未同步的文档变更。确认 PR 出现 `Typecheck and build` 检查且通过，再在 `main` 分支保护中将它设为必需检查；保留现有审批要求。
3. 在合并前，将 `github-pages` Environment 的允许部署分支加入 `main`，暂时保留 `release`。同时为 `prod` Environment 设置仅允许 `main` 部署，阻止旧 `release` 工作流继续写入服务器。
4. 合并 PR 后，确认 `main` 的首次服务器和 Pages 部署均成功。工作流成功表示部署操作完成，仍需打开站点检查首页、文档和静态资源；失败时从当前 `main` 启动新的部署。
5. 将仓库默认分支改为 `main`（手动工作流入口和 Renovate 随默认分支切换），移除 Pages 对 `release` 的许可。检查仍以 `release` / `dev` 为目标的开放 PR，再按需清理旧分支和 dev / uat Environment。

不要重跑切换前的历史工作流：它们仍使用旧配置，不具备当前提交检查。旧 `release` 分支即使暂时保留，也不再用于发布。

已有 tag 和 Release 属于历史记录，不需要删除；新流程不再生成这些记录，也不再自动创建回合到 `main` 的 PR。
