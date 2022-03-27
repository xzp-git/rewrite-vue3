export const nodeOps = {
    insert(child, parent, anchor = null){
        parent.insertBefore(child, anchor)
    }
}