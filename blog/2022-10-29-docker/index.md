---
title: Install Docker
authors: biulight
tags: [docker, ubuntu, linux]
---

如何安装docker？
<!-- truncate -->

## Ubuntu

### Snap 安装

> Snap 是一种全新的软件包管理方式，它类似一个容器拥有一个应用程序所有的文件和库，各个应用程序之间完全独立。

```bash
sudo snap install docker
sudo snap start docker --enable # 启动 docker，并添加随机启动

snap services docker # 确认服务状态
service snap.docker.dockerd status # 确认服务详情

sudo snap refresh docker # 更新 Snap 安装的 docker 服务

```

## 无权访问 Docker 套接字

遇到 `permission denied` 时，先确认服务在运行，再尝试：

```bash
snap services docker
sudo docker info
```

不要把 `/var/run/docker.sock` 改成 `666`：这会让所有本地用户都能控制 Docker 守护进程。若确实需要免 `sudo` 使用，在普通 Ubuntu 上按 [Docker Snap 说明](https://github.com/canonical/docker-snap#running-docker-as-normal-user) 为受信任用户授权：

```bash
# docker 组已存在时跳过这一条
sudo addgroup --system docker
sudo adduser "$USER" docker
```

退出并重新登录后再执行 `docker info`。`docker` 组具有近似 root 的权限，不应向不受信任用户开放。Ubuntu Core 不允许按此方式把普通用户加入系统组。

若创建组时 Docker Snap 已运行，需在维护窗口禁用并重新启用它；这会中断 Docker 服务和运行中的容器：

```bash
sudo snap disable docker
sudo snap enable docker
```

更多说明见 [Docker 安装后配置](https://docs.docker.com/engine/install/linux-postinstall/)。
