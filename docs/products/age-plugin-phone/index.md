---
title: age-plugin-phone
slug: /products/age-plugin-phone
sidebar_position: 2
description: 通过手机授权 age 解密的实验性独立插件，以及中英文产品手册入口。
---

# age-plugin-phone

给文件加密时使用公开收件人地址，解密时在手机上逐次确认。age-plugin-phone 将手机的长期解密
密钥保留在手机上，电脑只获得本次获准操作所需的文件密钥。

它通过标准 age 插件接口工作，独立于 Shine；兼容应用使用普通 age 调用即可接入。

:::warning 有限技术测试版
当前手册以 `0.1.0-beta.2` 为基线。协议尚未冻结，仅适合合成或可丢弃的数据，并且需要验证独立
恢复收件人。不要用于保护真实秘密。安装包发布不代表所有设备组合均已验证。
:::

产品仓库维护完整中英文手册：

- [简体中文手册](https://biulight.github.io/age-plugin-phone/zh-Hans/)
- [English manual](https://biulight.github.io/age-plugin-phone/)
- [支持范围与安装条件](https://biulight.github.io/age-plugin-phone/zh-Hans/support)
- [第一次加密与解密](https://biulight.github.io/age-plugin-phone/zh-Hans/quick-start)
- [升级、撤销与恢复](https://biulight.github.io/age-plugin-phone/zh-Hans/guides/recovery)
- [GitHub 仓库](https://github.com/biulight/age-plugin-phone)
- [Beta 2 发布版本](https://github.com/biulight/age-plugin-phone/releases/tag/v0.1.0-beta.2)

Windows 与 Android 提供主要入门路径；macOS 为实验性源码安装，iOS 限已有开发设备群组，不提供
外部安装包。具体硬件、连接方式与已知限制以产品手册为准。

本站保留产品介绍与入口，不维护另一份命令或恢复说明。
