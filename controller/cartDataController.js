const cartDataDatabase = require("../models/cartDataModel");
const axios = require("axios");
const logger = require("../utils/logger/logger");
const lastSaveDatabase = require("../models/lastSaveDataModel");

// all the end points are to be accessed by /api/v1/cartData

/*
    * @desc To save the cart data to our database
    * @port 8000(by default , can be changed using env variable PORT)
    * @route POST /saveData
    * @params :
               url : url of the shopify client whose cart data we are trying to fetch
               apiKey : access key provided by shopify
    * @flow :
        * As soon as API is called we check if we have any previously data or not , if that's not present then we create a previousData with default fields for further usage.
        * If previousData isn't present then we call in hardcoded endpoint of shopify with pagination limit of 50 else in case of presence of previous data we call in the data that shopify contains starting from that particular cartID
        * Response header contains a link field , which we check to see if there are more data available for us or not , if link contains a "rel=next" or "rel=previous ... rel=next " part , recursively call in dataSaveFunc with url that can be found in link field , till the point where we don't find "rel=previous" only in the field.
        * During the save part , we save the cartID of previously saved data to the database as well . So that we can keep track on the data that was previously saved.
        * A better approach to this save part could have been we could have just fetched the latest saved data using db.collection.find().sort({'_id':-1}).limit(1) , but it might create hassle once our data set grows.
*/

exports.savingData = async (req,res)=>{

    try {
        let requiredURL = null;
        let lastSavedDataID = null;
        const urlToFetchData = req.query.url;
        requiredURL = `${urlToFetchData}/admin/api/2021-07/checkouts.json?limit=50`;

        const previouslySavedData = await lastSaveDatabase.find();
        if(previouslySavedData.length === 1){
            lastSavedDataID = previouslySavedData[0]._id;
            requiredURL = `${urlToFetchData}/admin/api/2021-07/checkouts.json?limit=50&since_id=${previouslySavedData[0].lastSavedCartID}`
        }else{
            const data = await lastSaveDatabase.create({});
            lastSavedDataID = data._id;
        }
        const companyName = new URL(req.query.url).host.split(".")[0];

        const dataSaveFunc = async (url)=>{
            const response = await axios.get(url, {
                headers: {
                    "X-Shopify-Access-Token": req.query.apiKey
                }
            });
            const dataFetched = response.data;
            await asyncForEach(dataFetched.checkouts , async (data,index)=>{
                const {id,created_at} = data;
                let phone = null;
                if(data.billing_address)
                    if(data.billing_address.phone !== null)
                        phone = data.billing_address.phone.replaceAll(" ","");
                    else if(data.shipping_address)
                        if(data.shipping_address.phone !== null)
                            phone = data.shipping_address.phone.replaceAll(" ","");
                try{
                    const savedData = await cartDataDatabase.create({
                        companyName ,
                        cartID : id ,
                        createdAt : created_at ,
                        customerPhoneNumber : phone,
                        details : data
                    });
                    const {_id , cartID } = savedData;
                    await lastSaveDatabase.findByIdAndUpdate(lastSavedDataID,{lastSavedCartID : id});
                    logger.info(`Saved Data :  _id=${_id}*****cartID=${cartID}`);
                }catch (e) {
                    if(e.message.startsWith("E11000"))
                        logger.warn("Duplicate ID found")
                    else
                        logger.warn(e);
                }
            });

            if(response.headers.link.includes(`rel="previous"`) && response.headers.link.includes(`rel="next"`)){
                const tempData = response.headers.link;
                await dataSaveFunc(tempData.split(",")[1].split(";")[0].slice(2,-1));

            }else if(!response.headers.link.includes(`rel="previous"`) && response.headers.link.includes(`rel="next"`)){
                const tempData = response.headers.link;

                await dataSaveFunc(tempData.split(",")[0].slice(2,-1));
            }else if(response.headers.link.includes(`rel="previous"`) && !response.headers.link.includes(`rel="next"`)){
                logger.info("No New Data Left");
            }
        }

        await dataSaveFunc(requiredURL);
        return res.status(201).json({
            code : "PERFORMING",
            message : "Performing the required task"
        });
    }catch (e) {
        logger.warn(e);
        return res.status(500).json({
           code : "ERROR",
           message : "An error occurred while performing this task",
           error : e
        });
    }
}


/*
    * @desc To fetch the data from our database
    * @port 8000(by default , can be changed using env variable PORT)
    * @route GET /fetchData
    * @params :
               cartID : To get information associated with particular cartID
               date   : To get information from that particular date to our current date
*/

exports.fetchInformation = async (req,res)=>{
    try {
        if(req.query.cartID){
            const data = await cartDataDatabase.findOne({
                cartID: req.query.cartID
            });
            return res.status(200).json({
               code : "DATA_FOUND",
               cartData : data
            });
        }else if(req.query.date){
            //&cartID=20830197022887
            const data = await cartDataDatabase.find({
                createdAt: {
                    $gte : new Date(req.query.date).toISOString(),
                    $lte: new Date()
                }
            });
            return res.status(200).json({
                code : "DATA_FOUND",
                cartData : data
            });
        }else if(req.query.cartID && req.query.date){
            const data = await cartDataDatabase.find({
                createdAt: req.query.date,
                cartID: req.query.cartID
            });
            return res.status(200).json({
                code : "DATA_FOUND",
                cartData : data
            });
        }else{
            return res.status(404).json({
                code : "ERROR",
                message : "Required query param date or mainID not found"
            });
        }
    }catch (e) {
        logger.warn(e);
        return res.status(500).json({
            code : "ERROR",
            message : "An error occurred while fetching the required Information",
            error : e
        });
    }
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}