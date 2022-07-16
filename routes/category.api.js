const router = require('express').Router();
const CategoryController = require('../controllers/CategoryController')
const CategoryValidation = require('../validations/CategoryValidation')
const schemaValidator = require('../middlewares/schemaValidator');

router.post('/', schemaValidator(CategoryValidation.createCategory), CategoryController.createCategory)

router.get('/list/all', CategoryController.getAllCategorys)

router.patch('/:id', schemaValidator(CategoryValidation.updateCategory), CategoryController.updateCategory)

router.delete('/:id', CategoryController.deleteCategory)

module.exports = router