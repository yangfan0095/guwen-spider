/**
 * 处理外层市级信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchCityClassPage = async (series, callback) => {
    await getPageList(series.url, matchOutterFunc);
}

/**
 * 处理外层区县信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchCountryPage = async (series, callback) => {
    await getPageList(series.countryUrl, matchOutterFunc);
}
/**
 * 处理外层乡镇信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchCountryPage = async (series, callback) => {
    await getPageList(series.townUrl, matchOutterFunc);
}
/**
 * 处理外层村级信息
 * @param {*} series 
 * @param {*} callback 
 */
const fetchVillagePage = async (series, callback) => {
    await getPageList(series.villageUrl, matchOutterFunc);
}

/**
 * 外层信息参数匹配及获取
 * @param {*} $ 
 * @param {*} body 
 */
const matchOutterFunc = ($, body) => {

}
/**
 * 遍历完成数据处理
 * @param {*} result 
 */
const dealCallback = (result) => {
    return result;
}

module.exports = {
    fetchCityClassPage,
    fetchCountryPage

}