---
title: Install Neovim
authors: biulight
tags: [Linux, Ubuntu, Neovim]
---

Ubuntu 怎样安装指定版本的 Neovim?

<!--truncate-->

## 背景

由于 apt 中只有 Neovim(v0.72)的安装包。想使用新版需要自己安装

> 以 `v0.9.5` 版本为例

## 方案一

1. 去 [Github](https://github.com/neovim/neovim/releases) 上查看指定版本的压缩包,并下载

```bash
sudo wget https://github.com/neovim/neovim/releases/download/v0.9.5/nvim-linux64.tar.gz
```

2. 解压缩 `nvim-linux64` 至 `/opt` 目录

```bash
sudo tar -C /opt -xzf nvim-linux64.tar.gz
```

3. add this to your shell config (~/.bashrc, ~/.zshrc, ...):

```bash
export PATH="$PATH:/opt/nvim-linux64/bin"
```

4. reload shell config

```bash
source ~/.bashrc
```

## 方案二

使用 `snap` 包管理工具安装

```bash
sudo snap install nvim --classisc
```
