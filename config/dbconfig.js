/**
 * mongoDB配置信息
 */
module.exports = {
    localUrl: 'localhost',
    originIp: '*',
    localPort: 27017,
    db: {
        guwenlist: 'stats',
        booklist: 'stats'
    },
    collection: {
        booklist: 'statslist',
    },
    options: {
        server: {
            poolSize: 5
        }
    }
}