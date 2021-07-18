const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');
const { Index, Document, Worker } = require("flexsearch");

const fields = ["jwt", "refresh"]; // TODO: remove auth requirement for public search
// OPTIONAL fields: category, sortBy, query

// TODO: move to environment variables.
const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
  
let indexData, index;

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

  index = new Index();

  for (let i = 0; i < indexData.length; i++) {
    index.add(i, indexData[i]["name"]);
  }
  
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

    // TODO: remove auth requirement for public search
    let jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with
    
    if (
      indexData == null ||
      formFields["refresh"] == "immediate"
    ) await loadIndex();

    let rawResultSet = index.search(formFields["query"], { index: "name" });
    let resultSet = [];

    for (let i = 0; i < rawResultSet.length; i++) {
      resultSet.push(indexData[rawResultSet[i]]);
    }

    lambdaCallback(null, resultSet);

    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 401,
      msg: e.toString(),
    }));
  }
};
