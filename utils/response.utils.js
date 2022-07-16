/**
 * Meant to log exceptions which are handled
 */

const error = err => ({
    status: false,
    message: err,
    data: {},
});
  
  
const message = (status, msg, data) => ({
    status,
    message: msg,
    data,
});

const success = (data, msg) => ({
    status: true,
    message: msg ? msg : 'success',
    data: data ? data : undefined,
});
  
const validateRequestObject = (object, parameters) => {
    for (let index = 0; index < parameters.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(object, parameters[index])) {
        return false;
        }
    }
    return true;
};

module.exports = {
    message,
    error,
    success,
    validateRequestObject,
};
  