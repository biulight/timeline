---
sidebar_position: 1
id: 1
---

# ES5和ES6变量声明的差异

顽固不化的 `var` 和 `function`

## 问题情景再现

以下示例仅用于浏览器中的普通 `<script>`，且未启用严格模式。ES Module 默认采用严格模式，直接调用 `fn()` 时 `this` 为 `undefined`，读取 `this.len` 会抛出 `TypeError`；Node.js 模块也不是浏览器全局脚本环境。

```javascript
// 1. let/const 声明的变量不挂载在window上
let c = 'hello world';
console.log(window.c); // undefined

// 2. this指向
let len = 10;
function fn() {
    return this.len;
}
fn(); // undefined

// 3. arguments对象调用fn方法
const person = {
    len: 5,
    say: function() {
        fn(); // undefined
        arguments.len = 20;
        arguments[0](); // 20
    }
}
person.say(fn); 
```

## 原因分析

1. 在浏览器普通脚本中，顶层 `var` 和函数声明会建立全局对象属性；这条规则不适用于模块顶层声明。
2. 在同样的普通脚本环境中，`ES6` 引入的词法声明有所不同
    - `var`、`function` 声明的全局变量，依然是顶层对象的属性；
    - `let`、`const`、`class` 声明的全局变量不属于顶层对象的属性；
3. `let` 和 `const` 声明的变量存在于`Scope`作用域链上的名为`Script`的作用域中，不挂载在`window`对象上

## 总结

优先使用 `const`，需要重新赋值时使用 `let`。判断 `this` 时要看调用方式和严格模式，不能仅凭变量使用了 `var` 还是 `let`。