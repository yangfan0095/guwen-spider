/**
 * 日志配置
 */
const log4js = require('log4js');
log4js.configure({
    appenders: {
        ruleConsole: {
            type: 'console'
        },
        ruleFile: {
            type: 'dateFile',
            filename: 'logs/server-',
            pattern: 'yyyy-MM-dd.log',
            maxLogSize: 1000 * 1000 * 1000,
            numBackups: 3,
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {
            appenders: ['ruleConsole', 'ruleFile'],
            level: 'info'
        }
    }

});
const logger = log4js.getLogger('appenders');
module.exports = logger;