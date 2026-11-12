---
title: Install Neovim
authors: biulight
tags: [Linux, Ubuntu, Neovim]
---

Ubuntu 怎样安装指定版本的 Neovim?

<!--truncate-->

## 背景

Ubuntu 软件源中的 Neovim 版本取决于发行版。若需要与软件源不同的版本，可以从官方 Release 安装。

> 本文保留 `v0.9.5` 的 Linux x86_64 安装示例；其他版本和架构请在 Release 页面确认资产名称。

## 方案一

1. 去 [Github](https://github.com/neovim/neovim/releases) 上查看指定版本的压缩包,并下载

```bash
wget https://github.com/neovim/neovim/releases/download/v0.9.5/nvim-linux64.tar.gz
```

2. 解压缩 `nvim-linux64` 至 `/opt` 目录

```bash
sudo tar -C /opt -xzf nvim-linux64.tar.gz
```

3. add this to your shell config (~/.bashrc, ~/.zshrc, ...):

```bash
export PATH="/opt/nvim-linux64/bin:$PATH"
```

4. reload shell config

```bash
source ~/.bashrc # zsh 用户改为 source ~/.zshrc
nvim --version
```

## 方案二

使用 `snap` 包管理工具安装其稳定通道版本；此方式不会固定到上文的 `v0.9.5`。安装选项见 [Neovim 官方安装说明](https://neovim.io/doc/install/#snap)。

```bash
sudo snap install nvim --classic
```
