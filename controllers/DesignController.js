const DesignModel = require('../models/DesignModel')
const CategoryModel = require('../models/CategoryModel')
const responseUtils = require('../utils/response.utils');
const { Op } = require("sequelize");
const PrinterController = require('./PrinterController');
const path = require('path')
const fs = require('fs');

function trimObject(obj) {
  Object.entries(obj).forEach(data => {
    if (typeof data[1] == 'string')
      obj[data[0]] = data[1].trim()
  })
}

function pad_with_zeroes(number, length = 6) {
  var my_string = '' + number;
  while (my_string.length < length) {
    my_string = '0' + my_string;
  }
  return my_string;
}

module.exports = {
  createDesign: async (req, res, next) => {
    try {
      trimObject(req.body)
      // check design Exists
      let designExists = await DesignModel.getDesign({ 'designNumber': req.body.designNumber })
      if (designExists)
        return res.json(responseUtils.message(false, 'Design Number already exists'))
      let huid = req.body.huid
      if (huid != null) {
        let huidExists = await DesignModel.getDesign({ 'huid': huid })
        if (huidExists)
          return res.json(responseUtils.message(false, 'HUID Already Exists'))
      }

      if (req.body.imageName !== undefined && req.body.imageName) {
        let imageData = req.body.imageName
        imageData = imageData.split(",")[1]
        let fileName = req.body.designNumber + Date.now() + '.png'
        let filepath = './images/' + fileName
        req.body.imageName = fileName
        fs.writeFileSync(filepath, imageData, { encoding: 'base64' });
      } else {
        req.body.imageName = "noimage.png"
      }

      if (req.body.skuNumber == undefined)
        req.body.skuNumber = req.body.designNumber
      if (req.body.itemStatus == undefined)
        req.body.itemStatus = 'INSTOCK'

      let design = await DesignModel.createDesign(req.body)
      return res.json(responseUtils.success(design, 'Design created successfully'));
    }
    catch (err) {
      return next(err)
    }
  },
  updateDesign: async (req, res, next) => {
    const id = req.params.id;
    try {
      trimObject(req.body)
      // check design Exists
      let designExists = await DesignModel.getDesign({ 'id': { [Op.ne]: parseInt(id) }, 'designNumber': req.body.designNumber })
      if (designExists)
        return res.json(responseUtils.message(false, 'Design Number already exists'));


      if (req.body.imageName !== undefined && req.body.imageName) {
        let imageData = req.body.imageName
        imageData = imageData.split(",")[1]
        let fileName = req.body.designNumber + Date.now() + '.png'
        let filepath = './images/' + fileName
        req.body.imageName = fileName
        fs.writeFileSync(filepath, imageData, { encoding: 'base64' });
      }

      let huid = req.body.huid
      if (huid != null) {
        let huidExists = await DesignModel.getDesign({ 'id': { [Op.ne]: parseInt(id) }, 'huid': huid })
        if (huidExists)
          return res.json(responseUtils.message(false, 'HUID Already Exists'))
      }

      if (req.body.skuNumber == undefined && req.body.designNumber != undefined)
        req.body.skuNumber = req.body.designNumber

      let updateDesign = await DesignModel.updateDesignById(id, req.body)
      if (updateDesign > 0)
        return res.json(responseUtils.message(true, 'Design updated successfully'));
      else
        return res.json(responseUtils.message(false, 'Design not found'));
    }
    catch (err) {
      return next(err)
    }
  },
  deleteDesign: async (req, res, next) => {
    const id = req.params.id;
    try {
      let deleteDesign = await DesignModel.deleteDesignById(id)
      if (deleteDesign > 0)
        return res.json(responseUtils.message(true, 'Design deleted successfully'));
      else
        return res.json(responseUtils.message(false, 'Design not found'));
    }
    catch (err) {
      return next(err)
    }
  },
  getDesign: async (req, res, next) => {
    const id = req.params.id;
    try {
      let design = await DesignModel.getDesign({ 'id': id })
      if (design)
        return res.json(responseUtils.success(design, 'Design fetched successfully'));
      else
        return res.json(responseUtils.message(false, 'Design not found'));
    }
    catch (err) {
      return next(err)
    }
  },
  getAllDesigns: async (req, res, next) => {
    try {
      const { page, limit } = req.query
      let design = await DesignModel.getAllDesigns(page, limit)
      if (design.rows.length > 0)
        return res.json(responseUtils.success(design, 'Designs fetched successfully'));
      else
        return res.json(responseUtils.message(false, 'No Designs found'));
    }
    catch (err) {
      return next(err)
    }
  },
  printDesigns: async (req, res, next) => {
    try {
      const { page, limit } = req.query

      const { CmdPrinter } = require('cmd-printer')
      let systemPrinters = await CmdPrinter.getAll()
      let isPrinterOnline = false

      for (let i = 0; i < systemPrinters.length; i++) {
        const systemPrinter = systemPrinters[i];
        console.log(systemPrinter.name)
        if (systemPrinter.name === 'TSC TTP-244 Pro') {
          isPrinterOnline = true;
          break;
        }
      }

      if (!isPrinterOnline) {
        return res.json(responseUtils.message(false, 'Printer is not connected'));
      }
      let printerTemplate = req.body.printerTemplate
      let designs = await DesignModel.getDesigns({ 'id': { [Op.in]: req.body.designIds } })
      if (designs.length > 0) {
        logging.info('reading printer_cmd file')
        let printCmds = await PrinterController.readPrintCmdFile(printerTemplate)

        let printCmd = printCmds[0]
        printCmd = printCmd.replace(/"/g, '')

        if (printCmds == null) {
          return res.json(responseUtils.message(false, 'printer_cmd file not found'));
        }
        console.log(printCmds)

        logging.info('Printing Designs, count - ' + designs.length)

        for (let i = 0; i < designs.length; i++) {
          const design = designs[i];
          console.log('PRINTING ' + design.id)
          PrinterController.printfile(design, printCmds)
          console.log('DONE')
        }
        res.json(responseUtils.message(true, 'Printing Barcode'));
      } else {
        return res.json(responseUtils.message(false, 'Designs Not Found'));
      }
    }
    catch (err) {
      return next(err)
    }
  },
  getDesignByNumber: async (req, res, next) => {
    let designNo = req.body.skuNumber;
    try {
      let designData = await DesignModel.getDesignByNumber({ designNumber: designNo })
      if (designData)
        return res.json(responseUtils.success(designData, 'Design fetched successfully'));
      else
        return res.json(responseUtils.message(false, 'Design not found'));
    }
    catch (err) {
      return next(err)
    }
  },
  getDesignNumberByCategory: async (req, res, next) => {
    try {
      let categoryId = parseInt(req.body.categoryId);
      let designNumber
      let category = await CategoryModel.getCategory({ 'id': categoryId });
      let designCount = await DesignModel.getDesignNumberCount(categoryId)
      designNumber = category.categoryPrefix
      designNumberPad = pad_with_zeroes(designCount + 1, 6)
      designNumber = category.categoryPrefix + designNumberPad
      if (designNumber)
        return res.json(responseUtils.success(designNumber, 'SKU number generated successfully'));
      else
        return res.json(responseUtils.message(false, 'SKU number not found'));
    } catch (error) {
      return next(error);
    }
  },
  generatePDF: async (req, res) => {
    let { designList } = req.body;
    let query = {}
    let designDataArr = []

    for (let i = 0; i < designList.length; i++) {
      query = { designNumber: designList[i] }
      let designDataObj = await DesignModel.getDesign(query)
      designDataArr.push(designDataObj)
    }

    global.window = { document: { createElementNS: () => { return {} } } };
    global.navigator = {};
    global.btoa = () => { };

    const { jsPDF } = require('jspdf/dist/jspdf.node.min')
    require('jspdf-autotable')
    // Default export is a4 paper, portrait, using milimeters for units
    var doc = new jsPDF();

    let columns = [["SR NO", "Design Number", "HUID", "Gross Weight", "Stone Weight", "CS Weight", "Net Weight"]];
    let rows = [];
    let totalGrossWt = 0.0;
    let totalStoneWt = 0.0;
    let totalColorStoneWeight = 0.0;
    let totalNetWt = 0.0;

    designDataArr.forEach((elm, key) => {
      let grossWt = parseFloat(elm.grossWeight).toFixed(3)
      let stoneWt = parseFloat(elm.stoneWeight).toFixed(3)
      let colourStoneWeight = parseFloat(elm.colourStoneWeight).toFixed(3)
      let netWt = parseFloat(elm.netWeight).toFixed(3)
      grossWt = isNaN(grossWt) ? "0.000" : grossWt;
      stoneWt = isNaN(stoneWt) ? "0.000" : stoneWt;
      colourStoneWeight = isNaN(colourStoneWeight) ? "0.000" : colourStoneWeight;
      netWt = isNaN(netWt) ? "0.000" : netWt;
      const temp = [(key + 1), elm.designNumber, elm.huid, grossWt, stoneWt, colourStoneWeight, netWt];
      totalGrossWt += parseFloat(grossWt)
      totalStoneWt += parseFloat(stoneWt)
      totalColorStoneWeight += parseFloat(colourStoneWeight)
      totalNetWt += parseFloat(netWt)

      rows.push(temp);
    });

    let pageWidth = doc.internal.pageSize.getWidth();
    let pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(18);
    doc.text('QUOTATION', pageWidth / 2, pageHeight * 0.03, 'center');
    doc.setFontSize(10);

    var i = 0
    doc.autoTable({
      head: columns,
      body: rows,
      bodyStyles: { minCellHeight: 5, fontSize: 8, lineColor: [0, 0, 0] },
      headStyles: {
        lineColor: [0, 0, 0],
        fillColor: [192, 192, 192],
        textColor: 0,
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: pageWidth * 0.2, "overflow": "linebreak" },
        2: { "overflow": "linebreak" },
        3: { "overflow": "linebreak" },
        4: { "overflow": "linebreak" },
        5: { "overflow": "linebreak" },
        6: { "overflow": "linebreak" },
        7: { "overflow": "linebreak" },
      },
      rowPageBreak: 'avoid',
      theme: 'grid',
      tableLineColor: [0, 0, 0],
      didDrawCell: async (data) => {
        if (data.column.index === 1 && data.cell.section === 'body') {

        }
      },
    });

    let weightRows = []
    weightRows.push(["Total Gross Weight ", totalGrossWt.toFixed(3)])
    weightRows.push(["Total Stone Weight ", totalStoneWt.toFixed(3)])
    weightRows.push(["Total Color Stone Weight ", totalColorStoneWeight.toFixed(3)])
    weightRows.push(["Total Net Weight ", totalNetWt.toFixed(3)])

    doc.autoTable({
      head: weightRows,
      bodyStyles: { minCellHeight: 30, fontSize: 8, lineColor: [0, 0, 0] },
      headStyles: {
        lineColor: [0, 0, 0],
        fillColor: [192, 192, 192],
        textColor: 0,
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      rowStyles: {
        0: { cellWidth: 10 },
        1: { "overflow": "linebreak" },
      },
      rowPageBreak: 'avoid',
      theme: 'grid',
      tableLineColor: [0, 0, 0]
    });

    let fileName = Date.now() + '.pdf'
    assetspath = path.join(process.cwd(), "/pdf/" + fileName)

    fs.appendFileSync(assetspath, new Buffer.from(doc.output('arraybuffer')));

    // Saving pdf file while creating
    // doc.save(assetspath)

    // Sending file to response
    res.sendFile(assetspath, fileName)

    // Deleting PDF File from pdf folder
    if (fs.existsSync(assetspath)) {
      setTimeout(() => {
        fs.unlinkSync(assetspath, () => {
          console.log('File Deleted')
        })
      }, 1000)
    }

    delete global.window;
    delete global.navigator;
    delete global.btoa;

  }
}