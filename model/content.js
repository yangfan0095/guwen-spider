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
    title: String,
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
const errContentModel = conno.model('errorSpider', errorSpider);

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
    errContentModel
}