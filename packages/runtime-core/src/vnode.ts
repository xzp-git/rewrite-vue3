import { isArray, isFunction, isObject, isString, ShapeFlags } from "@vue/shared";
import { isTeleport } from "./components/Teleport";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

//虚拟节点有很多，组件的，元素的、文本的、 h('h1')
export function createVnode(type, props, children = null, patchFlag = 0) {
  
  let shapeFlag = isString(type)? ShapeFlags.ELEMENT: 
  isTeleport(type) ?  ShapeFlags.TELEPORT: // 针对不同的类型增添shapeFlag
  isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT:
  isObject(type) ? ShapeFlags.STATEFUL_COMPONENT: 0;

  //虚拟Dom就是一个对象
  const vnode = {
    type,
    props,
    children,
    el: null,
    key: props?.key,
    __v_isVnode: true,
    shapeFlag,
    patchFlag
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN
    }else{
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    //自己的shapeFlag等于自己的 或上自己的孩子的类型
    vnode.shapeFlag |= type;
  }

  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode)    
  }


  return vnode;
}


export {createVnode as createElementVNode}

let currentBlock = null

export function openBlock() { //用一个数组来收集多个动态节点
  currentBlock = []
}


export function createElementBlock(type, props, children, patchFlag) {
  return setupBlock(createVnode(type, props, children, patchFlag))
}



function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock
  currentBlock = null
  return vnode
}












/**
 * 模板编译优化 增添了patchFlag 来标识哪些节点是动态的
 * block来收集节点 为不稳定结构的也创建了block节点，实现blockTree做到靶向更新
 * 优化    静态提升属性的提升 和虚拟节点的提升 函数的缓存 预解析字符串
 * 写模板的性能会比直接写h函数更好一些，
 */