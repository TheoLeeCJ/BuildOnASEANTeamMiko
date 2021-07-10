const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");

let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  try {
    const formFields = await multipartParser.parse(event);

    let probe = await db.query({
      TableName: "users",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": formFields["username"],
      },
    }).promise();

    if (probe.Items.length !== 0) {
      lambdaCallback(null, JSON.stringify({
        statusCode: 200,
        msg: {
          success: false,
          reason: "username-taken",
        },
      }));
      return;
    }

    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(formFields["username"], salt);

    await db.put({
      TableName: "users",
      Item: {
        userId: formFields["username"],
        password: hash,
        email: formFields["email"],
        greenPts: 0,
      },
    }).promise();

    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      msg: {
        success: true,
      },
    }));
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      error: e.toString(),
    }));
  }
};
