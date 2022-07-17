const router = require('express').Router();
const DesignController = require('../controllers/DesignController')
var validation = require('../validations/DesignValidation');
const schemaValidator = require('../middlewares/schemaValidator');

router.post('/', schemaValidator(validation.createDesign), DesignController.createDesign)

router.patch('/:id', schemaValidator(validation.updateDesign), DesignController.updateDesign)

router.delete('/:id', DesignController.deleteDesign)

router.get('/:id', DesignController.getDesign)

router.post('/designno', DesignController.getDesignByNumber)

router.post('/designnobycategory', DesignController.getDesignNumberByCategory)

router.get('/list/all', schemaValidator(validation.getAllDesigns), DesignController.getAllDesigns)

router.post('/print/barcode', schemaValidator(validation.printDesigns), DesignController.printDesigns)

router.post('/generatePDF', DesignController.generatePDF)

router.post('/savedesignpdf', DesignController.saveDesignsPDF)

module.exports = router