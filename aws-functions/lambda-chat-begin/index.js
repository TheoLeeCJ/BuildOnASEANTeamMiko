const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const short = require("short-uuid");
const webpush = require("web-push");

const fields = ["jwt", "productId"];

const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";
const GCM_API_KEY = "AAAAkh4Ywsk:APA91bEEZAlfMkXiC02SNpyJn_alK-YALOWyZca4ijVe6uPvnPbHrTmdWoWAGUjGIaqgY0jwMkppKTjsWtxJtxRQwoh8ItoYSyLCaSaEQamnnzWQjs0swO3qzfOB0VacfV26x6SOaERw9C6J7DQtkcoyTtK0TXZnog";

webpush.setGCMAPIKey(GCM_API_KEY);
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  "BFuEzfLArTeOYWVKHoGnTFNYx_Wy8QdEZqUDtjFfkFh0Sj17pnWeBn79DksHp7eq-8Zqoeixd-uQzLtDNQYmhaQ",
  "-Hz6M61UjOf_fmYHx9UdXkrEqR0o4VlSVMsQU6bN4vo",
);

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  try {
    const formFields = await multipartParser.parse(event);

    for (let i = 0; i < fields.length; i++) {
      if (formFields[fields[i]] == "" || formFields[fields[i]] === undefined || formFields[fields[i]] == null) {
        lambdaCallback(null, JSON.stringify({
          statusCode: 200,
          msg: {
            success: false,
            reason: "missing",
          },
        }));
        return;
      }
    }
    
    let jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with

    let existingChats = await db.query({
      TableName: 'messaging',
      KeyConditions: {
        'userId': {
          ComparisonOperator: "EQ",
          AttributeValueList: [jwtData["user"]],
        },
        'itemCatWithId-lastUpdate': {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: [formFields["productId"]],
        },
      },
    }).promise().then((res) => { return res.Items; });

    if (existingChats.length > 0) {
      let presigned = await s3.getSignedUrlPromise('getObject', {
        Bucket: "miko-internal",
        Key: `chats/${existingChats[0].chatStore}`,
        Expires: 3600,
      });

      lambdaCallback(null, JSON.stringify({
        statusCode: 200,
        reason: "has-chat",
        data: presigned,
      }));
    }
    else {
      let targetItem = await db.query({
        TableName: "items",
        KeyConditions: {
          'category': {
            ComparisonOperator: "EQ",
            AttributeValueList: [parseInt(formFields["productId"].substring(0, formFields["productId"].indexOf("-")))],
          },
          "itemId": {
            ComparisonOperator: "EQ",
            AttributeValueList: [formFields["productId"].substring(formFields["productId"].indexOf("-") + 1)],
          },
        },
      }).promise().then((res) => { return res.Items; });
      targetUser = targetItem[0].userId;
      itemName = targetItem[0].name;

      // IMPORTANT: when checking if username is in chatStore name, MUST SPLIT BY '-'
      // DON'T USE .includes() ON THE STRING DIRECTLY
      let chatStore = `${jwtData["user"]}-${targetUser}-${short().generate()}`;

      if (targetUser === jwtData["user"]) {
        lambdaCallback(null, JSON.stringify({
          statusCode: 200,
          reason: "self-chat",
        }));
        return;
      }

      await s3.putObject({
        Bucket: "miko-internal",
        Key: `chats/${chatStore}`,
        Body: JSON.stringify({
          seller: targetUser,
          buyer: jwtData["user"],
          itemName: itemName,
          chat: [
            {
              "from": jwtData["user"],
              "text": "Hello! I am interested in this item.",
              "time": new Date().getTime(),
            },
          ],
        }),
      }).promise();

      db.put({
        TableName: "messaging",
        Item: {
          "userId": jwtData["user"],
          "other": targetUser,
          "itemCatWithId-lastUpdate": `${formFields["productId"]}-${new Date().getTime()}`,
          "chatStore": chatStore,
          "itemName": itemName,
          "lastMsg": "Hello! I am interested in this item.",
        },
      }, (err, data) => {});

      db.put({
        TableName: "messaging",
        Item: {
          "userId": targetUser,
          "other": jwtData["user"],
          "itemCatWithId-lastUpdate": `${formFields["productId"]}-${new Date().getTime()}`,
          "chatStore": chatStore,
          "itemName": itemName,
          "lastMsg": "Hello! I am interested in this item.",
        },
      }, (err, data) => {});

      let presigned = await s3.getSignedUrlPromise('getObject', {
        Bucket: "miko-internal",
        Key: `chats/${chatStore}`,
        Expires: 3600,
      });

      let pushTargets = await db.query({
        TableName: 'webpush',
        KeyConditions: {
          'userId': {
            ComparisonOperator: "EQ",
            AttributeValueList: [targetUser],
          },
        },
      }).promise().then((res) => { return res.Items; });

      for (let target of pushTargets) {
        const pushSubscription = {
          endpoint: target.endpoint,
          keys: JSON.parse(target.keys),
        };
  
        try {
          webpush.sendNotification(pushSubscription, "A user wants to buy an item from you!");
        }
        catch (e) {
          
        }
      }

      lambdaCallback(null, JSON.stringify({
        statusCode: 200,
        reason: "chat-sent",
        data: presigned,
      }));
    }
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      // e: e.toString(),
    }));
  }
};