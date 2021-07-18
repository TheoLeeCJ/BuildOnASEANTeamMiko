const AWS = require("aws-sdk"); 

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  let index = [];
  let indexData, dataset;

  // try {
  //   indexData = await s3.getObject({
  //     "Bucket": "miko-internal",
  //     "Key": "search-index.json",
  //   }).promise();
  // }
  // catch (e) {
    
  // }

  // if (indexData) {
  //   index = JSON.parse(indexData.toString("utf-8"));
  // }

  let scanParams = {
    TableName: "items",
    AttributesToGet: ["itemId", "name", "price", "category", "coverImage", "likes", "summary", "userId"],
  };

  try {
    // TODO: USE LastEvaluatedKey TO SCAN FURTHER IF 1 MB LIMIT EXCEEDED!!!
    let response = await db.scan(scanParams).promise();
    dataset = response.Items;
  }
  catch (e) {
    lambdaCallback(null, e.toString());
    return;
  }

  for (let i = 0; i < dataset.length; i++) {
    index.push(
      {
        "id": dataset[i]["itemId"],
        "cat": dataset[i]["category"],
        "name": dataset[i]["name"],
        "cash": dataset[i]["price"],
        "img": dataset[i]["coverImage"],
        "up": dataset[i]["likes"],
        "txt": dataset[i]["summary"],
        "user": dataset[i]["userId"],
      },
    );
  }

  try {
    let response = await s3.putObject({
      "Bucket": "miko-internal",
      "Key": "search-index.json",
      "Body": JSON.stringify(index),
    }).promise();
  }
  catch (e) {
    lambdaCallback(null, e.toString());
    return;
  }
};