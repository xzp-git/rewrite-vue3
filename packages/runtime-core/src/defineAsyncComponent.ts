import { ref } from "@vue/reactivity"
import { h } from "./h";
import { Fragment } from "./vnode"

export function defineAsyncComponent(options) {
    if (typeof options === 'function') {
        options = {loader:options}
    }

    return {
        setup() {
            const loaded = ref(false)
            const error = ref(false)
            const loading = ref(false);
            const {loader,timeout,errorComponent,delay,loadingComponent,onError} = options;
            
            if (delay) {
                setTimeout(() => {
                    loading.value = true
                }, delay)
            }
            let Comp = null
            function load() {
                return loader().catch(err => {
                  if (onError) {
                      return new Promise((resolve, reject) => {
                        const retry = () => resolve(load())
                        const fail = () => reject(err)
                        onError(err, retry, fail)
                      })
                  }   
                })
            }
            load().then(c => {
                Comp = c
                loaded.value = true
            }).catch(err => error.value = err).finally(() => {
                loading.value = false
            })

            setTimeout(() => {
                error.value = true
            }, timeout)

            return () => {
                if (loaded.value) {
                    return h(Comp)
                }else if (error.value && errorComponent) {
                    return h(errorComponent)
                }else if (loading.value && loadingComponent) {
                    return h(loadingComponent)
                }
                return h(Fragment,{}, []); // 无意义渲染
            }
        
        }
    }
}