const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");

const fields = ["username", "password"];

const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  function incorrect() {
    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      msg: {
        success: false,
        reason: "incorrect",
      },
    }));
  }

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

    if (probe.Items.length == 0) {
      incorrect();
      return;
    }
    else if (probe.Items.length == 1) {
      if (bcrypt.compareSync(formFields["password"], probe.Items[0]["password"])) {
        lambdaCallback(null, JSON.stringify({
          statusCode: 200,
          msg: {
            success: true,
            jwt: jwt.sign({ "user": formFields["username"] }, SECRET),
          },
        }));
      }
      else {
        incorrect();
        return;
      }
    }
    else {
      lambdaCallback(null, JSON.stringify({
        statusCode: 500,
      }));
    }
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
    }));
  }
};
