const router = require('express').Router();
const designApi = require('./design.api');
const categoryApi = require('./category.api');

router.use('/design', designApi)
router.use('/category', categoryApi)

module.exports = router;
