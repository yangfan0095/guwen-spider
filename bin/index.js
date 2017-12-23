/**
 * 入口文件
 */
//抓取booklist 函数
const mongo = require('../model/guwen');
const bookListInit = require('./booklist');
const chapterListInit = require('./chapterlist');

if (typeof bookListInit === 'function' && typeof chapterListInit === 'function') {
    bookListInit(chapterListInit);
}