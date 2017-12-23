/**
 * 入口文件
 */
//抓取booklist 函数
const mongo = require('../model/guwen');
const bookListInit = require('./booklist');
const chapterListInit = require('./chapterlist');
const logger = require('../config/log');

/**
 * 爬虫抓取主入口
 */
const start = async() => {
    let booklistRes = await bookListInit();
    if (!booklistRes) {
        logger.warn('书籍列表抓取失败，程序终止...');
        return;
    }
    let chapterlistRes = await chapterListInit();
    if (!chapterlistRes) {
        logger.warn('书籍章节列表抓取失败，程序终止...');
        return;
    }
    // 根据章节列表 抓取对应的内容
    // getContent()
}

if (typeof bookListInit === 'function' && typeof chapterListInit === 'function') {
    // 开始抓取
    start();
}