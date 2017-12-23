/**
 * mongoDB配置信息
 */
module.exports = {
    localUrl: 'localhost',
    originIp: '47.52.115.169',
    localPort: 27017,
    mongoDB: {
        booklist: 'booklistDB',
        chapterlist: 'chapterlistDB',
        contentlist:'contentlistDB'
    },
    options: {
        server: {
            poolSize: 5
        }
    }
}