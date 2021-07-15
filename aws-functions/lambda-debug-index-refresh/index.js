const AWS = require("aws-sdk"); 

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  let index = [
    {
      "id": 0,
      "cat": 0,
      "name": "Test Item",
    },
  ]; 

  try {
    let a = await s3.getObject({
    "Bucket": "miko-internal",
    "Key": "search-index.json",
  }).promise();
  
  lambdaCallback(null, JSON.stringify(a));
  }
  catch (e) {
    lambdaCallback(null, e.toString())
  }
};