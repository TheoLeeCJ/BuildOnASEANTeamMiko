const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');

const fields = [
  "jwt",
  "category",
  "images",
  "name",
  "description",
  "price",
  "preferredLocations",
  "multipleAvailable",
  "conditionFields",
];

// TODO: move to environment variables.
const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

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

    let imgData = JSON.parse(formFields["images"]);
    let itemId = short.generate();
    let jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with

    if (imgData.length == 0) {
      lambdaCallback(null, JSON.stringify({
        statusCode: 200,
        msg: {
          success: false,
          reason: "no-images",
        },
      }));
      return;
    }

    // suspicious behaviour detection
    // if buying & selling from same IP address, timing not spread out, sus!

    await db.put({
      TableName: "items",
      Item: {
        ipAddr: event["headers"]["x-forwarded-for"],
        userId: jwtData["user"],
        price: formFields["price"],
        location: formFields["preferredLocations"],
        itemName: formFields["name"],
        category: formFields["category"],
        description: formFields["description"],
        condition: JSON.stringify(JSON.parse(formFields["conditionFields"])),
        itemId: itemId,
        images: JSON.stringify(imgData),
        coverImage: imgData[0],
      },
    }).promise();

    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      msg: {
        success: true,
        id: itemId,
      },
    }));
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 500,
    }));
  }
};
