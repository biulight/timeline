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
