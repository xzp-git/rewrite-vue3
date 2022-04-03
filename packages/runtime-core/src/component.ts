import { reactive } from "@vue/reactivity";
import { isFunction } from "@vue/shared";
import { initProps } from "./componentProps";



export const createComponentInstance = (vnode) => {
    

    const instance = {
      //组件的实例
      data:null,
      vnode,
      subTree: null, //vnode组件的虚拟节点， subTree渲染的组件内容
      isMounted: false,
      update: null,
      propsOptions:vnode.type.props,
      props:{},
      attrs:{},
      proxy:null,
      render:null,
      setupState:{},
      slots:{} // 这里就是插槽相关内容
    };
    return instance
}


export const setupComponent = (instance) => {
  let { props, type, children  } = instance.vnode;

  //props 是指创建虚拟节点时传入的 props
  initProps(instance, props)
  let data= type.data;
  if (data) {
    if(!isFunction(data)) return console.warn('data options must be a function')
    instance.data = reactive(data.call(instance.proxy))
  }
}