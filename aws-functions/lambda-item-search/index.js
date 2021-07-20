const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');
const { Index } = require("flexsearch");

const fields = ["refresh", "page"]; // TODO: remove auth requirement for public search
// OPTIONAL fields: category, sortBy, query

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

    // now, the JWT is only used to update buying interests - if it is present
    let jwtData = null;
    if (formFields["jwt"] !== undefined) jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with
    
    if (
      indexData == null ||
      formFields["refresh"] == "immediate"
    ) await loadIndex();

    let selectCats = [];
    let customFilters = [];
    let rawCat = -1;
    let page = formFields["page"];

    try {
      rawCat = parseInt(formFields["category"]);
      
      // update buying interests if user is signed in
      if (rawCat !== -1 && jwtData !== null) {
        let user = await db.query({
          TableName: "users",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": jwtData["user"],
          },
        }).promise();
        user = user.Items[0];

        let catKey = `cat${rawCat}`;

        if (user["buyingInterests"][0] !== "{") {
          let buyingInterests = {};
          buyingInterests[catKey] = 3;
          user["buyingInterests"] = JSON.stringify(buyingInterests);
        }
        else {
          let buyingInterests = JSON.parse(user["buyingInterests"]);
          if (Object.keys(buyingInterests).includes(catKey)) buyingInterests[catKey] += 1;
          else buyingInterests[catKey] = 3;
          user["buyingInterests"] = JSON.stringify(buyingInterests);
        }
        
        await db.update({
          TableName: "users",
          Key: { userId: user["userId"], greenPts: user["greenPts"], },
          UpdateExpression: "set #buy = :buyData",
          ExpressionAttributeNames: { "#buy": "buyingInterests" },
          ExpressionAttributeValues: { ":buyData": user["buyingInterests"], },
        }).promise();
      }
    }
    catch (e) {
      rawCat = -1;
    }

    if (rawCat !== -1) {
      // build category filter
      selectCats = [rawCat];

      for (let i = 0; i < catData.length; i++) {
        if (catData[i]["id"] == rawCat) {
          if (!catData[i]["sub"]) break;
          for (let i2 = 0; i2 < catData[i]["sub"].length; i2++) selectCats.push(catData[i]["sub"][i2]["id"]);
          break;
        }
      }

      // build fields filter
      if (formFields["customFilter"] !== undefined && formFields["customFilter"].length > 2) {
        customFilters = JSON.parse(new Buffer(formFields["customFilter"], "base64").toString("ascii"));
        for (let i = 0; i < customFilters.length; i++) {
          customFilters[i] = new Buffer(customFilters[i], "base64").toString("ascii");
        }
      }
    }

    if (formFields["query"] == "") {
      if (rawCat == -1) throw Error;
      
      let resultSet = [];
      for (let i = 0; i < indexData.length; i++) {
        if (resultSet.length > (12 + (page * 12))) break;
        if (selectCats.includes(indexData[i]["cat"])) {
          if (customFilters.length > 0) {
            let filtersSatisfied = 0;
            for (let i2 = 0; i2 < customFilters.length; i2++) {
              if (indexData[i]["cond"][customFilters[i2]] == "Yes") filtersSatisfied++;
            }
            if (filtersSatisfied == customFilters.length) resultSet.push(indexData[i]);
          }
          else {
            resultSet.push(indexData[i]);
          }
        }
      }
  
      lambdaCallback(null, resultSet.slice(page * 12));
    }
    else {
      let rawResultSet = index.search(formFields["query"], { index: "name" });
      let resultSet = [];
  
      for (let i = 0; i < rawResultSet.length; i++) {
        if (resultSet.length > (12 + (page * 12))) break;

        if (rawCat !== -1) {
          if (selectCats.includes(indexData[rawResultSet[i]]["cat"])) {
            if (customFilters.length > 0) {
              let filtersSatisfied = 0;
              for (let i2 = 0; i2 < customFilters.length; i2++) {
                if (indexData[i]["cond"][customFilters[i2]] == "Yes") filtersSatisfied++;
              }
              if (filtersSatisfied == customFilters.length) resultSet.push(indexData[i]);
            }
            else {
              resultSet.push(indexData[i]);
            }
          }
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
