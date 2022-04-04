import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { initProps } from "./componentProps";

export let curretnInstance = null
export const setCurrentInstance = (instance) => curretnInstance = instance
export const getCurrentInstance = () => curretnInstance


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

function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children; //保留children
  }
}
const publicPropertyMap = {
  $attrs:(i) => i.attrs,
  $slots:(i) => i.slots
}

const publicInstanceProxy = {
  get(target, key){
    const {data, props, setupState ={}} = target
    if (data && hasOwn(data, key)) {
      return data[key]
    }else if (hasOwn(setupState,key)) {
      return setupState[key]
    }else if (props && hasOwn(props, key)) {
      return props[key]
    }
    //this.$attrs
    let getter = publicPropertyMap[key]
    if (getter) {
      return getter(target)
    }
  },
  set(target, key, value){
    const {data, props, setupState ={}} = target
    if (data && hasOwn(data, key)) {
       data[key] = value
    }else if (hasOwn(setupState,key)) {
       setupState[key] = value
    }else if (props && hasOwn(props, key)) {
       console.warn(`attempting to mutate prop ${key}`)
      return false
    }

    return true
  }
}

export const setupComponent = (instance) => {
  let { props, type, children  } = instance.vnode;

  //props 是指创建虚拟节点时传入的 props
  initProps(instance, props)
  initSlots(instance, children) //初始化插槽
  instance.proxy = new Proxy(instance, publicInstanceProxy)
  let data= type.data;
  if (data) {
    if(!isFunction(data)) return console.warn('data options must be a function')
    instance.data = reactive(data.call(instance.proxy))
  }

  let setup = type.setup
  if (setup) {
    const setupContext = { //典型的发布订阅模式
      emit:(event, ...args) => { //事件的实现原理
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`
        //找到虚拟节点的属性存放props 
        const handler = instance.vnode.props[eventName]
        handler && handler(...args)
      },
      attrs:instance.attrs,
      slots:instance.slots
    }
    setCurrentInstance(instance)
    const setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)

    if (isFunction(setupResult)) {
      instance.render = setupResult
    }else if (isObject(setupResult)) {
      // 对内部的ref 进行取消.value
      instance.setupState = proxyRefs(setupResult)
    }
  }



  if(!instance.render){
    instance.render = type.render
  }
}