/**
 *  内容相关
 */
const mongoose = require("mongoose");
const q = require('q');
mongoose.Promise = q.Promise;
let options = {
    server: {
        poolSize: 5
    }
}
let conno = mongoose.createConnection('mongodb://localhost/stats', options);
mongoose.connection.on('connected', function () {
    console.log("远程数据库 连接成功");
})
// 内容集合
const statsSchema = mongoose.Schema({
    proviceCode: String,
    proviceName: String,
    proviceHref: String,
    villageCode: String,
    villageName: String,
    villageHref: String,
    townCode: String,
    townName: String,
    townHref: String,
    cityCode: String,
    cityName: String,
    cityHref: String,
    countyCode: String,
    countyName: String,
    countyHref: String,
    proviceUrl: String,
    villageUrl: String,
    townUrl: String,
    cityUrl: String,
    countyUrl: String,
    countyTownCode:String,

});
// 城市
const citySchema = mongoose.Schema({
    proviceCode: String,
    proviceName: String,
    proviceHref: String,
    cityCode: String,
    cityName: String,
    cityHref: String,
    proviceUrl: String,
    cityUrl: String,

});
const skipSchema = mongoose.Schema({
    limit:Number,
    skip:Number
});
const statsModel = conno.model('stats', statsSchema);
const townModel = conno.model('town', statsSchema);
const cityModel = conno.model('cities', citySchema);
const countyModel = conno.model('county', statsSchema);
const villageModel = conno.model('village', statsSchema);
const skipModel = conno.model('skip', skipSchema);

module.exports = {
    statsModel,
    townModel,
    cityModel,
    countyModel,
    villageModel,
    skipModel
}