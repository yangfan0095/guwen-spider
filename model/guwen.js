/**
 * guwenlist 目录相关
 */
const mongoose = require("mongoose");
const q = require('q');
const config = require('../config/conf');
mongoose.Promise = q.Promise;
const conno = mongoose.createConnection(`mongodb://${config.localUrl}/${config.db.guwenlist}`, config.options);
mongoose.connection.on('connected', function () {
    console.log("数据库连接成功！");
});
// 目录表
const bookMap = mongoose.Schema({
    key: String,
    bookName: String,
    bookUrl: String,
    bookDetail: String,
    imageUrl: String
});
// 章节表
const chapterMap = mongoose.Schema({
    chapter: String,
    section: String,
    url: String,
    key: String,
    bookName: String,
    author: String,
})
const bookListModel = conno.model('booklistsBK', bookMap);
const chapterListModel = conno.model('chapterlistBK', chapterMap);
module.exports = {
    bookListModel,
    chapterListModel
}