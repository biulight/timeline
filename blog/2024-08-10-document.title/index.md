---
title: Watch document.title
authors: biulight
tags: [Web, Supervisory control]
---

埋点监控 SDK `ENTER` 事件怎样获取到页面标题？

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
  let ele = document.getElementsByTagName("title")?.[0];
  if (!ele) {
    ele = document.createElement("title");
    document.head.appendChild(ele);
  }
  let previousTitle = document.title;
  const observer = new MutationObserver((mutationList, observer) => {
    const title = document.title;
    if (previousTitle !== title) {
      previousTitle = title;
      callback?.(title);
      if (type === "once") observer.disconnect();
    }
  });

  observer.observe(ele, { childList: true });
  // 非仅监听一次更新时，返回取消监听函数
  if (type !== "once") return observer.disconnect;
}
```

完美实现如下：

```js
// 页面初次加载时，在 load 事件中注册 watch
window.addEventListener("load", () => {
  watchForTitleChanges((title) => {
    console.log("title发生了变化", title);
  }, "once");
});

// 路由切换时，在 hashchange 事件中注册 watch
window.addEventListener("hashchange", () => {
  watchForTitleChanges((title) => {
    console.log("title发生了变化", title);
  }, "once");
});
```
