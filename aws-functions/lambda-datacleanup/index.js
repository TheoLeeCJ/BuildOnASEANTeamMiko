const AWS = require("aws-sdk"); 
const users = ["pekora", "tohru", "mikoiino", "gawrgura", "sakuramiko35", "kobayashi", "kannakamui"];

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

function randUser() {
  return users[Math.floor(Math.random() * 7)];
}

exports.handler = async (event, context, lambdaCallback) => {
  try {
    let index = [];
    let indexData, dataset;
    let usersItems = {};

    for (let i = 0; i < users.length; i++) {
      usersItems[users[i]] = [];
    }

    let scanParams = {
      TableName: "items",
      AttributesToGet: ["itemId", "category"],
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
      let item = dataset[i];

      let user = randUser();
      item["user"] = user;
      usersItems[user].push(item["category"] + "-" + item["itemId"]);
      
      await db.update({
        TableName: "items",
        Key: { itemId: item["itemId"], category: item["category"], },
        UpdateExpression: "set #user = :userData",
        ExpressionAttributeNames: { "#user": "userId" },
        ExpressionAttributeValues: { ":userData": user, },
      }).promise();
    }

    for (let i = 0; i < Object.keys(usersItems).length; i++) {
      console.log(Object.keys(usersItems)[i]);
      await db.update({
        TableName: "users",
        Key: { userId: Object.keys(usersItems)[i], greenPts: 0, },
        UpdateExpression: "set #items = :itemsData",
        ExpressionAttributeNames: { "#items": "items" },
        ExpressionAttributeValues: { ":itemsData": JSON.stringify(usersItems[Object.keys(usersItems)[i]]), },
      }).promise();
    }

    lambdaCallback(null, "a");
  }
  catch (e) {
    console.log(e.toString());
  }
};