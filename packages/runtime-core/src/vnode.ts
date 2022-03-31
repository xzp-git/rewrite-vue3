import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

//虚拟节点有很多，组件的，元素的、文本的、 h('h1')
export function createVnode(type, props, children = null) {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  //虚拟Dom就是一个对象
  const vnode = {
    type,
    props,
    children,
    el: null,
    key: props?.key,
    __v_isVnode: true,
    shapeFlag,
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    //自己的shapeFlag等于自己的 或上自己的孩子的类型
    vnode.shapeFlag |= type;
  }
  return vnode;
}
