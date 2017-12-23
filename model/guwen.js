const mongoose = require("mongoose");
const q = require('q');
const config = require('../config/conf');
mongoose.Promise = q.Promise;
const conno = mongoose.createConnection(`mongodb://${originIp}/guwen`, config.options);
mongoose.connection.on('connected', function () {
    console.log("数据库连接成功！");
});
// 目录表
const bookMap = mongoose.Schema({
    dbName: String,
    bookName: String,
    bookUrl: String,
    bookDetail: String,
});
// 章节表
const chapterMap = mongoose.Schema({
    chapter: String,
    section: String,
    url: String,
    dbName: String,
    bookName: String,
    author: String,
})
const bookListModel = conno.model('booklists', bookMap);
const chapterListModel = conno.model('chapterlistBK', chapterMap);
module.exports = {
    bookListModel,
    chapterListModel
}