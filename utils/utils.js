/**
 * 提供具体函数处理方法
 */
const logger = require('../config/log');
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
 * 获取一级章节内所有二级章节名 和对应url
 * @param {*} $ 
 * @param {*} selector 
 */
const getListUrlAndTitle = function ($, selector) {
    let arr = [];
    $(selector).find('a').map(function (i, el) {
        let obj = {
            title: $(el).text(),
            url: origin + $(el).attr('href')
        }
        arr.push(obj)
    })
    return arr
}

/**
 * 遍历二级章节 返回文档 行数据
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
                dbName: bookInfo.dbName,
                bookName: bookInfo.bookName,
                author: bookInfo.author,
            };
        });
        sectionArr = sectionArr.concat(tempArr);
    });
    return sectionArr;
}
module.exports = {
    sleep,
    getListUrlAndTitle,
    getSectionFromChapter
};