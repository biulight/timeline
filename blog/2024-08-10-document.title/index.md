---
title: Watch document.title
authors: biulight
tags: [Web, Supervisory control]
---

埋点监控 SDK `ENTER` 事件怎样获取到页面标题？

<!--truncate-->

## 背景

使用 `window.onload`、`hashchange` 事件获取 `document.title` 时，某些场景出现异常，值为空

## 分析

单页面应用，`document.title` 存在异步设置的场景（如页面是后管配置的，需要等接口返回页面标题）

## 方案

### 场景一：多页面应用，`title` 写在 html 文件里；

`window.onload` 事件可以正常获取到页面标题

### 场景二：单页面应用，`title` 在页面初始化后设置；

> 借助 `MutationObserver` 观察 `title` 元素更新

```js
function watchForTitleChanges(callback, type) {
  let previousTitle = document.title;
  const observer = new MutationObserver((mutationList, observer) => {
    const title = document.title;
    if (previousTitle !== title) {
      previousTitle = title;
      callback?.(title);
      if (type === "once") observer.disconnect();
    }
  });

  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  return () => observer.disconnect();
}
```

下面只演示观察“注册之后的下一次标题变化”。路由切换时先取消上一次观察，避免标题未变化时积累监听：

```js
let stopWatching;
function watchNextTitle() {
  stopWatching?.();
  stopWatching = watchForTitleChanges((title) => {
    console.log("title发生了变化", title);
  }, "once");
}

// 已有标题可直接读取；只有之后的变化才需要观察
console.log(document.title);

// 页面初次加载时，在 load 事件中注册 watch
window.addEventListener("load", watchNextTitle);

// 路由切换时，在 hashchange 事件中注册 watch
window.addEventListener("hashchange", watchNextTitle);
```

若标题在监听注册前已经更新，上述回调不会补发；埋点应优先接入应用的路由完成或标题更新钩子，并直接读取 `document.title`。History 路由也不能只监听 `hashchange`。
