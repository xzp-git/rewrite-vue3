import { reactive, ReactiveEffect } from "@vue/reactivity";
import { invokeArrayFns, isNumber, isString, PatchFlags, ShapeFlags } from "@vue/shared";
import { createComponentInstance, renderComponent, setupComponent } from "./component";
import { getSequence } from "./getSequence";
import { queueJob } from "./scheduler";
import { hasPropsChanged, updateProps } from "./componentProps";

import { Text, createVnode, isSameVnode, Fragment } from "./vnode";

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
    if (isString(child) || isNumber(child)) {
      let vnode = createVnode(Text, null, child);
      children[i] = vnode;
    }
    return children[i];
  };

  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      //处理后要进行替换，否则children中存放的已经是字符串
      let child = normalize(children, i);
      patch(null, child, container, parentComponent);
    }
  };

  const mountElement = (vnode, container, anchor,parentComponent) => {
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
      mountChildren(children, el,parentComponent);
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

  const unmountChildren = (children,parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i],parentComponent);
    }
  };
  //比较两个儿子的差异
  const patchKeyChildren = (c1, c2, el,parentComponent) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    //sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el); //这样做就是比较两个节点的属性和子节点
      } else {
        break;
      }
      i++;
    }

    //sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //common sequence + mount
    //i要比e1大说明有新增的
    //i 和 e2 之间是新增的部分

    //有一方全部比较完毕了，要么就删除，要么就添加
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          //根据下一个人的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
      // common sequence + unmount
      // i比e2大说明有要卸载的
      // i到e1之间的就是要卸载的
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i],parentComponent);
          i++;
        }
      }
    }

    /**
     * 乱序对比
     */

    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = new Map();
    for (let i = s2; i < e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i); //记录新的虚拟节点 key 与索引的映射关系
    }

    //循环老的元素 看一下新的里面有没有 如果有说明要比较差异，没有要添加到列表中，老的有新的没有要删除

    const toBePatched = e2 - s2 + 1; //记录一下新的总数

    //记录是否比对过的映射表
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i]; //老的孩子
      // 用老的孩子去新的里面找
      let newIndex = keyToNewIndexMap.get(oldChild.key);

      if (newIndex === undefined) {
        unmount(oldChild,parentComponent);
      } else {
        //新的位置对应的老的位置，如果数组里放的值> 0 说明已经patch过了
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], el);
      }
    }
    //到了这一步是新老属性和儿子的对比，没有移动位置

    //获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexMap);

    //需要移动位置
    let j = increment.length - 1;
    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2;
      let current = c2[index]; //找到对应的虚拟节点
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
      if (newIndexToOldIndexMap[i] === 0) {
        patch(null, current, el, anchor);
      } else {
        if (increment[j] != i) {
          hostInsert(current.el, el, anchor);
        } else {
          j--;
        }
      }
    }
  };

  const patchChildren = (n1, n2, el,parentComponent) => {
    //比较两个虚拟节点的儿子的差异， el就是当前的父节点
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag; //之前的
    const shapeFlag = n2.shapeFlag; //之后的
    //文本 空的null 数组

    //比较两个儿子列表的差异
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1,parentComponent);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyChildren(c1, c2, el,parentComponent); //diff算法 全量比对
        } else {
          unmountChildren(c1,parentComponent);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el,parentComponent);
        }
      }
    }
  };


  const patchBlockChildren = (n1, n2,parentComponent) => {
    for(let i = 0; i < n2.dynamicChildren.length; i++){
      //树的递归比较 现在是数组的比较
      patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i],parentComponent)
    }
  }

  /**
   * 走到这一步代表两个节点是相同的，因为在patch中已经进行过判断了
   * @param n1
   * @param n2
   */
  const patchElement = (n1, n2,parentComponent) => {
    //先复用节点、在比较属性、在比较儿子
    let el = (n2.el = n1.el);
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    let {patchFlag} = n2;
    if(patchFlag & PatchFlags.CLASS ){
        if(oldProps.class !== newProps.class){
          
            hostPatchProp(el,'class',null,newProps.class)
        }
        // style .. 事件
    }else{
        patchProps(oldProps,newProps,el);
    }

    if (n2.dynamicChildren) { //元素之间的优化 靶向更新
     patchBlockChildren(n1, n2,parentComponent) 
    }else{
      patchChildren(n1, n2, el,parentComponent);
    }

    
  };
  const processElement = (n1, n2, container, anchor,parentComponent) => {
    if (!n1) {
      mountElement(n2, container, anchor,parentComponent);
    } else {
      //元素对比
      patchElement(n1, n2,parentComponent);
    }
  };

  const processFragment = (n1, n2, container,parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container,parentComponent);
    } else {
      patchChildren(n1, n2, container,parentComponent);
    }
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null //next 清空
    instance.vnode = next //实例上最新的虚拟节点
    updateProps(instance.props, next)
    console.log(instance);
    
  }
  const setupRenderEffect = (instance, container, anchor) => {
    const {render, vnode} = instance;
    const componentUpdateFn = () => {
      //区分是初始化 还是更新
      if (!instance.isMounted) {
        let {bm, m} = instance
        if (bm) {
          invokeArrayFns(bm)
        }
        //初始化
        const subTree = renderComponent(instance); //作为this 后续this 会改
        patch(null, subTree, container, anchor,instance); //创造了subTree的真实节点并且插入了
        
        instance.subTree = subTree;
        instance.isMounted = true;
        if (m) {
          invokeArrayFns(m)
        }
        
      } else {
        //组件内部更新

        let {next, bu, u} = instance
        if (next) {
          //更新前 我也需要拿到最新的属性来进行更新‘
          updateComponentPreRender(instance, next)
        }
        if (bu) {
          invokeArrayFns(bu)
        }
        const subTree = renderComponent(instance);
        patch(instance.subTree, subTree, container, anchor,instance);
        instance.subTree = subTree;
        if (u) {
          invokeArrayFns(u)
        }
      }
    };

    //组件的异步更新
    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(instance.update)
    );
    //我们将组件强制更新的逻辑保存到了组件的实例上，后续可以使用
    //调用effect.run可以让组件强制重新渲染
    let update = instance.update = effect.run.bind(effect);
    update();
  }

  const mountComponent = (vnode, container, anchor,parentComponent) => {


    // 1) 要创造一个组件的实例
    let instance = vnode.component = createComponentInstance(vnode,parentComponent)
    //2) 给实例上赋值
    setupComponent(instance)
    // 3) 创建一个effect
    setupRenderEffect(instance, container, anchor)
    

    
  };

  const shouldUpdateComponent = (n1, n2) => {
    const {props:prevProps, children: prevChildren} = n1;
    const {props:nextProps, children: nextChildren} = n2;
    if(prevProps === nextProps) return false;
    if (prevChildren || nextChildren) {
      return true
    }
    return hasPropsChanged(prevProps, nextProps)
  }

  const updateComponent = (n1, n2) => {
    
    //instance.props 是响应式的，而且可以更改，属性的更新会导致页面重新渲染
    //对于元素而言，复用的是dom节点，复用的是dom节点，对于组件来说复用的实例 
    const instance = (n2.component = n1.component)

    //需要更新就强制调用组件的update方法
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2; //将新的虚拟节点放到next属性上
      instance.update(); //统一调用update方法来更新
    }

  }

  //统一处理组件，里面在区分是普通的还是 函数式组件
  const processComponent = (n1, n2, container, anchor,parentComponent) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor,parentComponent);
    } else {
      //组件更新靠的是props
      updateComponent(n1, n2)
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
  const patch = (n1, n2, container, anchor = null,parentComponent = null) => {
    if (n1 === n2) return;
    //判断两个元素是否相同，不相同卸载在添加
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1,parentComponent);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment: //无用的标签
        processFragment(n1, n2, container,parentComponent);
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor,parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor,parentComponent);
        }else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(n1, n2, container, anchor, {
            mountChildren,
            patchChildren,
            move(vnode, container){
              hostInsert(vnode.component?vnode.component.subTree.el:vnode.el, container)
            }
          })
        }
    }
  };
  const unmount = (vnode,parentComponent) => {
    hostRemove(vnode.el);
  };
  //vnode 虚拟dom
  const render = (vnode, container) => {
    //渲染过程是用你传入的renderOptions来渲染
    if (vnode == null) {
      //卸载逻辑
      if (container._vnode) {
        //之前确实渲染过了， 那么就卸载掉dom
        unmount(container._vnode, null);
      }
    } else {
      //这里既有初始化的逻辑，又有更新的逻辑
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
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
