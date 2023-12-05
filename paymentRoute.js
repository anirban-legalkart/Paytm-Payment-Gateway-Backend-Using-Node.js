
require('dotenv').config()

const qs = require('querystring')
// const formidable=require('formidable')
const express=require('express')
const router=express.Router()
const {v4:uuidv4}=require('uuid')
const https=require('https')
// const firebase=require('firebase')
const PaytmChecksum=require('./PaytmChecksum')
// const db = require('./firebase')

// const merchantKey = 'UQ7xEaoOvg_d_XhD'

var PaytmConfig = {
    MID : 'hDRZuj78211395275096',
	merchantKey : 'UQ7xEaoOvg_d_XhD',
	website: "WEBSTAGING"
}
// var PaytmConfig = {
//     MID : 'AbDLqs17218484281452',
// 	merchantKey : 'zcVS8kt2In9JddQu',
// 	website: "WEBSTAGING"
// }


// router.post('/callback',(req,res)=>{

//     var body = '';

//     req.on('data', function (data) {
//       body += data;
//     });
  
//     req.on('end', function () {
//       var html = "";
//       var post_data = qs.parse(body);
  
//       // received params in callback
//       console.log('Callback Response: ', post_data, "\n");
//      // var _result = JSON.parse(response);
//             res.render('response', {
//               'data': post_data
//             })
     
//     });

// })



router.post('/payment',(req,res)=>
{

const{amount,orderId,email}=req.body;

console.log(amount,'amount---->>')
console.log(orderId,'orderId---->>')
    /* import checksum generation utility */
const totalAmount=JSON.stringify(amount);



var paytmParams = {};

paytmParams.body = {
    "requestType"   : "Payment",
    // "mid"           : process.env.PAYTM_MID,
    "mid"           : PaytmConfig.MID,
    // "websiteName"   : process.env.PAYTM_WEBSITE,
    "websiteName"   : PaytmConfig.website,
    // "orderId"       : "ORDERID_98765",
    // "orderId"       : uuidv4(),
    "orderId"       : orderId,
    // "paytmSsoToken"       : orderId,
    // "callbackUrl"   : "https://<callback URL to be used by merchant>",
    "callbackUrl"   : 'https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=' + orderId,
    // "callbackUrl"   : 'http://localhost:5000/api/callback',
    "txnAmount"     : {
        // "value"     : "1.00",
        "value"     : totalAmount,
        "currency"  : "INR",
    },
    "userInfo"      : {
        "custId"    : "CUST_001",
    },
};

/*
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
// console.log(process.env.PAYTM_MERCHANT_KEY,'---->>>')

PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.merchantKey).then(function(checksum){

    console.log(checksum,'paytmParams---->>>')

    paytmParams.head = {
        "signature"    : checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

        /* for Staging */
        hostname: 'securegw-stage.paytm.in',

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${PaytmConfig.MID}&orderId=${orderId}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    var response = "";
    var post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', function(){
            console.log('Response: ', response);

            res.json( JSON.parse(response) )
        });
    });

    post_req.write(post_data);
    post_req.end();
}).catch(function(error){
	console.log(error,'error---');
    res.sendStatus(error)
});


})




//  ------fetch payment options available for the transaction ------

router.post('/fetchPayOption',(req,res)=>
{

const{orderId,txnToken}=req.body;

// console.log(orderId,'orderId---->>')


var paytmParams = {};

paytmParams.body = {
    "mid"           : PaytmConfig.MID,
    "orderId"       : orderId,
    "returnToken"   :  "true"
};

paytmParams.head = {
    "tokenType"     : "TXN_TOKEN",
    "token"         : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/theia/api/v2/fetchPaymentOptions?mid=${PaytmConfig.MID}&orderId=${orderId}`,

    method: 'POST',
    headers: {
        'Content-Type'   : 'application/json',
        'Content-Length' : post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('fetchPayOption Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();

})




//  ------Send Otp To Link Wallet ------

router.post('/sendOtpToLinkWallet',(req,res)=>
{

const{mobileNo, orderId, txnToken}=req.body;


var paytmParams = {};

paytmParams.body = {
    "mobileNumber" : mobileNo
    // "mobileNumber" : "7777777777"

};

paytmParams.head = {
    "txnToken"     : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/login/sendOtp?mid=${PaytmConfig.MID}&orderId=${orderId}`,

    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('sendOtp---Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();        



})


//  ------Validate Otp To Link Wallet ------

router.post('/validateOtpToLinkWallet',(req,res)=>
{

const{otp, orderId, txnToken}=req.body;


var paytmParams = {};

paytmParams.body = {
    "otp"      : otp
};

paytmParams.head = {
    "txnToken" : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/login/validateOtp?mid=${PaytmConfig.MID}&orderId=${orderId}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('validateOtp Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();        



})


//  ------fetch Wallet Balance Info ------

router.post('/fetchWalletBalanceInfo',(req,res)=>
{

const{ orderId, txnToken}=req.body;


var paytmParams = {};

paytmParams.body = {
    "paymentMode" : "BALANCE",
};

paytmParams.head = {
    "txnToken"    : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/userAsset/fetchBalanceInfo?mid=${PaytmConfig.MID}&orderId=${orderId}`,

    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('fetchBalanceInfo -- Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();        


})



//  ------Process transaction ------

router.post('/processTransaction',(req,res)=>
{

const{paymentMode ,orderId,txnToken, channelCode, payerAccount, cardInfo }=req.body;

// console.warn(channelCode,'channelCode----->>>');
var paytmParams = {};

paytmParams.body = {
    "requestType" : "NATIVE",
    "mid"         : PaytmConfig.MID,
    "orderId"     : orderId,
    "paymentMode" : paymentMode,
    "channelCode": channelCode, //for NetBanking
    "payerAccount": payerAccount, //for Upi-Collect
    // "paymentMode" : "CREDIT_CARD",
    // "cardInfo"    : "|4389760168314294|123|122032",
    "cardInfo"    : cardInfo,
    "authMode"    : "otp",
};

paytmParams.head = {
    "txnToken"    : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/theia/api/v1/processTransaction?mid=${PaytmConfig.MID}&orderId=${orderId}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('processTransaction---Response: ', response);
        res.json( JSON.parse(response) )

    });
}); 
post_req.write(post_data);
post_req.end();        



})



//  ------fetch Net Banking BankList ------

router.post('/fetchNBBankList',(req,res)=>
{

const{ orderId,txnToken}=req.body;

var paytmParams = {};

paytmParams.body = {
    "type"          : "MERCHANT",
};

paytmParams.head = {
    "tokenType"     : "TXN_TOKEN",
    "token"         : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/theia/api/v1/fetchNBPaymentChannels?mid=${PaytmConfig.MID}&orderId=${orderId}`,

    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('fetchNBBankList---Response: ', response);
        res.json( JSON.parse(response) )

    });
});

post_req.write(post_data);
post_req.end();        


})



//  ------ validate user VPA ------

router.post('/validateUserVPA',(req,res)=>
{

const{ orderId, vpa ,txnToken}=req.body;

var paytmParams = {};

paytmParams.body = {
    "vpa"           : vpa
};

paytmParams.head = {
    "tokenType"     : "TXN_TOKEN",
    "token"         : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: `/theia/api/v1/vpa/validate?mid=${PaytmConfig.MID}&orderId=${orderId}`,

    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function(chunk) {
        response += chunk;
    });

    post_res.on('end', function() {
        console.log('validateUserVPA---Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();




})



//  ------fetch transaction Status ------

router.post('/fetchTransactionStatus',(req,res)=>
{

const{ orderId}=req.body;

/* initialize an object */
var paytmParams = {};

/* body parameters */
paytmParams.body = {

    /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
    "mid" : PaytmConfig.MID,

    /* Enter your order id which needs to be check status for */
    "orderId" : orderId,
};

/**
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PaytmConfig.merchantKey).then(function(checksum){
    /* head parameters */
    paytmParams.head = {

        /* put generated checksum value here */
        "signature"	: checksum
    };

    /* prepare JSON string for request */
    var post_data = JSON.stringify(paytmParams);

    var options = {

        /* for Staging */
        hostname: 'securegw-stage.paytm.in',

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    // Set up the request
    var response = "";
    var post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', function(){
            console.log('Order Status Response: ', response);

            res.json( JSON.parse(response) )
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
}).catch(function(error){
	console.log(error,'error---');
    res.sendStatus(error)
});



})



//  ------ validate entered card details ------

router.post('/validateUserCardDetails',(req,res)=>
{

const{ orderId, cardNo ,txnToken}=req.body;

var paytmParams = {};

paytmParams.body = {
    "bin"       : cardNo,
};

paytmParams.head = {
    "tokenType" : "TXN_TOKEN",
    "channelId" : "WEB",
    "token"     : txnToken
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path                   : `/fetchBinDetail?mid=${PaytmConfig.MID}&orderId=${orderId}`,
    method                 : 'POST',
    headers                : {
        'Content-Type'   : 'application/json',
        'Content-Length' : post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('validateUserCardDetails---Response: ', response);
        res.json( JSON.parse(response) )
    });
});

post_req.write(post_data);
post_req.end();        




})

module.exports=router