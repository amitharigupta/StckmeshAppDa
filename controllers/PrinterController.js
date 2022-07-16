'use strict';

var edge = require('edge-js');


var about;
var openport;
var sendcommand;
var clearbuffer;
var printerfont;
var barcode;
var printlabel;
var closeport;
var printer_status;
var sendcommand_utf8;
var sendcommand_binary;
var windowsfont;

const readline = require('readline');
const fs = require('fs'); 

try {
    openport = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'openport'
    });
}
catch (error) {
    console.log(error);
}

try {
    sendcommand = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'sendcommand'
    });
}
catch (error) {
    console.log(error);
}


try {
    clearbuffer = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'clearbuffer'
    });
}
catch (error) {
    console.log(error);
}


try {
    printerfont = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'printerfont'
    });
}
catch (error) {
    console.log(error);
}


try {
    barcode = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'barcode'
    });
}
catch (error) {
    console.log(error);
}



try {
    printlabel = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'printlabel'
    });
}
catch (error) {
    console.log(error);
}


try {
    closeport = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'closeport'
    });
}
catch (error) {
    console.log(error);
}


try {
    printer_status = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'printerstatus_string'
    });
}
catch (error) {
    console.log(error);
}

try {
    sendcommand_utf8 = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'sendcommand_utf8'
    });
}
catch (error) {
    console.log(error);
}

try {
    sendcommand_binary = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'sendcommand_binary'
    });
}
catch (error) {
    console.log(error);
}

try {
    windowsfont = edge.func({
        assemblyFile: 'tsclibnet.dll',
        typeName: 'TSCSDK.node_usb',
        methodName: 'windowsfont'
    });
}
catch (error) {
    console.log(error);
}

function printfileOld(design, printerCmds){
    var barcode_variable = { x: '200', y: '70', type: '128', height: '40', readable: '0', rotation: '180', narrow: '1', wide: '2', code: design.designNumber }
    var label_variable = { quantity: '1', copy: '1' };
    
    openport('');
    
    var status = printer_status(100, true);
    
    clearbuffer('', true);
   
     sendcommand('CODEPAGE 1252', true);
     sendcommand(`TEXT 200,107,\"0\",180,10,10,\"${ design.designNumber}\"`, true);
     sendcommand(`TEXT 404,113,\"0\",180,7,7,\"G Wt   : ${design.grossWeight}\"`, true);
     sendcommand(`TEXT 300,40,\"0\",180,9,9,\" ${design.metalPurity} KT\"`, true);
     sendcommand(`TEXT 404,93,\"0\",180,7,7,\"N Wt   : ${design.netWeight}\"`, true);
     sendcommand(`TEXT 404,52,\"0\",180,7,7,\"CS Wt : ${design.stoneWeight}\"`, true);
     sendcommand(`TEXT 404,32,\"0\",180,7,7,\"S Pcs  : ${design.stoneCount}\"`, true);
     sendcommand(`TEXT 404,72,\"0\",180,7,7,\"S Wt   : ${design.stoneWeight}\"`, true);
     
     barcode(barcode_variable, true);
     
     printlabel(label_variable, true);

    closeport('', true);
}

function printfile(design, printerCmds) {
    // console.log(design)

    /* Set barcode_variable & label_variable */
    var barcode_variable;
    var label_variable;
    if(printerCmds[0]!=undefined || printerCmds[0]!=null) {
      let printerCmd = printerCmds[0]
      printerCmd = printerCmd.replace(/\${([^}]*)}/g,  (r,k)=>design[k])
      printerCmd = printerCmd.replace(/\\\"/g, '\"')
       
	    console.log('barcode_variable')
      console.log(JSON.parse('{ ' + printerCmd + ' }'))
      barcode_variable = JSON.parse('{ ' + printerCmd + ' }')

        // convert all values to string
      Object.entries(barcode_variable).forEach(data => {
        barcode_variable[data[0]] = data[1].toString()
      })
    }
    else {
      throw new Error('barcode_variable not found in printer_cmd.txt')
    }

    if(printerCmds[1]!=undefined || printerCmds[1]!=null) {
      let printerCmd = printerCmds[1]
      printerCmd = printerCmd.replace(/\${([^}]*)}/g, (r,k)=>design[k])
      printerCmd = printerCmd.replace(/\\\"/g, '\"')
        
      //console.log('label_variable')
      //console.log(JSON.parse('{ ' + printerCmd + ' }'))
      label_variable = JSON.parse('{ ' + printerCmd + ' }')

      // convert all values to string
      Object.entries(label_variable).forEach(data => {
        label_variable[data[0]] = data[1].toString()
      })
    }
    else {
      throw new Error('label_variable not found in printer_cmd.txt')
    }
    /* --------------------------------------- */

    openport('');
    var status = printer_status(100, true);
    clearbuffer('', true);
   
    sendcommand('CODEPAGE 1252', true);

    /* Set sendcommand */
    try {
      if(printerCmds.length<=2) {
        throw new Error('sendcommands not found in printer_cmd.txt')
      }
      for (let i = 2; i < printerCmds.length; i++) {
        let printerCmd = printerCmds[i];
        printerCmd = printerCmd.replace(/\${([^}]*)}/g, (r,k)=>design[k])
        printerCmd = printerCmd.replace(/\\\"/g, '\"')
        printerCmd = printerCmd.replace(null + ' KT',' ') 
        printerCmd = printerCmd.replace(null,' ')        
        console.log('printerCmd')
        console.log(printerCmd)
        sendcommand(printerCmd, true);
      }
    }
    catch(err){
      throw new Error(err)
    }
    /* --------------------------------------- */     

    barcode(barcode_variable, true);
    printlabel(label_variable, true);

    closeport('', true);
}

async function readPrintCmdFile(template) {
      try {
        let cmds = []
        let start = template + ' Start'
        let end = template + ' End'
        if(fs.existsSync('./printer_cmd.txt')) {
          const file = fs.readFileSync('./printer_cmd.txt', 'utf8', function(err, data){
            if(err) throw err;
          })
          let arr = file.split(/\r?\n/);
          var startIndex = arr.indexOf(start);
          var endIndex = arr.indexOf(end);
          console.log(startIndex, endIndex)
          for(let i= startIndex + 1; i< endIndex ; i++){
            cmds.push(arr[i]);
          }
            
          return cmds
        }
        else{
          console.log('file not found')
          return null
        }
      }
      catch(err) {
        console.log(err)
        return null
      }
}

readPrintCmdFile()
    

module.exports = {
    printfile: printfile,
    readPrintCmdFile: readPrintCmdFile
}