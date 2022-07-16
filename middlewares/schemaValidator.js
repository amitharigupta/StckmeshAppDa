var validateSchema = (schema) => {

    return async (req,res,next) => {

        var data;
        if(req.method.toLowerCase() == 'post' || 
        req.method.toLowerCase() == 'put' || 
        req.method.toLowerCase() == 'patch' ||
        req.method.toLowerCase() == 'delete')
            data = req.body
        else if(req.method.toLowerCase() == 'get')
            data = req.query

        if(data != undefined && schema != undefined){
            try{
                await schema.validateAsync(data)
                next()
            }
            catch(err){
                logging.info('Incorrect req - '+err.details[0].message.replace(/\"/g, ""))
                return res.status(410).json({
                    "status": false,
                    "message": err.details[0].message.replace(/\"/g, ""),
                    "data": {}
                })
            }
        }
        else{
            logging.info('Invalid Schema')
            return res.status(410).json({
                "status": false,
                "message": 'Invalid Schema',
                "data": {}
            })
        }   
        
    }

}

module.exports = validateSchema