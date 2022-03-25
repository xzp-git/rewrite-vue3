import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactivity";

function traversal(value, set = new Set()) {
  //考虑如果对象中有循环引用的问题
  if (!isObject(value)) return value;
  if (set.has(value)) {
    return value;
  }
  set.add(value);
  for (let key in value) {
    traversal(value[key], set);
  }

  return value;
}

//source是用户传入的对象，cb就是对应的用户的回调
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    //对我们用户传入的数据 进行循环 （递归循环，只要循环就会访问对象上的每一个属性，访问属性的时候会收集effect）
    getter = () => traversal(source);
  } else if (isFunction(source)) {
    getter = source;
  } else {
    return;
  }

  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn; //保存用户的函数
  };
  let oldValue;
  const job = () => {
    if (cleanup) cleanup(); //下一次watch开始触发上一次watch的清理
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue; //此次的新值作为下一次的老值
  };
  //在effect中 属性就会依赖收集
  //监控到的属性变化后，重新执行job函数
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
}
