import { NodeTypes } from "./ast";

function createParserContext(template) {
    
    return {
        line:1,
        column:1,
        offset:0,
        source:template, //此字段会被不停的进行解析 slice
        originalSource:template
    }
}

function isEnd(context) {
    const source = context.source

    return !source
}

function getCursor(context) {
    let {line, column, offset} = context

    return {line, column, offset}
}

function advancePositionMutation(context, source, endIndex) {
    let linesCount = 0

    let linePos = -1
    for(let i = 0; i < endIndex; i++){
        if (source.charCodeAt(i) == 10) {
            linesCount++
            linePos = i //第几个字符换行了
        }
    }

    context.line += linesCount
    context.offset += endIndex
    context.column = linePos == -1? context.column + endIndex : endIndex - linePos

}


function advanceBy(context, endIndex) {
    //每次删掉内容的时候 都要更新最新的行列和偏移量信息
    let source = context.source
    advancePositionMutation(context, source, endIndex)
    context.source = source.slice
}


function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex)

    advanceBy(context, endIndex)
    
    return rawText
}

function getSelection(context, start, end?) {
    end = end || getCursor(context)

    return {
        start,
        end,
        source:context.originalSource.slice(start.offset, end.offset)
    }
}


function parseText(context) {
    //在解析文本的时候，要看 后面到哪里结束
    let endTokens = ['<', '{{']

    let endIndex = context.source.length //默认认为到最后结束

    for(let i = 0; i < endTokens.length; i++){
        let index = context.source.indexOf(endTokens[i], 1)
        //找到了 并且第一次比整个字符串小
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }

    //创建 行列信息
    const start = getCursor(context) //开始

    //取内容
    const content = parseTextData(context, endIndex)
    
    return {
        type:NodeTypes.TEXT,
        content:content,
        loc:getSelection(context, start)
    }

}







function parse(template) {
    //创建一个解析的上下文 来进行处理
    const context = createParserContext(template)

    const nodes = []

    while (!isEnd(context)) {
        const source = context.source
        let node
        if (source.startsWith('{{')) {
            node = 'xxx'
        }else if (source[0] === '<') {
            node = '111'
        }
        //文本
        if (!node) {
            node = parseText(context)
        }
        nodes.push(node)
        console.log(nodes)
        break
    }
}




export function compile(template) {
    
    //将模板转成抽象语法树
    const ast = parse(template)//这里需要将html语法转换成js语法，编译原理
    
    return ast

    //对ast语法树 进行一些预先处理
    // transform(ast) 会生成一些信息


    //代码生成


    // return generate(ast) 最终生成代码 和vue的过程一样 
}