---
title: "Obsidian-01- 开启 Vim 模式"
id: 10
sidebar_position: 10
---

# 在 Obsidian 中开启 Vim 模式

在桌面版 Obsidian 的编辑区启用 Vim 按键，可以用模式切换和组合动作编辑笔记，无需安装社区插件。

## 操作

1. 准备一篇可丢弃的练习笔记，避免直接修改重要内容。
2. 打开 **设置 → 编辑器 → Vim 键绑定（Vim key bindings）** 并启用。
3. 回到笔记的编辑视图，按 `Esc`，再按 `i` 输入文字；再次按 `Esc` 后用 `h`、`j`、`k`、`l` 移动。

完成标志是：Normal 模式下按 `j` 不再输入字母，而是移动光标；Insert 模式可以正常输入。

## 遇到问题

- 按键没有编辑效果时，先确认焦点在笔记编辑区，而不是阅读视图、搜索框或侧栏。
- 想恢复普通编辑时，在同一设置位置关闭 Vim 键绑定。
- Obsidian 的 Vim 模式不是完整终端 Vim；文件管理和窗口操作优先使用 Obsidian 命令，不假设所有 Ex 命令都可用。

## 接下来

- [Vim 起步](../vim/起步.md)：学习基础编辑动作。
- [文件常用命令](./11%20Obsidian-文件常用命令.md)：使用命令面板管理笔记。
- [Obsidian 官方设置说明](https://obsidian.md/help/settings)。
