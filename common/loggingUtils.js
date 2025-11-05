const {sendMessageToChannel, SUPPORTED_CHANNELS} = require("./rabbitMqUtils");
/**
 * Sends a log to the logging service
 * @param logMessage : string - contents of the log
 * @param logType : string - the type of log. only types declared in LOG_TYPE are supported
 */
const LOG_TYPE = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    ERROR: "ERROR"
}


function sendLog(logMessage, logType = "DEBUG") {
    sendMessageToChannel({
        logMessage,
        logType,
        time: new Date(),
    }, SUPPORTED_CHANNELS.LOG);
}

module.exports = { LOG_TYPE, sendLog }