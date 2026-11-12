---
title: 使用 step-ca 为受控私网签发和自动续期证书
sidebar_position: 5
---

# 使用 step-ca 为受控私网签发和自动续期证书

本指南介绍如何在受控私网中部署 `step-ca`，通过 ACME 为私有服务签发证书，并由 Certbot
自动续期、安全重载 Nginx。完成后，受信任的客户端可以使用私有域名通过 HTTPS 访问服务，
无需将服务暴露到公网。

```text
私有 DNS → step-ca → ACME → Certbot → Nginx → 自动续期与重载
```

根 CA 只适合受控网络。客户端信任根证书后，持有对应私钥的一方可为客户端接受的名称签发
证书；必须限制 CA 的网络与主机访问、妥善保存密码，并加密备份 CA 数据。

## 前置条件和配置变量

- 一台可运行 Docker Compose、Nginx 和 Certbot 的 Linux 主机；
- 可让 CA 容器、服务主机和客户端共同使用的私有 DNS；
- 能管理主机防火墙和客户端信任存储；
- 已通过独立可信渠道取得根 CA 的 fingerprint。

| 占位符 | 含义 |
| --- | --- |
| `<PRIVATE_NETWORK_CIDR>` | 允许访问服务的私网网段 |
| `<PRIVATE_NETWORK_IP>` | CA 与 DNS 主机的私网地址 |
| `<CA_DOMAIN>` | CA 的私有 DNS 名称 |
| `<SERVICE_DOMAIN>` | 要保护的服务名称 |
| `<PRIVATE_SUFFIX>` | 私有 DNS 后缀，不含开头的点 |
| `<ROOT_FINGERPRINT>` | 根证书 SHA-256 fingerprint |
| `<CA_CONTAINER>` | step-ca 容器名称 |
| `<ACME_WEBROOT>` | HTTP-01 挑战文件根目录 |
| `<NGINX_CERT_DIR>` | 受控的 Nginx 证书目录 |

本文将 CA 仅绑定到 `<PRIVATE_NETWORK_IP>:9443`；容器内部仍监听 `9000`。防火墙应仅允许
`<PRIVATE_NETWORK_CIDR>` 访问 CA 的 `9443`，并按服务需要限制 `80` 与 `443`。

## 配置私有 DNS

DNS 实现可以是 CoreDNS、企业 DNS 或其他能为私有区域提供权威解析的服务。以 CoreDNS 的
`hosts` 块为例，为 CA 与目标服务添加记录：

```coredns
hosts {
    <PRIVATE_NETWORK_IP> <CA_DOMAIN>
    <PRIVATE_NETWORK_IP> <SERVICE_DOMAIN>

    ttl 60
    fallthrough
}
```

重载 DNS 后直接查询：

```bash
dig @<PRIVATE_NETWORK_IP> <CA_DOMAIN> +short
dig @<PRIVATE_NETWORK_IP> <SERVICE_DOMAIN> +short
```

两条命令都应返回 `<PRIVATE_NETWORK_IP>`。服务主机必须实际使用该 DNS；仅 `dig @...` 成功，
不代表 `curl`、Certbot 或 Docker 容器也能够解析私有名称。

使用 `systemd-resolved` 的 Linux 主机可创建 `/etc/systemd/resolved.conf.d/private-dns.conf`：

```ini
[Resolve]
DNS=<PRIVATE_NETWORK_IP>
Domains=~<PRIVATE_SUFFIX>
```

应用并验证：

```bash
sudo systemctl restart systemd-resolved
sudo resolvectl flush-caches
resolvectl query <CA_DOMAIN>
```

若停用了 `DNSStubListener`，还要确认 `/etc/resolv.conf` 没有继续指向过期的本地 stub 地址。

## 部署 step-ca

仅在首次部署且尚未初始化 CA 数据卷时，创建不纳入版本控制的密码文件。已有部署必须复用与 CA 私钥配套的原密码；不要重新生成覆盖。下面使用 `noclobber`，文件已存在时会拒绝写入：

```bash
sudo install -d -m 700 /opt/step-ca/secrets
sudo sh -c 'umask 077; set -C; openssl rand -base64 48 > /opt/step-ca/secrets/ca-password' && \
  sudo chmod 644 /opt/step-ca/secrets/ca-password
cd /opt/step-ca
```

确认密码文件创建成功后再继续。若已有 CA 数据卷但密码文件丢失，应从受控备份恢复原文件，不能用新随机密码代替。

密码文件需能被 Compose 挂载后的容器用户读取。不要将密码写入 Compose 文件或提交到 Git；
若环境支持正确的 UID/GID，只读挂载可以采用更严格的权限。

创建 `compose.yaml`：

```yaml
services:
  step-ca:
    image: smallstep/step-ca:latest
    container_name: <CA_CONTAINER>
    restart: unless-stopped
    environment:
      DOCKER_STEPCA_INIT_NAME: "Private Network CA"
      DOCKER_STEPCA_INIT_DNS_NAMES: >-
        <CA_DOMAIN>,
        <PRIVATE_NETWORK_IP>,
        localhost
      DOCKER_STEPCA_INIT_PROVISIONER_NAME: "admin"
      DOCKER_STEPCA_INIT_PASSWORD_FILE: "/run/secrets/ca_password"
      DOCKER_STEPCA_INIT_ACME: "true"
      DOCKER_STEPCA_INIT_REMOTE_MANAGEMENT: "true"
    ports:
      - "<PRIVATE_NETWORK_IP>:9443:9000"
    dns:
      - <PRIVATE_NETWORK_IP>
    volumes:
      - step_ca_data:/home/step
    secrets:
      - ca_password
    healthcheck:
      test:
        ["CMD", "step", "ca", "health", "--ca-url", "https://localhost:9000", "--root", "/home/step/certs/root_ca.crt"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 30s

secrets:
  ca_password:
    file: ./secrets/ca-password

volumes:
  step_ca_data:
```

`dns` 很关键：HTTP-01 校验由 CA 发起，因此 CA 容器必须能解析并访问 `<SERVICE_DOMAIN>`。
启动并检查：

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=100 step-ca
```

初始化变量只在数据卷为空时生效。不要使用 `docker compose down -v`，也不要为修改初始化参数
删除数据卷；这会更换根 CA，使所有客户端的既有信任失效。

导出根证书并验证 CA 与 ACME 目录：

```bash
sudo docker compose cp step-ca:/home/step/certs/root_ca.crt ./root_ca.crt

curl --noproxy '*' --cacert ./root_ca.crt https://<CA_DOMAIN>:9443/health
curl --noproxy '*' --cacert ./root_ca.crt \
  https://<CA_DOMAIN>:9443/acme/acme/directory

sudo docker compose exec step-ca \
  step certificate fingerprint /home/step/certs/root_ca.crt
```

健康检查应返回 `{"status":"ok"}`，ACME 目录应包含 `newNonce`、`newAccount` 与 `newOrder`。
通过独立可信渠道保存和交付 fingerprint；不要只从待引导的 CA 连接中取得它。

## 让 Linux 信任根 CA

将公开根证书安装到系统信任存储：

```bash
sudo install -m 644 ./root_ca.crt \
  /usr/local/share/ca-certificates/private-network-ca.crt
sudo update-ca-certificates
curl --noproxy '*' https://<CA_DOMAIN>:9443/health
```

不同发行版的信任存储命令不同；使用其平台推荐方式，但只导入公开根证书，绝不导入 CA 私钥。

下文在首次签发、模拟续期和 systemd 服务中都显式使用包含刚安装根证书的 `/etc/ssl/certs/ca-certificates.crt`。这是 Debian/Ubuntu 的系统 CA bundle 路径；其他发行版须替换为实际 bundle。若同一主机也续期公网证书，应保留 bundle 中的公共根证书，不要只放私有根证书。

## 配置 Nginx 与 HTTP-01 校验

Certbot 维护稳定的证书路径，Nginx 应直接引用它们。先创建挑战目录：

```bash
sudo mkdir -p <ACME_WEBROOT>/.well-known/acme-challenge
```

在申请证书前配置 HTTP 站点。挑战路径必须允许 CA 容器访问，其他访问按实际策略限制：

```nginx
server {
    listen <PRIVATE_NETWORK_IP>:80;
    server_name <SERVICE_DOMAIN>;

    location ^~ /.well-known/acme-challenge/ {
        root <ACME_WEBROOT>;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

这里的 HTTP 站点只提供挑战文件和 HTTPS 重定向；HTTP 来源限制由前述监听地址和防火墙承担。下文 HTTPS 反向代理仍保留来源访问规则。

检查并重载 Nginx，使上面的 HTTP 配置生效，再从宿主机和 CA 容器两侧验证挑战路径：

```bash
sudo nginx -t && sudo systemctl reload nginx
echo acme-ok | sudo tee <ACME_WEBROOT>/.well-known/acme-challenge/test >/dev/null
curl http://<SERVICE_DOMAIN>/.well-known/acme-challenge/test
sudo docker exec <CA_CONTAINER> wget -qO- \
  http://<SERVICE_DOMAIN>/.well-known/acme-challenge/test
```

两次都应输出 `acme-ok`。容器若报 `bad address`，检查 Compose 的 `dns`，然后执行
`sudo docker compose up -d --force-recreate` 重建容器；保留数据卷不会重新初始化 CA。

## 使用 Certbot 签发单域名证书

确认挑战路径可达后，向私有 ACME 服务申请证书：

```bash
sudo env REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
  certbot certonly \
  --webroot \
  --webroot-path <ACME_WEBROOT> \
  --server https://<CA_DOMAIN>:9443/acme/acme/directory \
  --domain <SERVICE_DOMAIN> \
  --agree-tos \
  --register-unsafely-without-email
```

签发成功后，保留 HTTP 站点用于续期，并增加 HTTPS 站点：

```nginx
server {
    listen <PRIVATE_NETWORK_IP>:443 ssl http2;
    server_name <SERVICE_DOMAIN>;

    ssl_certificate     /etc/letsencrypt/live/<SERVICE_DOMAIN>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<SERVICE_DOMAIN>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        allow <PRIVATE_NETWORK_CIDR>;
        deny all;
        proxy_pass http://<UPSTREAM_HOST>:<UPSTREAM_PORT>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

应用并验证证书与上游：

```bash
sudo nginx -t && sudo systemctl reload nginx
openssl s_client -connect <PRIVATE_NETWORK_IP>:443 \
  -servername <SERVICE_DOMAIN> </dev/null 2>/dev/null |
  openssl x509 -noout -subject -issuer -dates
curl --noproxy '*' -I https://<SERVICE_DOMAIN>
```

若返回 `502 Bad Gateway`，从 Nginx 主机检查 `<UPSTREAM_HOST>:<UPSTREAM_PORT>` 是否可达，并确认
当前生效配置仍包含 `location /` 与正确的 `proxy_pass`。

## 配置自动续期

本节以提供 `certbot.service` 和 `certbot.timer` 的发行版软件包为例。先运行 `systemctl cat certbot.service certbot.timer` 确认服务；Snap 等安装方式可能使用其他单元名称，必须对应修改服务与 timer，不能新建一个无人调用的同名单元。

运行 `sudo systemctl edit certbot.service`，为自动续期设置与首次签发相同的信任库：

```ini
[Service]
Environment="REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt"
```

仅在交互式终端设置此变量不会传给 systemd。私有 CA 的叶证书通常有效期较短，不应沿用公网 CA 的检查频率。创建部署钩子
`/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`：

```sh
#!/bin/sh
nginx -t >/dev/null 2>&1 && systemctl reload nginx
```

```bash
sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

创建 `/etc/systemd/system/certbot.timer.d/override.conf`，每六小时检查一次并加入随机延迟：

```ini
[Timer]
OnCalendar=
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=30m
Persistent=true
```

应用、模拟续期并确认服务端点：

```bash
sudo systemctl daemon-reload
sudo systemctl restart certbot.timer
sudo systemctl enable certbot.timer
systemctl list-timers certbot.timer

sudo env REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
  certbot renew --dry-run --run-deploy-hooks \
  --server https://<CA_DOMAIN>:9443/acme/acme/directory
sudo grep '^server' /etc/letsencrypt/renewal/<SERVICE_DOMAIN>.conf
```

普通续期会读取已保存的 ACME 地址；模拟续期仍建议显式指定私有 `--server`，避免错误切换到
公有 ACME 环境。对自定义 CA 使用 `--dry-run` 仍可能签发并丢弃真实证书，不是完全无副作用的离线检查。

最后运行 `systemctl show certbot.service -p Environment`，确认服务已获得 `REQUESTS_CA_BUNDLE`；检查一次自动续期任务的日志，不能只以手工签发成功作为自动续期成功的依据。

## 让 Windows 和 macOS 信任根 CA

### Windows

若选择推荐的 bootstrap 方式，先安装 `step` 客户端 CLI。使用 Winget：

```powershell
winget install Smallstep.step
```

也可使用 Scoop：

```powershell
scoop bucket add smallstep https://github.com/smallstep/scoop-bucket.git
scoop install smallstep/step
```

安装后重新打开终端并确认命令可用：

```powershell
step version
```

Windows 客户端只需安装 `step`，不需要安装运行 CA 服务的 `step-ca`。随后以需要使用该证书的
用户身份运行：

```powershell
step ca bootstrap --ca-url https://<CA_DOMAIN>:9443 --fingerprint <ROOT_FINGERPRINT> --install
```

`step` 不是 Windows 建立信任的必要条件；这里推荐它，是因为该命令会下载根证书、使用已
独立核对的 fingerprint 验证证书，并完成安装。当前用户运行时，根证书会进入
`CurrentUser\Root`。

若已通过可信渠道取得并核验公开根证书，也可直接使用 Windows PowerShell 导入，无需安装
`step`：

```powershell
# 仅供当前用户及其进程使用，无需管理员权限
Import-Certificate `
  -FilePath .\private-network-root-ca.cer `
  -CertStoreLocation Cert:\CurrentUser\Root
```

服务账户、SYSTEM 或其他用户上下文运行的程序通常需要计算机级信任。此时应在**管理员
PowerShell** 中导入：

```powershell
Import-Certificate `
  -FilePath .\private-network-root-ca.cer `
  -CertStoreLocation Cert:\LocalMachine\Root
```

也可通过 `certlm.msc` 导入到“本地计算机 → 受信任的根证书颁发机构”，或在批量设备上通过
组策略、MDM 分发。无论采用哪种方式，都只能导入**公开根证书**，不得导入私钥；bootstrap
fingerprint 不等同于 Windows 证书管理器显示的 thumbprint。不要从尚未受信的 CA 连接下载后
未经独立核验便直接导入。

### macOS

将 `<PRIVATE_SUFFIX>` 交由私有 DNS 解析后，刷新缓存：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
dscacheutil -q host -a name <CA_DOMAIN>
dscacheutil -q host -a name <SERVICE_DOMAIN>
```

通过 Homebrew 安装 `step` 客户端 CLI，再使用独立核对过的 fingerprint 引导。代理环境中可
临时绕过代理：

```bash
brew install step
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
  step ca bootstrap \
  --ca-url https://<CA_DOMAIN>:9443 \
  --fingerprint <ROOT_FINGERPRINT> \
  --install
```

在系统钥匙串中确认根证书已受信任。Safari 和 Chrome 使用系统钥匙串；Firefox 可能需要在
浏览器证书设置中单独导入公开根证书。

## 通配符服务器证书

多个名称由同一受控 Nginx 终止 TLS 时，通配符证书可减少配置和续期任务；服务分散在不同
主机时，优先独立证书以缩小私钥泄露影响。`*.<SERVICE_DOMAIN>` 仅覆盖一层子域，**不覆盖**
裸域 `<SERVICE_DOMAIN>`，也不覆盖更深层的名称。

通配符不能使用 HTTP-01。若要通过 ACME 申请，需具备动态 TXT 更新能力的权威 DNS 与安全的
DNS-01 认证方式。完全受控环境也可从 CA 容器内直接签发，但这使用高权限 provisioner，
只能在受控 CA 主机操作。

叶证书和私钥放在现有持久卷的专用目录中；容器重建后仍需用它们续期。创建受控目录后，
在容器内签发同时包含裸域和通配符 SAN 的叶证书：

```bash
sudo install -d -m 700 <NGINX_CERT_DIR>
sudo docker exec <CA_CONTAINER> mkdir -p /home/step/service-certs
sudo docker exec <CA_CONTAINER> chmod 700 /home/step/service-certs

sudo docker exec <CA_CONTAINER> step ca certificate "*.<SERVICE_DOMAIN>" \
  /home/step/service-certs/fullchain.pem \
  /home/step/service-certs/privkey.pem \
  --san "<SERVICE_DOMAIN>" \
  --san "*.<SERVICE_DOMAIN>" \
  --provisioner admin \
  --provisioner-password-file /run/secrets/ca_password \
  --ca-url https://localhost:9000 \
  --root /home/step/certs/root_ca.crt \
  --force

sudo docker cp <CA_CONTAINER>:/home/step/service-certs/fullchain.pem \
  <NGINX_CERT_DIR>/fullchain.pem
sudo docker cp <CA_CONTAINER>:/home/step/service-certs/privkey.pem \
  <NGINX_CERT_DIR>/privkey.pem
sudo chmod 600 <NGINX_CERT_DIR>/privkey.pem
```

`--force` 允许覆盖目标文件，只能用于确认替换既有证书的受控操作。不要把私钥分发给不终止
TLS 的主机。Nginx 配置可引用：

```nginx
ssl_certificate     <NGINX_CERT_DIR>/fullchain.pem;
ssl_certificate_key <NGINX_CERT_DIR>/privkey.pem;
```

检查 SAN、链和 Nginx：

```bash
sudo docker exec <CA_CONTAINER> \
  step certificate inspect /home/step/service-certs/fullchain.pem --short
sudo openssl x509 -in <NGINX_CERT_DIR>/fullchain.pem -noout -ext subjectAltName
sudo nginx -t && sudo systemctl reload nginx
```

### 自动续期通配符证书

将以下 systemd 服务中的 `<CA_WORKDIR>` 替换为含 `compose.yaml` 的目录，
`<NGINX_CERT_DIR>` 与首次部署保持一致。续期先更新持久卷中的证书，再复制到 Nginx 目录；仅重载 Nginx 不会更新
此前复制到宿主机的文件。`--force` 允许非交互覆盖证书；私钥保持不变。
重载前的 `nginx -t` 是必要保护。

```ini
[Unit]
Description=Renew private wildcard certificate
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=<CA_WORKDIR>
ExecStart=/usr/bin/docker compose exec -T step-ca step ca renew --force --expires-in 8h --ca-url https://localhost:9000 --root /home/step/certs/root_ca.crt /home/step/service-certs/fullchain.pem /home/step/service-certs/privkey.pem
ExecStartPost=/usr/bin/docker compose cp step-ca:/home/step/service-certs/fullchain.pem <NGINX_CERT_DIR>/fullchain.pem
ExecStartPost=/bin/sh -c '/usr/sbin/nginx -t >/dev/null 2>&1 && /usr/bin/systemctl reload nginx'
```

用 `command -v docker nginx systemctl` 核对上述可执行文件路径。若任一步骤失败，应先处理
错误；证书已经过期时，需要重新签发并部署，不能假设默认策略允许过期续期。

配套 timer 每六小时检查一次：

```ini
[Unit]
Description=Check private wildcard certificate renewal

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=30m
Persistent=true

[Install]
WantedBy=timers.target
```

保存为对应的 `.service` 和 `.timer` 后启用并观察结果：

```bash
sudo systemctl daemon-reload
sudo systemctl start step-wildcard-renewer.service
sudo systemctl enable --now step-wildcard-renewer.timer
systemctl status step-wildcard-renewer.service
systemctl list-timers step-wildcard-renewer.timer
```

不要使用没有认证钩子的 `certbot --manual` 作为自动续期方案；它要求每次续期人工更新 DNS TXT。

## 常见问题

### step-ca 无法读取 CA 密码

若日志显示 `/run/secrets/ca_password: Permission denied`，先检查宿主机的目录和文件权限，确保
容器可读取 password secret；修复后执行 `sudo docker compose up -d`。不要使用带卷清理的命令
处理权限问题。

### ACME 授权无法完成

宿主机能访问挑战文件而 CA 容器无法解析服务名称时，问题在容器 DNS。确认 Compose 含有：

```yaml
dns:
  - <PRIVATE_NETWORK_IP>
```

重建容器并再次从容器内读取挑战文件。不要用 `-k` 或关闭 TLS 校验掩盖根因。

### 模拟续期连接到错误的 CA

若错误提示名称不受公有 CA 支持，Certbot 很可能没有连接到私有 CA。为 `certbot renew --dry-run`
显式传入本页的私有 `--server`，并检查续期配置的 `server` 值。

### macOS 引导出现 EOF

`HTTP_PROXY`、`HTTPS_PROXY` 或 `ALL_PROXY` 可能把私网 CA 请求转发给代理。使用前文的
`env -u ...` 命令暂时绕过，或在本机的代理绕过清单中加入 CA 名称、服务名称和私网地址。

## 备份与恢复边界

加密备份 step-ca 数据卷和密码文件，包括 CA 的证书、配置、数据库与密钥材料；限制备份读取
权限，并在隔离环境演练恢复。根 CA 私钥丢失或怀疑泄露时，必须建立新 CA、重新签发服务器
证书，并在所有客户端替换受信任的根证书；仅重新签发服务器证书不能恢复安全边界。

## 参考资料

- [Docker Compose exec：按服务名执行](https://docs.docker.com/reference/cli/docker/compose/exec/)
- [Smallstep：证书续期](https://smallstep.com/docs/step-cli/reference/ca/renew/)

- [Certbot：更换 ACME 服务与私有 CA 信任](https://eff-certbot.readthedocs.io/en/stable/using.html#changing-the-acme-server)
