---
title: 使用Github自动交付前端制品
authors: biulight
tags: [Linux, Ubuntu, Deploy, GitHub, CI/CD]
---

怎样通过 Github 自动交付前端编译产物？

<!--truncate-->

## 准备

一台阿里云 `ubuntu` 服务器

## 实施

**以 `deploy` 用户组下的 `deploy001-timeline` 用户,部署目录 `/path/to/folder`，部署工具 `easingthemes/ssh-deploy@v2.2.11` 为例**

### 新建部署用户，修改部署目录权限

:::tip
遵循权限最小化原则，创建 `deploy001-timeline` 用户，用于部署
若已存在 `deploy` 用户组，跳过**步骤 1**，直接新建指定项目部署用户
:::

```bash
# 检查指定xxx用户组是否存在
cat /etc/group | grep xxx
```

1. 创建用户组

```bash
sudo addgroup deploy
```

2. 创建用户

```bash
sudo adduser --ingroup deploy deploy001-timeline
```

3. 指定部署目录的归属

```bash
sudo chown deploy001-timeline:deploy /path/to/folder
```

4. 更新目录权限

```bash
sudo chmod 755 /path/to/folder
```

### 配置部署工具

**以 `easingthemes/ssh-deploy@v2.2.11` 为例**

:::tip
[easingthemes/ssh-deploy](https://github.com/easingthemes/ssh-deploy)使用手册
:::

#### 服务器侧

:::tip
使用 `ssh` 登录服务器，需要使用一组秘钥对，其中公钥设置到服务器 `~/.ssh/authorized_keys` 文件中，私钥设置在客户端
:::

1. 登录新创建的用户

```bash
su deploy001-timeline
```

2. 生成非对称密钥

```bash
ssh-keygen -m PEM -t rsa -b 4096 -f deploy001-timeline -C "deploy001-timeline"
```

3. 把公钥粘贴到 `authorized_keys` 文件中

```bash
# 查看公钥，复制输出到终端的结果
cat deploy001-timeline.pub
# 编辑 authorized_keys 文件，并把复制的结果粘贴到此文件
vim ~/.ssh/authorized_keys
```

```txt title="~/.ssh/authorized_keys"
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDcGxPtreCc5bBbaN7jIRuVuTQkC0Mp6VxnyC5sQKG1IZwSL5agL3Zdbu3YVzx0rSU33XZZj5lWp0AAz4ABQGhAU6iIgDNjRmhyuLG4VOS3Gas21Si1lK4Dm/D0lBA//zFmDBTwa9sAEl39rJQCQYL3n2prMrlC2k8m93RGLFmgxWDcb2D+LGgi43bgR4TXvJD6dZa7xfIldsQL5SQpCzEMX8uDDlnnsus99AqmmMzUenW6I25G2ApwgUY/Toj/scCGeHRb7PmGK0AwjqBr9siiIRNi0DpX4JbYPqLPn0IciC70RNLs2tOEFV1BwP50gmF5eDD4tI7NOLaI4HvkesYy9xF6qBtNJOfALgu7Dt+s5g5izXg2pfb/RKJw2WEj56hLI2NIOr1CgZRJH6Yq2xlP1SKlo3GwkzT/NhnhiO1NFy/FKFj/sYmn4/SM92QM2OmruPDAU6JUHUT9P7m/bhlAxo5xrzMqH8v9c4acxUGz5s87j8eNcNfaIuzMQOG+jzEOqqdWI4uLeTPHrm4pSuZUuse7IenTN3Wx1MD4CfjyZZZIWR6Xv+f7MJ0CpbvpZ7E4MjenLfb8g/upl2L1kv3Lz/UUbL4n38DCY113wkJY5x6T54ckqHUmhirsL2SCHb71VAtxUhEByCTBdPEN18Hh+QOKKTp4rmJYjNrvm4E5yw== deploy001-timeline
```

:::tip
vim 是 linux 常用的终端编辑器，常见命令如下

1. `:wq` 保存并退出
2. `i` 进入输入视图
   :::

#### Github 配置

配置 `secrets` ，在 workflow 中使用

:::tip
配置位置如下图所示
![配置位置参考图](./deploy.jpg)
:::

1. 新增 `ALY_USER`，如下

```txt
deploy001-timeline
```

2. 新增 `ALY_HOST`，如下

```txt
192.168.0.155
```

3. 新增 `ALY_SSH_TOKEN`，如下

```txt
-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----
```

:::tip

- **ALY_USER:** 服务器配置的部署用户名
- **ALY_HOST:** 服务器域名
- **ALY_SSH_TOKEN:** 通过`ssh-keygen` 生成的私钥
  :::

#### 项目 workflow 配置

:::tip
配置文件配置在项目中，通常写在 `.github/workflows` 目录下
:::

**example:**

```yml title=".github/workflows/deploy.yml"
name: Deployment
# 触发脚本的条件，develop分支push代码的时候
on:
  push:
    branches:
      - release
# 要执行的任务
jobs:
  # 任务名称
  build:
    # runs-on 指定job任务运行所需要的虚拟机环境（必填）
    # runs-on: self-hosted
    runs-on: ubuntu-latest
    # 任务步骤
    steps:
      # 获取源码
      - name: pull code
        # 使用action库  actions/checkout获取源码
        uses: actions/checkout@v3
      # 安装node
      - name: create build environments
        # 使用action库 actions/setup-node 安装node
        uses: actions/setup-node@v3
        with:
          node-version: 18.20.4
      # 安装依赖
      - name: install
        run: npm install
      # 打包
      - name: build
        run: npm run build
      - name: Upload static files as artifact
        id: deployment
        uses: actions/upload-pages-artifact@v3 # or specific "vX.X.X" version tag for this action
        with:
          path: build/
      # 上传打包文件到远程服务器
      - name: ssh deploy
        uses: easingthemes/ssh-deploy@v2.2.11
        env:
          REMOTE_USER: ${{secrets.ALY_USER}}
          REMOTE_HOST: ${{secrets.ALY_HOST}}
          REMOTE_PORT: "22"
          ARGS: "-rltgoDzvO --delete"
          SSH_PRIVATE_KEY: ${{secrets.ALY_SSH_TOKEN}}
          # 要上传文件所在目录
          SOURCE: "build/*"
          # 远程服务器目标路径
          TARGET: "/var/www/timeline"
```

## 补充

### NGINX 配置

以访问 `http://blog.biulight.cn/timeline` 能显示 `/var/www/timeline` 目录内容为例

:::tip

1. 通常，Nginx 的虚拟主机配置位于`/etc/nginx/sites-available/`目录下。如果已经有针对`timeline`的配置文件，可以直接编辑它；否则，创建一个新的配置文件。
2. 启用配置文件，需要在 `/etc/nginx/sites-enabled/`目录下有对应配置文件的映射。
   :::

3. 新增配置文件

```nginx title="/etc/nginx/sites-available/timeline"
server {
    listen 80;
    server_name blog.biulight.cn;

    # 映射/timeline到指定目录
    location /timeline {
        alias /var/www/timeline;
        index index.html index.htm;
    }
}
```

2. 启用配置文件

```bash
# 建立软连接，启用新增的配置文件
ln -s /etc/nginx/sites-available/timeline /etc/nginx/sites-enabled/timeline
```

3. 测试配置文件

```bash
# 修改完配置后，运行以下命令检查语法是否正确
sudo nginx -t
```

4. 重新加载 Nginx 服务

```bash
# 如果测试通过，重新加载Nginx以应用更改：
sudo systemctl reload nginx
```

### 使用 `Let's Encrypt` 证书

:::tip
ubuntu 安装查看[certbot](https://certbot.eff.org/instructions?ws=nginx&os=snap)官方文档
:::

使用**certbot**自动生成证书

```bash
sudo certbot --nginx
```
