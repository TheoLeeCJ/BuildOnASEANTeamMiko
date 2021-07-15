const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');

const fields = ["jwt"]; // TODO: remove auth requirement for public search

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

    // TODO: remove auth requirement for public search
    let jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with
    
    let result = await db.query({
      TableName : "items",
      IndexName : "index-category",
      KeyConditionExpression : "category = :cat", 
      ExpressionAttributeValues : {
        ":cat": 0,
      },
    }).promise();

    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      msg: {
        success: true,
        data: result,
      },
    }));
    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 401,
      msg: e.toString(),
    }));
  }
};
