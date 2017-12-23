//获取一级书目信息
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const logger = require('../config/log');
const {
    bookListModel,
    chapterListModel
} = require('../model/guwen');
const {
    getPageUrlList,
    getCurPageBookList,
    getNewBookListArray
} = require('../utils/utils');
const bookHelper = require('../dbhelper/bookhelper');

//所有基准url  需要根据爬取页面自己配置
const origin = 'http://so.gushiwen.org';
const website = 'http://so.gushiwen.org/guwen/book_5.aspx';
const baseUrl = 'http://so.gushiwen.org/guwen/Default.aspx?p=';
const totalListPage = 18;

//初始化
const bookListInit = (callback) => {
    logger.info('抓取书籍列表开始...');
    const pageUrlList = getPageUrlList(totalListPage, baseUrl);
    getBookList(pageUrlList, callback);
}

/**
 * 遍历url数组 进行并行爬取数据 
 * 这里需要保存的数据就是一个几十页的目录数组。我认为就是一个很简单的数据对象，
 * 分分钟就可完成抓取，所以在保存时是以整体数据为单位进行保存的。 没有去做查询去重(这样做把实际上是简单的事情变复杂了)，
 * 是否当前某条数据抓取错误等等操作。如果抓取失败，首先可以通过日志找到是哪些书籍，然后手动删除集合重新抓取即可
 * @param {*} pageUrlList 
 * @param {*} callback  这个参数如果传入，书籍列表抓取完成后可执行下一步操作。
 */
const getBookList = (pageUrlList, callback) => {
    async.mapLimit(pageUrlList, 3, (series, callback) => {
        getCurPage(series, callback)
    }, (err, result) => {
        if (err) {
            logger.error('书籍目录抓取异步执行出错!');
            logger.error(err);
            return;
        }
        let booklist = getNewBookListArray(result);
        saveDB(booklist, callback);
    })
}

/**
 * 抓取当前页书籍信息
 * @param {*} bookUrl 
 * @param {*} callback 
 */
const getCurPage = (bookUrl, callback) => {
    request(bookUrl, (err, response, body) => {
        if (err) {
            logger.info('当前链接发生错误，url地址为:' + bookUrl);
            callback(null, null);
            return;
        } else {
            $ = cheerio.load(body, {
                decodeEntities: false
            });
            let curBookName = $('.sonspic h1').text();
            let curBookList = getCurPageBookList($, body);
            callback(null, curBookList);
        }
    })
}
/**
 * 保存数据到mongoDB
 * @param {*} result 
 * @param {*} callback 
 */
const saveDB = async(result, callback) => {
    let falg = await bookHelper.insertCollection(bookListModel, result);
    if (!falg) {
        logger.error('书籍目录数据保存失败');
        return;
    }
    logger.info('数据保存成功! 总条数为：' + result.length + '条书籍目录信息');
    logger.info('完成一级目录数据抓取和保存');
    //判断是否有回调 有则执行回调函数
    if (typeof callback === 'function') {
        callback();
    }
}

module.exports = bookListInit;