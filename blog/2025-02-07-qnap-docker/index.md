---
title: 拯救你的Docker
authors: biulight
tags: [Linux, Docker, QNAP]
---

威联通 Docker 国内无法拉取镜像？

<!--truncate-->

## 背景

由于众所周知的原因，国内拉取 docker 镜像愈发可困难，网上现有的教程涉及 NAS 的极少，为了能愉快的使用 NAS，我进行了大量尝试，终于找到了可用的方法，顺手记录下，分享给各位苦苦挣扎的道友。

## 常见的方案

现有环境下，想成功拉取镜像，无非使用魔法或者换国内镜像。

### 使用代理

1. 开启威联通 ssh 服务,并通过 ssh 连接到 QNAP

```bash
# 远程登录
ssh -p 22 username@nas.example.internal
```

:::tip
SSH 服务的默认端口是 22，上述命令是 用户通过 SSH 工具用账号（username）连接到服务器（请将 `nas.example.internal` 替换为自己的 NAS 地址）的 22 端口
:::

2. 增加 docker 的代理配置

```bash
# 编辑配置文件
sudo vim /share/CACHEDEV1_DATA/.qpkg/container-station/etc/docker.json
```

修改前备份配置，保留已有字段并合并下面的 `proxies`，不要覆盖整个文件。示例是标准 JSON，不支持注释。配置位置因 Container Station 版本和存储卷可能不同，请先确认实际使用路径；代理字段支持以当前 Docker Engine 版本及 [Docker 官方说明](https://docs.docker.com/engine/daemon/proxy/)为准。

```json title="/share/CACHEDEV1_DATA/.qpkg/container-station/etc/docker.json"
{
  "proxies": {
    "http-proxy": "http://proxy.example.com:3128",
    "https-proxy": "http://proxy.example.com:3128",
    "no-proxy": "*.test.example.com,.example.org,127.0.0.0/8"
  }
}
```

:::tip
ssh 登录后，可以通过 `which docker`、`whereis docker` 查看 docker 所在位置
:::

3. 重启 Docker 服务

重启 Container Station 会中断运行中的容器，请在维护窗口操作。若启动失败，恢复修改前的配置再重启。

```bash
sudo /etc/init.d/container-station.sh restart
```

4. 查看配置是否成功

```bash
docker info
```

检查输出中的 HTTP Proxy 和 HTTPS Proxy 是否符合预期。分享输出前请移除主机、网络地址和可能包含凭据的代理 URL。

完成上述设置后，你就可以愉快的拉取镜像了

### 更换国内镜像源

> 参考**使用代理**，仅使用自己管理或已确认可信、当前可访问的镜像服务。下面的地址是占位符，不能直接拉取镜像：

```json
{
  "registry-mirrors": [
    "https://mirror.example.com"
  ]
}
```

将该字段合并到原配置中，不要覆盖上一步的 `proxies` 或其他配置。旧文章中流传的公共镜像地址可能已经停服、限制来源网络或变更服务范围，应以服务提供方当前说明为准。

剩余步骤参考[使用代理](#使用代理)。
