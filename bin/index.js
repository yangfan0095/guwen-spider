/**
 * 入口文件
 */
//抓取booklist 函数
const mongo = require('../model/guwen');
const bookListInit = require('./booklist');
const chapterListInit = require('./chapterlist');
const contentListInit = require('./content');
const logger = require('../config/log');

/**
 * 爬虫抓取主入口
 */
const start = async() => {
    let booklistRes = await bookListInit();
    if (!booklistRes) {
        logger.warn('书籍列表抓取出错，程序终止...');
        return;
    }
    logger.info('书籍列表抓取成功，现在进行书籍章节抓取...');

    let chapterlistRes = await chapterListInit();
    if (!chapterlistRes) {
        logger.warn('书籍章节列表抓取出错，程序终止...');
        return;
    }
    logger.info('书籍章节列表抓取成功，现在进行书籍内容抓取...');

    let contentListRes = await contentListInit();
    if (!contentListRes) {
        logger.warn('书籍章节内容抓取出错，程序终止...');
        return;
    }
    logger.info('书籍内容抓取成功');
}
// 开始入口
if (typeof bookListInit === 'function' && typeof chapterListInit === 'function') {
    // 开始抓取
    start();
}