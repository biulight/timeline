---
title: 使用Github自动交付前端制品
authors: biulight
tags: [Linux, Ubuntu, Deploy, GitHub, CI/CD]
---

怎样通过Github自动交付前端编译产物？


## 准备

一台阿里云 `ubuntu` 服务器

## 实施

**以 `deploy` 用户组下的 `deploy001-timeline` 用户,部署目录 `/path/to/folder`，部署工具 `easingthemes/ssh-deploy@v2.2.11` 为例**

### 新建部署用户，修改部署目录权限

:::tip
遵循权限最小化原则，创建 `deploy001-timeline` 用户，用于部署
若已存在 `deploy` 用户组，跳过**步骤1**，直接新建指定项目部署用户
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
:::tip
vim 是linux常用的终端编辑器，常见命令如下
1. `:wq` 保存并退出
2. `i` 进入输入视图
:::

#### Github 配置

配置 `secrets` 变量，在workflow中使用

- `ALY_USER`: deploy001-timeline
- `ALY_HOST`: 服务器域名
- `ALY_SSH_TOKEN`: deploy001-timeline文件内容

:::tip
查看 `deploy001-timeline`文件, 可在终端输入 `cat deploy001-timeline`
:::

#### workflow配置

**example:**
```yml
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

### NGINX配置

以访问 `http://blog.biulight.cn/timeline` 能显示 `/var/www/timeline` 目录内容为例

:::tip
1. 通常，Nginx的虚拟主机配置位于`/etc/nginx/sites-available/`目录下。如果已经有针对`timeline`的配置文件，可以直接编辑它；否则，创建一个新的配置文件。
2. 启用配置文件，需要在 `/etc/nginx/sites-enabled/`目录下有对应配置文件的映射。
:::

1. 新增配置文件
```nginx
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
4. 重新加载Nginx服务
```bash
# 如果测试通过，重新加载Nginx以应用更改：
sudo systemctl reload nginx
```

### 使用 `Let's Encrypt` 证书

:::tip
ubuntu安装查看[certbot](https://certbot.eff.org/instructions?ws=nginx&os=snap)官方文档
:::

使用**certbot**自动生成证书

```bash
sudo certbot --nginx
```
