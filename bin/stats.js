const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const logger = require('../config/log');
const initUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2016/';
const iconv = require('iconv-lite');
const {
    statsModel,
    townModel,
    cityModel,
    countyModel,
    villageModel,
    skipModel
} = require('../model/stats');
const bookHelper = require('../dbhelper/bookhelper');

let proviceList = [];
let cityClassList = [];
let countryZoneList = [];
let townZoneList = [];
let villageZoneList = [];

/**
 * 获取最外层数据
 * @param {*} $ 
 * @param {*} body 
 */
const getOuterDom = ($, body) => {
    let res = matchOutterFunc($, body, 'provincetable');
    return res;
}
const fetchCommonDeal = async (series, urlType, classType) => {
    let res = await getPageList(series[urlType], ($, body) => {
        let res = matchOutterFunc($, body, classType, series);
        return res;
    });
    let result = assignFunc(series, res);
    // await Promise.resolve(result);
    return result;
}
/**
 * 处理外层市级信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchCityClassPage = async (series, callback) => {
    logger.info(`获取市级信息，当前省为${series.proviceName}url地址为:  ${series.proviceUrl}`);
    let result = await fetchCommonDeal(series, 'proviceUrl', 'citytable');
    callback(null, result);
}
/**
 * 处理外层区县信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchCountryPage = async (series, callback) => {
    logger.info(`获取区县信息，当前市为${series.cityName}url地址为:  ${series.cityUrl}`);
    let result = await fetchCommonDeal(series, 'cityUrl', 'countytable');
    callback(null, result);
}
/**
 * 处理外层乡镇信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchTownPage = async (series, callback) => {
    logger.info(`获取乡镇信息，当前区县为${series.countyName}url地址为:  ${series.countyUrl}`);
    let result = await fetchCommonDeal(series, 'countyUrl', 'towntable');
    callback(null, result);
}
/**
 * 处理外层村级信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchVillagePage = async (series, callback) => {
    logger.info('获取信息，url地址为:' + series.villageUrl);
    logger.info(`获取村级信息，当前乡镇为${series.townName}url地址为:  ${series.townUrl}`);
    let result = await fetchCommonDeal(series, 'townUrl', 'villagetable');
    callback(null, result);
}

/**
 * 外层信息参数匹配及获取
 * @param {*} $ 
 * @param {*} body 
 */
const matchOutterFunc = ($, body, type, series) => {
    let res;
    let _urlSubString = (url) => {
        let lastIndex = url.lastIndexOf('/');
        let newStr = url.substring(0, lastIndex + 1);
        return newStr;
    }
    /**
     * 匹配省级数据
     */
    let _matchProviceData = () => {
        let result = [];
        $(body).find('.provincetable .provincetr td').map((index, el) => {
            let obj = {
                proviceCode: $(el).find('a').attr('href').replace('.html', ''),
                proviceName: $(el).find('a').text(),
                proviceHref: $(el).find('a').attr('href'),
                proviceUrl: initUrl + $(el).find('a').attr('href')
            }
            result.push(obj);
        });
        return result;
    }
    let _matchCityData = () => {
        let result = [];
        $('.citytable .citytr').map((index, el) => {
            let obj = {
                cityCode: $(el).find('td').eq(0).text(),
                cityName: $(el).find('td').eq(1).text(),
                cityHref: $(el).find('a').attr('href'),
                cityUrl: _urlSubString(series.proviceUrl) + $(el).find('a').attr('href'),
            }
            result.push(obj);
        });
        return result;
    }
    let result = [];
    switch (type) {
        case 'provincetable':
            res = _matchProviceData();
            break;
        case 'villagetable':
            $(body).find('.villagetable .villagetr').map((index, el) => {
                let obj = {
                    villageCode: $(el).find('td').eq(0).text(),
                    countyTownCode: $(el).find('td').eq(1).text(), //城镇分类代码
                    villageName: $(el).find('td').eq(2).text(), // 乡镇名称
                    villageHref: $(el).find('a').attr('href'),
                    villageUrl: _urlSubString(series.townUrl) + $(el).find('a').attr('href'),
                }
                result.push(obj);
            })
            res = result;
            break;
        case 'towntable':
            $(body).find('.towntable .towntr').map((index, el) => {
                let obj = {
                    townCode: $(el).find('td').eq(0).text(),
                    townName: $(el).find('td').eq(1).text(),
                    townHref: $(el).find('a').attr('href'),
                    townUrl: _urlSubString(series.countyUrl) + $(el).find('a').attr('href'),
                }
                result.push(obj);
            })
            res = result;
            break;
        case 'citytable':
            res = _matchCityData();
            break;
        case 'countytable':
            $(body).find('.countytable .countytr').map((index, el) => {
                let obj = {
                    countyCode: $(el).find('td').eq(0).text(),
                    countyName: $(el).find('td').eq(1).text(),
                    countyHref: $(el).find('a').attr('href'),
                    countyUrl: _urlSubString(series.cityUrl) + $(el).find('a').attr('href'),
                }
                result.push(obj);
            })
            res = result;
            break;
    }
    return res;
}
/**
 * 遍历完成数据处理
 * @param {*} result 
 */
const dealCallback = async (result) => {
    const list = await Promise.resolve(result);
    return list;
}
const saveData = async (Model, list) => {
    logger.info(`开始保存数据!`)
    let res = await bookHelper.addCreateCollection(Model, list);
    if (!res) {
        logger.error('数据库插入数据失败！，跳过执行下一行');
    }
    return res;
}


/**
 * 将父级信息拷贝到子项
 * @param {*} series 
 * @param {*} list 
 */
const assignFunc = (series, list) => {
    let res = list.map((item) => {
        return Object.assign({}, series, item);
    });
    return res;
}

// 得到各个省下面市级行政区， 将二维数组转化为一维数组。
const mapOneArray = (list) => {
    logger.info(`mapOneArray 开始处理数据`);
    let temp = list.reduce((child1, child2) => {
        return child1.concat(child2)
    })
    logger.info(`数组初始长度为${list.length} ，合并所有子项数组后长度为${temp.length}`);
    return temp;
}
const dealMongoData = (list) => {
    let res = list.map((item) => {
        return item._doc
    });
    return res;
}

/**
 * 初始化方法
 */
const init = async () => {
    // 批量查询, 严重消耗内存 ， 建议分段查询
    proviceList = await getPageList(initUrl, getOuterDom);
    cityClassList = await fetchAsync(proviceList, 1, fetchCityClassPage, dealCallback);
    cityClassList = mapOneArray(cityClassList);

    await saveData(cityModel, cityClassList);
    cityClassList = await bookHelper.queryFree(cityModel, {}, {
        __v: 0,
        _id: 0
    });
    cityClassList = dealMongoData(cityClassList);
    countryZoneList = await fetchAsync(cityClassList, 1, fetchCountryPage, dealCallback);
    countryZoneList = mapOneArray(countryZoneList);
    await saveData(countyModel, countryZoneList);
    countryZoneList = await bookHelper.queryFree(countyModel, {}, {
        __v: 0,
        _id: 0
    });
    countryZoneList = dealMongoData(countryZoneList);
    townZoneList = await fetchAsync(countryZoneList, 1, fetchCountryPage, dealCallback);
    townZoneList = mapOneArray(townZoneList);
    await saveData(townModel, townZoneList);

    villageZoneList = await fetchAsync(townZoneList, 1, fetchVillagePage, dealCallback);
    villageZoneList = mapOneArray(villageZoneList);
    await saveData(villageModel, villageZoneList);
    logger.info('抓取完毕，共计：' + villageZoneList.length + '条数据');

    //分段查询入口 
   // circleFetch();
}

/**
 * 根据区县数据循环获取乡镇数据
 */
let curLength = 0;
const circleFetch = async () => {
    curLength += 100;
    countryZoneList = await bookHelper.queryFree(countyModel, {}, {
        __v: 0,
        _id: 0
    }, 100, curLength);

    /**
     * 
     */
    let isDownload = await skipModel.find({
        skip: curLength,
        limit: 100
    });
    if (isDownload.length > 0) {
        logger.info(`当前数据已下载，skip${curLength} ,limit ${100} 进入下一轮`)
        circleFetch();
        return;
    }
    countryZoneList = dealMongoData(countryZoneList);
    await townModel.find({})
    townZoneList = await fetchAsync(countryZoneList, 1, fetchTownPage, dealCallback);
    townZoneList = mapOneArray(townZoneList);
    await saveData(townModel, townZoneList);
    await skipModel.create({
        skip: curLength,
        limit: 100
    });
    if (curLength < 3133) {
        logger.info(`当前100条数据抓取完成,总共已保存${curLength}条数据，进入下一轮抓取...`)
        setTimeout(function(){
            logger.info(`暂停5秒`)
             circleFetch();
        },5000)
    }
    if (curLength >= 3133) {
        logger.info(`当前数据抓取完成`)
    }
}
/**
 * 获取页面数据函数
 * @param {*} url  获取页面Url
 * @param {*} matchFunc  页面匹配函数 return 需要的数据
 */
const getPageList = async (url, matchFunc) => {

    const list = await new Promise((reslove, reject) => {
        request({
            encoding: null,
            url: url
        }, (err, response, body) => {
            if (err) {
                logger.info('当前链接发生错误，url地址为:' + url);
                reslove(null);
                return;
            } else {
                body = iconv.decode(body, 'gb2312');
                $ = cheerio.load(body, {
                    decodeEntities: false
                });
                let res = matchFunc($, body);
                reslove(res);
            }
        })
    });
    return list;
}

/**
 * 异步队列处理函数
 * @param {*} list 处理的链接数组
 * @param {*} n 并发数量
 * @param {*} fetchPage 单页处理函数
 * @param {*} dealCallback 
 */
const fetchAsync = async (list, n = 1, fetchPage, dealCallback) => {
    const result = await new Promise((resolve, reject) => {
        async.mapLimit(list, n, (series, callback) => {
            fetchPage(series, callback);
        }, async (err, result) => {
            if (err) {
                logger.error('当前抓取错误！');
                logger.error(err);
                resolve(null);
                return;
            }
            let res = await dealCallback(result);
            resolve(res);
        });
    });
    return result;
}
init();