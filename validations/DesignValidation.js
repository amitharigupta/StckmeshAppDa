const Joi = require('joi');

module.exports={
    createDesign: Joi.object().keys({
        categoryId: Joi.number().required(),
        designNumber: Joi.string().allow(null).required(),
        imageName: Joi.string().allow(null).allow(''),
        itemStatus: Joi.string().allow(null),
        grossWt: Joi.number().allow(null),
        stoneWt: Joi.number().allow(null),
        beadWt: Joi.number().allow(null),
        extraStoneWt: Joi.number().allow(null),
        netWt: Joi.number().allow(null),
        code: Joi.string().allow(null),
        color: Joi.string().allow(null),
        purity: Joi.number().allow(null),
        reserved1: Joi.string().allow(null),
        reserved2: Joi.string().allow(null),
        reserved3: Joi.string().allow(null),
        reserved4: Joi.string().allow(null),
        reserved5: Joi.string().allow(null),
        reserved6: Joi.string().allow(null),
        reserved7: Joi.string().allow(null),
        huid: Joi.string().allow(null)
    }),
    updateDesign: Joi.object().keys({
        categoryId: Joi.number().required(),
        designNumber: Joi.string().allow(null).required(),
        imageName: Joi.string().allow(null).allow(''),
        itemStatus: Joi.string().allow(null),
        grossWt: Joi.number().allow(null),
        stoneWt: Joi.number().allow(null),
        beadWt: Joi.number().allow(null),
        extraStoneWt: Joi.number().allow(null),
        netWt: Joi.number().allow(null),
        code: Joi.string().allow(null),
        color: Joi.string().allow(null),
        purity: Joi.number().allow(null),
        reserved1: Joi.string().allow(null),
        reserved2: Joi.string().allow(null),
        reserved3: Joi.string().allow(null),
        reserved4: Joi.string().allow(null),
        reserved5: Joi.string().allow(null),
        reserved6: Joi.string().allow(null),
        reserved7: Joi.string().allow(null),
        huid: Joi.string().allow(null)
    }),
    getAllDesigns: Joi.object().keys({
        page: Joi.number().allow(null),
        limit: Joi.number().allow(null),
    })
    .and('page','limit'),
    printDesigns: Joi.object().keys({
        designIds: Joi.array().min(1).items(Joi.number().allow(null)).required(),
        printerTemplate: Joi.string().allow(null).required(),
    })
} 
