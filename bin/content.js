/**
 * 书籍内容抓取
 */
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const logger = require('../config/log');
const bookHelper = require('../dbhelper/bookhelper');
const {
    bookListModel,
    chapterListModel
} = require('../model/guwen');
const {
    errContentModel,
    errorCollectionModel,
    getModel
} = require('../model/content');
const {
    sleep,
    replaceStr,
    noResourceNotice,
    reg,
    replaceFront,
    replaceEnd,
    getTranslate
} = require('../utils/utils');

/**
 * 内容抓取之前，我们已经获取到了大量的章节链接列表。 本项目获取到的有接近3万个链接。
 * 因此不能直接查询所有放到一个数组里面来做遍历。普遍的遍历方式 是每次查询一定的数量，来做抓取，
 * 这样缺点是只是以一定数量做分类，数据之间没有关联，一批量方式进行插入，如果出错 则容错会有很大困难。
 * 这里我们通过key 来给数据做分类，每次按照key来获取链接，进行遍历，这样的好处是保存的数据是一个整体，
 * 可以以整体的方式进行插入， 也可以以每一篇文章的形式插入数据库。 两者各有利弊。 准备了两个错误保存的
 * 集合,errContentModel, errorCollectionModel,在插入出错时 分别保存信息到对应的集合中，二者任选其一即可。
 * 增加集合来保存数据的原因是 便于一次性查看以及后续操作， 不用看日志。
 * 我们将每一条书籍信息的内容 放到一个新的集合中，集合以key来进行命名。
 * 
 * 
 * 内容抓取步骤：
 * 第一步得到书籍列表， 通过书籍列表查到一条书籍记录下 对应的所有章节列表， 
 * 第二步 对章节列表进行遍历获取内容保存到数据库中 
 * 第三步 保存完数据后 回到第一步 进行下一步书籍的内容抓取和保存
 */

/**
 * 初始化入口
 */
const contentListInit = async() => {
    //获取书籍列表
    const list = await bookHelper.getBookList(bookListModel);
    if (!list) {
        logger.error('初始化查询书籍目录失败');
        return;
    }
    const res = await mapBookList(list);
    if (!res) {
        logger.error('抓取章节信息，调用 getCurBookSectionList() 进行串行遍历操作，执行完成回调出错，错误信息已打印，请查看日志!');
        return;
    }
    return res;
}
/**
 * 遍历书籍目录下的章节列表
 * @param {*} list 
 */
const mapBookList = (list) => {
    return new Promise((resolve, reject) => {
        async.mapLimit(list, 1, (series, callback) => {
            let doc = series._doc;
            getCurBookSectionList(doc, callback);
        }, (err, result) => {
            if (err) {
                logger.error('书籍目录抓取异步执行出错!');
                logger.error(err);
                reject(false);
                return;
            }
            resolve(true);
        })
    })
}

/**
 * 获取单本书籍下章节列表 调用章节列表遍历进行抓取内容
 * @param {*} series 
 * @param {*} callback 
 */
const getCurBookSectionList = async(series, callback) => {

    let num = Math.random() * 1000 + 1000;
    await sleep(num);
    let key = series.key;
    const res = await bookHelper.querySectionList(chapterListModel, {
        key: key
    });
    if (!res) {
        logger.error('获取当前书籍: ' + series.bookName + ' 章节内容失败，进入下一部书籍内容抓取!');
        callback(null, null);
        return;
    }
    //判断当前数据是否已经存在
    const bookItemModel = getModel(key);
    const contentLength = await bookHelper.getCollectionLength(bookItemModel, {});
    if (contentLength === res.length) {
        logger.info('当前书籍：' + series.bookName + '数据库已经抓取完成，进入下一条数据任务');
        callback(null, null);
        return;
    }
    await mapSectionList(res);
    callback(null, null);
}
/**
 * 遍历单条书籍下所有章节 调用内容抓取方法
 * @param {*} list 
 */
const mapSectionList = (list) => {
    return new Promise((resolve, reject) => {
        async.mapLimit(list, 1, (series, callback) => {
            let doc = series._doc;
            getContent(doc, callback)
        }, (err, result) => {
            if (err) {
                logger.error('书籍目录抓取异步执行出错!');
                logger.error(err);
                reject(false);
                return;
            }
            const bookName = list[0].bookName;
            const key = list[0].key;

            // 以整体为单元进行保存
            saveAllContentToDB(result, bookName, key, resolve);

            //以每篇文章作为单元进行保存
            // logger.info(bookName + '数据抓取完成，进入下一部书籍抓取函数...');
            // resolve(true);

        })
    })
}

/**
 * 对单个章节Url进行内容抓取 ，返回抓取数据
 * @param {*} series 
 * @param {*} callback 
 */
const getContent = (series, callback) => {
    request(series.url, (err, response, body) => {
        if (err) {
            logger.error('当前章节链接打开失败，链接为：' + series.url + ',即将将该条数据信息保存到error集合中...');
            callback(null, null)
            return
        };
        let $ = cheerio.load(body, {
            decodeEntities: false
        });
        //获取当前二级标题和三级标题
        let curChapter = $('.cont').find('h1').html() ? $('.cont').find('h1').html().replace(/<[^>].*>/g, '').trim() : '';
        let obj = {
            name: series.bookName,
            author: $('.source a').text(),
            chapter: series.chapter,
            section: series.section,
            translator: $('.right .source span').eq(1).text(),
            content: $('.contson').html() ? reg($('.contson').html(), replaceFront.reg, replaceFront.replace, curChapter[1]).replace(replaceEnd.reg, replaceEnd.replace) : noResourceNotice(series.url, curChapter, '没有内容'),
            // translate: $('.shisoncont').html() ? reg($('.shisoncont').html(), replaceFront.reg, replaceFront.replace).replace(replaceEnd.reg, replaceEnd.replace).replace(/<[^>|^br].*?>/g, '') : noResourceNotice(series.url, curChapter, ' 没有翻译'),
            translate: $('.shisoncont').html() ? getTranslate($) : noResourceNotice(series.url, curChapter, ' 没有翻译'),
            originUrl: series.bookUrl
        }


        /** 抓取完一篇内容 就直接插入到数据库， 这样有主要有三点好处，1 数据不易丢失， 2 如果以整个书籍最循环抓取完毕再保存数据，
         * 有的数据会很大（如几百章 也就意味着一次性要缓存几百个页面数据，最后插入到数据库），3 容错机制较好，如果这个页面出错可以将完整
         * 的章节集合内行数据保存到一个收集错误的表中。，缺点是太慢！
         * 可以做一个缓存器一次性保存一定条数 当条数达到再做保存。
         **/
        //logger.info('书籍名： ' + series.bookName + ' 章节或篇名：' + series.section + ' 抓取完毕，开始保存到数据库...');
        // saveContentToDB(obj, series, callback);
        logger.info('书籍名： ' + series.bookName + ' 章节或篇名：' + series.section + ' 抓取完毕，开始抓取下一篇...');
        callback(null, obj);
    });
}

/**
 * 保存数据到mongoDB
 * @param {*} list 该书籍下所有章节内容列表
 */
// const saveContentToDB = async(list, series, callback) => {
//     const BookItemModel = getModel(series.key);
//     let flag = await bookHelper.insertCollection(BookItemModel, list);
//     if (!flag) {
//         logger.info('书籍名： ' + series.bookName + ' 章节或篇名：' + series.section + '抓取保存失败,本条数据将被保存到errContentModel集合中');
//         await bookHelper.insertCollection(errContentModel, series);
//     }
//     logger.info('书籍名： ' + series.bookName + ' 章节或篇名：' + series.section + ' 保存成功！');
//     callback(null, null);
// }
const saveAllContentToDB = async(result, bookName, key, resolve) => {
    const BookItemModel = getModel(key);
    logger.info('当前书籍：' + bookName + '抓取完成，开始保存...');
    let flag = await bookHelper.addCreateCollection(BookItemModel, result);
    if (!flag) {
        logger.info('书籍名： ' + bookName + '抓取保存失败,本条数据将被保存到errorCollectionModel集合中');
        await bookHelper.insertCollection(errorCollectionModel, {
            key: key,
            bookName: bookName
        });
        resolve(true);
        return;
    }
    logger.info('书籍名： ' + bookName + ' 整体保存成功！');
    resolve(true);
}

module.exports = contentListInit;