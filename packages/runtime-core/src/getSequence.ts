export function getSequence(arr: number[]) {
  const len = arr.length;
  const result = [0]; //以默认第0个为基准来做序列

  const p = new Array(len).fill(0); //最后要标记索引的前一个是谁

  let start;
  let end;
  let middle;
  let resultLastIndex;
  for (let i = 0; i < len; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      if (arrI !== 0) {
        //因为vue里面的序列0 意味着没有意义
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          //比较最后一项和当前项的值，如果比最后一项大，则将当前索引放到结果集中
          result.push(i);
          p[i] = resultLastIndex; //当前放到末尾的要记住他前面的那个人是谁
          continue;
        }

        start = 0;
        end = result.length - 1;
        while (start < end) {
          middle = start + ((end - start) >> 1);

          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
      }
      //找到中间值后， 我们需要做替换操作 start/end
      if (arr[result[end]] > arrI) {
        //这里用当前这一项 替换掉已有的比当前大的哪一项，更有潜力的我需要它
        result[end] = i;
        p[i] = result[end - 1]; //记住他的前一个人是谁
      }
    }
  }

  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    //倒叙追溯
    result[i] = last; // 最后一项是确定的
    last = p[last];
  }
  return result;
}
