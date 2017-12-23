/**
 *  内容相关
 */
const mongoose = require("mongoose");
const q = require('q');
const config = require('../config/conf');
mongoose.Promise = q.Promise;
const conno = mongoose.createConnection(`mongodb://${config.originIp}/${config.db.booklist}`, config.options);
mongoose.connection.on('connected', function () {
    console.log("数据库连接成功！");
});
// 内容集合
const bookItemSchema = mongoose.Schema({
    name: String,
    author: String,
    chapter: String,
    content: String,
    section: String,
    translator: String,
    translate: String,
    originUrl: String,
})

//保存出错的数据名称
const errorSpider = mongoose.Schema({
    chapter: String,
    section: String,
    url: String,
    key: String,
    bookName: String,
    author: String,
})
// 保存出错的数据名称 只保留key 和 bookName信息
const errorCollection = mongoose.Schema({
    key: String,
    bookName: String,
})
// 两个集合随便选一个就行。
const errContentModel = conno.model('errorSpider', errorSpider);
const errorCollectionModel = conno.model('errorCollection', errorCollection);

/**
 * 创建一个 model 
 * @param {*} collectionName 
 * @return {*} Model
 */
const getModel = (collectionName) => {
    return conno.model(collectionName, bookItemSchema)
}
module.exports = {
    getModel,
    errContentModel,
    errorCollectionModel
}