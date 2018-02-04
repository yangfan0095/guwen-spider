/**
 * 提供具体函数处理方法
 */
const logger = require('../config/log');
const origin = 'http://so.gushiwen.org';
/**
 * sleep函数
 * @param {*} times 
 */
const sleep = async(times) => {
    logger.info('当前爬虫自动休眠' + times + 'ms');
    await new Promise((resolve) => {
        setTimeout(resolve, times);
    })
    return true;
}
/**
 * 抓取booklist用到的方法
 */

//通过闭包 生成keyName  @prefix 输入前缀
let count = 10000;
const prefix = 'gwbook';
const _getKeyName = (prefix) => {
    return prefix + count++;
}

/**
 * 根据传入参数 返回总页数链接数组
 * @param {Number} totalCount 
 * @param {String} baseUrl
 * @return {Array}  
 */
const getPageUrlList = (totalCount, baseUrl) => {
    let pageUrlList = [];
    for (let i = 1; i <= totalCount; i++) {
        pageUrlList.push(baseUrl + i);
    }
    return pageUrlList;
}

/**
 * 获取当前页 书籍信息保存在数组中
 * @param {*} $ 
 * @param {*} body 
 * @return {Array} BookList
 */
const getCurPageBookList = ($, body) => {
    let BookListDom = $('.sonspic .cont');
    let BookList = [];
    BookListDom.each((index, el) => {
        let obj = {
            key: _getKeyName(prefix),
            bookName: $(el).find('p b').text(), // 书名
            bookUrl: origin + $(el).find('p a').attr('href'), //书目链接
            bookDetail: $(el).find('p').eq(1).text().trim(), // 书籍介绍
            imageUrl: $(el).find('a img').attr('src'), //书籍图片地址
        }
        BookList.push(obj);
    })
    return BookList;
}
/**
 * 输入每一页抓取到的列表数组 组合成一个大的数组返回
 * @param {Array} arr 
 * @return {Array} res
 */
const getNewBookListArray = (arr) => {
    // return new Promise((resolve,reject)=>{

    // })
    let res = [];
    arr.map((child, index) => {
        res = res.concat(...child);
    });
    return res;
}


/**
 * 抓取chapterlist时 用到的方法
 */

/**
 * 获取一级章节内所有二级章节名 和对应url
 * @param {*} $ 
 * @param {*} selector 
 */
const getListUrlAndTitle = ($, selector) => {
    let arr = [];
    $(selector).find('a').map((i, el) => {
        let obj = {
            title: $(el).text(),
            url: origin + $(el).attr('href')
        }
        arr.push(obj);
    })
    return arr;
}


/**
 * 遍历二级章节 返回集合 行数据
 * @param {*} chapterList 
 * @param {*} bookInfo 
 */
const getSectionFromChapter = (chapterList = [], bookInfo) => {
    let sectionArr = [];
    chapterList.map((item, index) => {
        let tempArr = item.list.map((childItem, index) => {
            return {
                chapter: item.chapter,
                section: childItem.title,
                url: childItem.url,
                key: bookInfo.key,
                bookName: bookInfo.bookName,
                author: bookInfo.author,
            };
        });
        sectionArr = sectionArr.concat(tempArr);
    });
    return sectionArr;
}

const replaceStr = function (str, reg, replace) {
    if (!str) {
        return
    }
    return reg(str, replaceFront.reg, replaceFront.replace, curChapter[1]).replace(replaceEnd.reg, replaceEnd.replace)

}

const noResourceNotice = function (url, title, detail) {
    console.log('当前项：' + title + '  ' + detail + '  url :' + url);
    return ''
}

//正则替换
const reg = function (str, reg, replace, flag) {
    if (!str) {
        console.log(flag + ' 项没有数据')
        return
    } else {
        return str.replace(reg, replace)
    }

}
/**
 * 直接遍历dom获取翻译内容  用reg（）亦可 需要处理span  和h1
 * @param {*} $ 
 */
const getTranslate = ($) => {
    let tempArr= [];
    $('.shisoncont p').each((index,el)=>{
        tempArr.push($(el).text());
    });
    return tempArr.join('</br>');
}

// 替换为本正则匹配
const replaceFront = {
    reg: /<p.*?>/g,
    replace: ''
};
const replaceEnd = {
    reg: /<\/p.*?>/g,
    replace: '<br/>'
}

module.exports = {
    sleep,
    getPageUrlList,
    getCurPageBookList,
    getNewBookListArray,
    getListUrlAndTitle,
    getSectionFromChapter,
    replaceStr,
    noResourceNotice,
    reg,
    replaceFront,
    replaceEnd,
    getTranslate

};