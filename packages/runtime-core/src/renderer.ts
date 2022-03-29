import { isString, ShapeFlags } from "@vue/shared";
import { Text, createVnode, isSameVnode } from "./vnode";

export function createRenderer(renderOptions) {
  let {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions;

  /**
   * 如果新的虚拟dom的类型type是文本类型执行这个方法
   * 如果n1不存在 则是新增的逻辑，直接创建文本元素直接插入父级
   * 否则可以复用之前的元素的节点
   * @param n1
   * @param n2
   * @param container
   */
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const normalize = (children, i) => {
    let child = children[i];
    if (isString(child)) {
      let vnode = createVnode(Text, null, child);
      children[i] = vnode;
    }
    return children[i];
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      //处理后要进行替换，否则children中存放的已经是字符串
      let child = normalize(children, i);
      patch(null, child, container);
    }
  };

  const mountElement = (vnode, container, anchor) => {
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type)); //将真实的元素挂载到这个虚拟节点上，后续用于复用节点和更新

    //创建元素后，给元素添加属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //数组的话 需要再去挂载儿子
      mountChildren(children, el);
    }
    //创建完元素后，我们要把元素插入父节点
    hostInsert(el, container, anchor);
  };

  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (let key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };

  const patchChildren = (n1, n2, el) => {};

  /**
   * 走到这一步代表两个节点是相同的，因为在patch中已经进行过判断了
   * @param n1
   * @param n2
   */
  const patchElement = (n1, n2) => {
    //先复用节点、在比较属性、在比较儿子
    let el = (n2.el = n1.el);
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (!n1) {
      mountElement(n2, container, anchor);
    } else {
      //元素对比
      patchElement(n1, n2);
    }
  };
  /**
   *
   * 核心方法
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 父容器
   * @param anchor 插入元素的参照物
   */
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    //判断两个元素是否相同，不相同卸载在添加
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        }
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  //vnode 虚拟dom
  const render = (vnode, container) => {
    //渲染过程是用你传入的renderOptions来渲染
    if (vnode == null) {
      //卸载逻辑
      if (container._vnode) {
        //之前确实渲染过了， 那么就卸载掉dom
        unmount(container._vnode);
      }
    } else {
      //这里既有初始化的逻辑，又有更新的逻辑
      patch(container._vnode || null, vnode, container);
    }
  };

  return {
    render,
  };
}

/**
 * 更新的逻辑思考
 * 如果前后完全没关系， 删除老的 添加新的
 * 老的和新的一样，复用，属性可能不一样， 在对比属性，更新属性
 * 比儿子
 */
