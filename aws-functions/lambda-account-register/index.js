const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");

const fields = ["username", "password", "email"];

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
    let hash = bcrypt.hashSync(formFields["password"], salt);

    await db.put({
      TableName: "users",
      Item: {
        userId: formFields["username"],
        password: hash,
        email: formFields["email"],
        greenPts: 0,
        buyingInterests: [],
        sellingInterests: [],
      },
    }).promise();

    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      msg: {
        success: true,
        jwt: jwt.sign({ "user": formFields["username"], }, SECRET, { algorithm: "HS256" }),
      },
    }));
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 500,
    }));
  }
};
