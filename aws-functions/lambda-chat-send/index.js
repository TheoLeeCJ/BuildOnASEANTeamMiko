const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const webpush = require("web-push");
const short = require("short-uuid");

const fields = ["jwt", "itemCatWithId", "message", "action", "chatstore"];

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

    if (!formFields["chatstore"].split("-").includes(jwtData["user"])) {
      lambdaCallback(null, JSON.stringify({
        statusCode: 403,
        reason: "unauthorised",
      }));
      return;
    }

    if (formFields["action"] == "complete") {
      formFields["message"] = `Are you ready to complete this item sale? If so, please key in code $#%${short().generate()}`;
    }

    let chatData = await s3.getObject({
      Bucket: "miko-internal",
      Key: `chats/${formFields["chatstore"]}`,
    }).promise();
    chatData = JSON.parse(chatData.Body.toString("utf-8"));

    let targetUser = (chatData.buyer == jwtData["user"]) ? chatData.seller : chatData.buyer
    let itemName = chatData.itemName;

    if (chatData.chat[0].text.includes("$#%")) {
      let code = chatData.chat[0].text.substring(chatData.chat[0].text.indexOf("$#%"));
      let emissions = 150; // kg CO2
      if (formFields["message"] === code) {
        formFields["message"] = `Sale completed with code ${code}!\n\nWe have received ${emissions * 2} GreenPoints each, for saving ${emissions}kg of CO2 from being emitted - that is about the equivalent of ${emissions * 0.66} litres of orange juice.`;

        // update greenpoints in DB
        let targetData = await db.query({
          TableName: "users",
          KeyConditions: {
            'userId': {
              ComparisonOperator: "EQ",
              AttributeValueList: [targetUser],
            },
          },
        }).promise().then(res => { return res.Items[0] });

        let userData = await db.query({
          TableName: "users",
          KeyConditions: {
            'userId': {
              ComparisonOperator: "EQ",
              AttributeValueList: [jwtData["user"]],
            },
          },
        }).promise().then(res => { return res.Items[0] });
        
        // lambdaCallback(null, JSON.stringify({
        //   a: userData,
        //   b: targetData,
        // }));
        // return;

        await db.delete({
          TableName: "users",
          Key: { "userId": jwtData["user"], greenPts: userData["greenPts"], },
        }).promise();

        await db.delete({
          TableName: "users",
          Key: { "userId": targetUser, greenPts: targetData["greenPts"], },
        }).promise();

        userData["greenPts"] = userData["greenPts"] + (emissions * 2);
        (userData["sales"] ? "nothing" : userData["sales"] = []);
        userData["sales"].unshift({
          "pts": emissions * 2,
          "name": chatData.itemName,
          "time": new Date().getTime(),
        });

        await db.put({
          TableName: "users",
          Item: userData,
        }).promise();

        targetData["greenPts"] = targetData["greenPts"] + (emissions * 2);
        (targetData["sales"] ? "nothing" : targetData["sales"] = []);
        targetData["sales"].unshift({
          "pts": emissions * 2,
          "name": chatData.itemName,
          "time": new Date().getTime(),
        });

        await db.put({
          TableName: "users",
          Item: targetData,
        }).promise();
      }
    }

    chatData.chat.unshift({
      "from": jwtData["user"],
      "text": formFields["message"],
      "time": new Date().getTime(),
    });

    await s3.putObject({
      Bucket: "miko-internal",
      Key: `chats/${formFields["chatstore"]}`,
      Body: JSON.stringify(chatData),
    }).promise();

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
        webpush.sendNotification(pushSubscription, "You have a chat update!");
      }
      catch (e) {
        
      }
    }

    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      reason: "sent",
    }));

    let userItemDelete = await db.query({
      TableName: 'messaging',
      KeyConditions: {
        'userId': {
          ComparisonOperator: "EQ",
          AttributeValueList: [jwtData["user"]],
        },
        'itemCatWithId-lastUpdate': {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: [formFields["itemCatWithId"]],
        },
      },
    }).promise().then((res) => { return res.Items[0]["itemCatWithId-lastUpdate"]; });
    
    let otherItemDelete = await db.query({
      TableName: 'messaging',
      KeyConditions: {
        'userId': {
          ComparisonOperator: "EQ",
          AttributeValueList: [targetUser],
        },
        'itemCatWithId-lastUpdate': {
          ComparisonOperator: "BEGINS_WITH",
          AttributeValueList: [formFields["itemCatWithId"]],
        },
      },
    }).promise().then((res) => { return res.Items[0]["itemCatWithId-lastUpdate"]; });

    db.delete({
      TableName: "messaging",
      Key: { "userId": jwtData["user"], "itemCatWithId-lastUpdate": userItemDelete, },
    }).promise();

    db.delete({
      TableName: "messaging",
      Key: { "userId": targetUser, "itemCatWithId-lastUpdate": otherItemDelete, },
    }).promise();

    db.put({
      TableName: "messaging",
      Item: {
        "userId": jwtData["user"],
        "other": targetUser,
        "itemCatWithId-lastUpdate": `${formFields["itemCatWithId"]}-${new Date().getTime()}`,
        "chatStore": formFields["chatstore"],
        "itemName": itemName,
        "lastMsg": formFields["message"],
      },
    }, (err, data) => {});

    db.put({
      TableName: "messaging",
      Item: {
        "userId": targetUser,
        "other": jwtData["user"],
        "itemCatWithId-lastUpdate": `${formFields["itemCatWithId"]}-${new Date().getTime()}`,
        "chatStore": formFields["chatstore"],
        "itemName": itemName,
        "lastMsg": formFields["message"],
      },
    }, (err, data) => {});
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      e: e.toString(),
    }));
  }
};