const DesignModel = require('../models/DesignModel')
const responseUtils = require('../utils/response.utils');
const { Op } = require("sequelize");
const PrinterController = require('./PrinterController');

function trimObject(obj){
    Object.entries(obj).forEach(data => {
        if(typeof data[1] == 'string')
            obj[data[0]] = data[1].trim()
    })
}

module.exports = {
    createDesign: async(req,res,next) => {
        try{ 
            trimObject(req.body)
            // check design Exists
            let designExists = await DesignModel.getDesign({ 'designNumber': req.body.designNumber })
            if(designExists)
                return res.json(responseUtils.message(false, 'Design Number already exists'));

            if(req.body.skuNumber == undefined)
                req.body.skuNumber = req.body.designNumber
            if(req.body.itemStatus == undefined)
                req.body.itemStatus = 'INSTOCK'
                
            let design = await DesignModel.createDesign(req.body)
            return res.json(responseUtils.success(design, 'Design created successfully'));
        }
        catch(err){
            return next(err)
        }
    },
    updateDesign: async(req,res,next) => {
        const id = req.params.id;
        try{
            trimObject(req.body)
            // check design Exists
            let designExists = await DesignModel.getDesign({ 'id': { [Op.ne]: parseInt(id) }, 'designNumber': req.body.designNumber })
            if(designExists)
                return res.json(responseUtils.message(false, 'Design Number already exists'));

            if(req.body.skuNumber == undefined && req.body.designNumber != undefined)
                req.body.skuNumber = req.body.designNumber

            let updateDesign = await DesignModel.updateDesignById(id, req.body)
            if(updateDesign > 0)
                return res.json(responseUtils.message(true, 'Design updated successfully'));
            else
                return res.json(responseUtils.message(false, 'Design not found'));
        }
        catch(err){
            return next(err)
        }
    },
    deleteDesign: async(req,res,next) => {
        const id = req.params.id;
        try{
            let deleteDesign = await DesignModel.deleteDesignById(id)
            if(deleteDesign > 0)
                return res.json(responseUtils.message(true, 'Design deleted successfully'));
            else
                return res.json(responseUtils.message(false, 'Design not found'));
        }
        catch(err){
            return next(err)
        }
    },
    getDesign: async(req,res,next) => {
        const id = req.params.id;
        try{
            let design = await DesignModel.getDesign({ 'id': id })
            if(design)
                return res.json(responseUtils.success(design, 'Design fetched successfully'));
            else
                return res.json(responseUtils.message(false, 'Design not found'));
        }
        catch(err){
            return next(err)
        }
    },
    getAllDesigns: async(req,res,next) => {
        try{
            const { page, limit } = req.query
            let design = await DesignModel.getAllDesigns(page, limit)
            if(design.rows.length > 0)
                return res.json(responseUtils.success(design, 'Designs fetched successfully'));
            else
                return res.json(responseUtils.message(false, 'No Designs found'));
        }
        catch(err){
            return next(err)
        }
    },
    printDesigns: async(req,res,next) => {
        try{
            const { page, limit } = req.query
            let designs = await DesignModel.getDesigns({ 'id': { [Op.in]: req.body.designIds } })
            if(designs.length > 0)
                {
                    logging.info('reading printer_cmd file')
                    let printCmds = await PrinterController.readPrintCmdFile()

                    if(printCmds == null){
                        return res.json(responseUtils.message(false, 'printer_cmd file not found'));
                    }
                    console.log(printCmds)

                    logging.info('Printing Designs, count - '+designs.length)
                    
                    for (let i = 0; i < designs.length; i++) {
                        const design = designs[i];

                        console.log('PRINTING '+design.id)
                        PrinterController.printfile(design,printCmds)
                        console.log('DONE')
                    }
                    res.json(responseUtils.message(true, 'Printing Barcode'));

                }
            else
                return res.json(responseUtils.message(false, 'Designs not found'));
        }
        catch(err){
            return next(err)
        }
    },
}