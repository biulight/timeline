---
title: Shine
slug: /products/shine
sidebar_position: 1
description: 统一管理常用脚本工具和应用配置，让敏感信息加密保存、按需使用。
---

# Shine

**统一管理常用脚本工具和应用配置，让敏感信息加密保存、按需使用。**

常用脚本和应用配置散落在不同位置，换一台电脑又要重新整理；项目中的密码、访问密钥和敏感文件，
也需要妥善保存。Shine 是在终端中使用的命令行工具，帮你集中管理这些内容，并在运行指定程序时
按需提供敏感信息。

- **安装和维护日常工具与配置。** Preset（预设）把脚本、应用配置和安装规则整理在一起，方便按需
  选择、复用和分享。无需自己写脚本，也能使用内置的代理命令、图片处理工具，以及 Ghostty、Surge、
  Clash Verge Rev 等应用配置。预设依赖的应用或运行环境需要另行安装。安装、更新或卸载前，
  Shine 会先展示计划供你审阅；卸载时默认保留被修改或无法确认由它管理的文件。
- **管理项目环境与加密密钥。** 按开发、生产等环境组织配置，将密码、访问密钥和敏感文件加密保存，
  运行指定命令时再解密提供。需要文件的程序可以使用临时解密文件，程序结束后 Shine 会尝试清理
  本次创建的文件。
- **减少 AI 辅助开发时的明文密钥暴露。** 完成加密并处理原有明文后，项目中可以保留密文，减少
  扫描、复制或提交文件时意外暴露密钥的风险。加密不会自动删除原始明文；能解密或获得密钥的程序
  仍能读取它们，Shine 不提供沙箱隔离。强制终止或断电后，也需要检查临时明文是否残留。

完整产品手册由 Shine 仓库维护，并与产品版本一起发布。按你的目标开始：

- [English documentation（默认）](https://biulight.github.io/shine/)
- [简体中文手册](https://biulight.github.io/shine/zh-Hans/)
- [安装与快速开始](https://biulight.github.io/shine/zh-Hans/quick-start)
- [内置预设](https://biulight.github.io/shine/zh-Hans/reference/built-in-presets)
- [环境变量与密钥](https://biulight.github.io/shine/zh-Hans/guides/environment)
- [在 AI 辅助开发中保护密钥](https://biulight.github.io/shine/zh-Hans/guides/agent-secret-safety)
- [自定义预设](https://biulight.github.io/shine/zh-Hans/guides/custom-presets)
- [GitHub 仓库](https://github.com/biulight/shine)
- [发布版本](https://github.com/biulight/shine/releases)

Biulight 知识库继续提供可跨产品复用的网络、安全和硬件实践，例如
[使用 ZeroTier、CoreDNS 和 Shine 搭建异地私有域名网络](/knowledge/zerotier-coredns-split-dns)与
[在 macOS 和 Windows 使用 YubiKey OpenPGP](/knowledge/yubikey-openpgp)。
