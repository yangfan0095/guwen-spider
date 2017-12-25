/**
 * mongoDB配置信息
 */
module.exports = {
    localUrl: 'localhost',
    originIp: '*',
    localPort: 27017,
    db: {
        guwenlist: 'guwenBookList',
        booklist: 'guwenConentList'
    },
    collection: {
        booklist: 'booklist',
        chapterlist: 'chapterlist',
        contentlist: 'contentlist'
    },
    options: {
        server: {
            poolSize: 5
        }
    }
}