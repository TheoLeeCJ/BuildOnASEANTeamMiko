const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const AWS = require("aws-sdk");

const fields = ["user"];

// TODO: move to environment variables.
const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });
  
let indexData, index, catData;

async function loadIndex() {
  try {
    indexData = await s3.getObject({
      "Bucket": "miko-internal",
      "Key": "search-index.json",
    }).promise();
  }
  catch (e) {}

  if (!indexData.Body) return;

  indexData = JSON.parse(indexData.Body.toString("utf-8"));
  
  return;
}

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

    if (indexData == null) {
      await loadIndex();
    }

    let resultSet = [];

    for (let entry of indexData) {
      if (entry["user"] == formFields["user"]) {
        resultSet.push(entry);
      }
    }

    lambdaCallback(null, resultSet);

    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      msg: e.toString(),
    }));
  }
};
