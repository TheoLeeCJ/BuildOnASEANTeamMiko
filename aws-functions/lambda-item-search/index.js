const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');
const { Index } = require("flexsearch");

const fields = ["jwt", "refresh", "page"]; // TODO: remove auth requirement for public search
// OPTIONAL fields: category, sortBy, query

// TODO: move to environment variables.
const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
  
let indexData, index, catData;

async function loadIndex() {
  try {
    indexData = await s3.getObject({
      "Bucket": "miko-internal",
      "Key": "search-index.json",
    }).promise();
    catData = await s3.getObject({
      "Bucket": "miko-user-img",
      "Key": "categories.json",
    }).promise();
  }
  catch (e) {}

  if (!indexData.Body) return;

  indexData = JSON.parse(indexData.Body.toString("utf-8"));
  catData = JSON.parse(catData.Body.toString("utf-8"))["categories"];

  indexData.sort((first, second) => {
    return parseInt(first["id"].substring(0, 13)) < parseInt(second["id"].substring(0, 13));
  });

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

    let selectCats = [];
    let rawCat = -1;
    let page = formFields["page"];

    try {
      rawCat = parseInt(formFields["category"]);
    }
    catch (e) {
      rawCat = -1;
    }

    // build category filter
    if (rawCat !== -1) {
      selectCats = [rawCat];

      for (let i = 0; i < catData.length; i++) {
        if (catData[i]["id"] == rawCat) {
          if (!catData[i]["sub"]) break;
          for (let i2 = 0; i2 < catData[i]["sub"].length; i2++) selectCats.push(catData[i]["sub"][i2]["id"]);
          break;
        }
      }
    }

    if (formFields["query"] == "") {
      if (rawCat == -1) throw Error;
      
      let resultSet = [];
      for (let i = 0; i < indexData.length; i++) {
        if (resultSet.length > (12 + (page * 12))) break;
        if (selectCats.includes(indexData[i]["cat"])) resultSet.push(indexData[i]);
      }
  
      lambdaCallback(null, resultSet.slice(page * 12));
    }
    else {
      let rawResultSet = index.search(formFields["query"], { index: "name" });
      let resultSet = [];
  
      for (let i = 0; i < rawResultSet.length; i++) {
        if (resultSet.length > (12 + (page * 12))) break;

        if (rawCat !== -1) {
          if (selectCats.includes(indexData[rawResultSet[i]]["cat"])) resultSet.push(indexData[rawResultSet[i]]);
        }
        else {
          resultSet.push(indexData[rawResultSet[i]]);
        }
      }
  
      lambdaCallback(null, resultSet.slice(page * 12));
    }

    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      msg: e.toString(),
    }));
  }
};
