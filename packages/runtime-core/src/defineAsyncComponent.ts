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
        }
    }
}