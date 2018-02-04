/**
 * 章节列表抓取
 */
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
    sleep,
    getListUrlAndTitle,
    getSectionFromChapter
} = require('../utils/utils');
const bookHelper = require('../dbhelper/bookhelper');
/**
 * 初始化入口
 */
const chapterListInit = async() => {
    const list = await bookHelper.getBookList(bookListModel);
    if (!list) {
        logger.error('初始化查询书籍目录失败');
    }
    logger.info('开始抓取书籍章节列表，书籍目录共：' + list.length + '条');
    let res = await asyncGetChapter(list);
    return res;
};

/**
 * 根据一级书目进入书籍页面 抓取书籍页面章节信息和章节链接
 * 遍历链接 发起并行抓取操作 这里设置并发为1
 * @param {*} list 
 */
const asyncGetChapter = (list) => {
    return new Promise((resolve, reject) => {
        async.mapLimit(list, 1, (series, callback) => {
            let doc = series._doc;
            let bookInfo = {
                key: doc.key,
                bookName: doc.bookName,
                author: doc.author,
            }
            getChapterInfo(doc.bookUrl, bookInfo, callback)
        }, (err, result) => {
            if (err) {
                reject(false);
                logger.error('章节数据抓取过程中出现异常:');
                logger.error(err);
                return;
            }
            resolve(true);
            logger.info('数据抓取结束:');
        })
    })
}
/**
 * 根据url  进入章节 执行爬虫任务
 * @param {*} url 
 * @param {*} bookInfo 
 * @param {*} callback 
 */
const getChapterInfo = (url, bookInfo, callback) => {
    logger.info('开始抓取:' + url);
    // 测试 : 'http://so.gushiwen.org/guwen/book_27.aspx'
    request(url, function (err, response, body) {
        let $, bookUrl = [],
            bookChapter = [];
        if (err) {
            logger.error('抓取页面信息失败，页面链接：' + url);
        }
        if (response && response.statusCode == 200) {
            $ = cheerio.load(body, {
                decodeEntities: false
            });
            bookName = $('.cont h1').text();
            $('.bookcont').map(function (i, el) {
                let $me, item;
                $me = $(this);
                item = {
                    chapter: $(el).find('strong').text(),
                    list: getListUrlAndTitle($, el),
                    content: ''
                }
                bookUrl.push(item)
            })
        }
        let sectionList = getSectionFromChapter(bookUrl, bookInfo);
        logger.info(bookInfo.bookName + '数据抓取结束,' + '开始保存...');
        saveMongoDB(sectionList, callback);
    })
}

/**
 * 保存数据到mongoDB 
 * 若抓取数据长度为空，执行下一条数据
 * 抓取数据与数据库保存数据默认条数相同，默认已存在，执行下一条数据。
 * 数据插入失败，进入下一组
 */
const saveMongoDB = async(chapterList, callback) => {
    let length = chapterList.length;
    let curkey = chapterList[0].key;
    let bookName = chapterList[0].bookName;
    if (length === 0) {
        logger.warn('抓取数据长度为空，执行下一条数据。' + 'bookName:' + bookName + 'key: ' + curkey);
        callback(null, null);
        return;
    }

    let dbLength = await bookHelper.getCollectionLength(chapterListModel, {
        key: curkey
    })

    if (dbLength === length) {
        logger.warn('抓取数据等于数据库保存数据条数，默认认为该书籍已存在，执行下一条数据。' + 'bookName:' + bookName + 'key: ' + curkey);
        callback(null, null);
        return;
    }
    let remoteBookList = await bookHelper.getCollectionByDistinct(chapterListModel, 'key');
    logger.info('当前数据库已保存' + remoteBookList.length);
    let num = Math.random() * 700 + 800;
    await sleep(num);
    let falg = await bookHelper.insertCollection(chapterListModel, chapterList);
    if (!falg) {
        logger.error('数据插入失败，进入下一组!' + 'bookName:' + bookName + 'key: ' + curkey);
        callback(null, null);
        return;
    }
    logger.info('数据保存成功!' + 'bookName:' + bookName + 'key: ' + curkey);
    callback(null, null);
}
module.exports = chapterListInit;