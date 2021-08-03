const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");

const fields = ["jwt"];

const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

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

    let userData = await db.query({
      TableName: "users",
      KeyConditions: {
        "userId": {
          ComparisonOperator: "EQ",
          AttributeValueList: [jwtData["user"]],
        },
      },
    }).promise();

    lambdaCallback(null, userData.Items[0]);
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      e: e.toString(),
    }));
  }
};