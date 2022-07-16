const {Router} = require('express');

const ApiRoutes = require('./api');
const router = Router();
const path = require('path');

/**
 * @api {GET} /api Test api
 * @apiSuccess {Object} { success: boolean, message: string }
 */

router.get('/api/status', (req, res) => {
    res.status(200).json({status: true, message: 'API SUCCESS'});
});

// Capture and handle 404 error for apis
router.use('/api', ApiRoutes);
router.use('*', (req, res) => {
    console.log(req.url)
    logging.info('Not found!')
    res.sendFile(path.join(__dirname, '../public', '404.html'));
    // res.status(404).json({status: false, message: 'Not found!'});
});

//error middleware to send appropriate response
//note:- don't remove next from input parameter from below function
router.use(function (err, req, res, next) {
    console.log(err)
    return res.status(500).json({status: false, message: "Something went wrong"});
});
module.exports = () => router;
