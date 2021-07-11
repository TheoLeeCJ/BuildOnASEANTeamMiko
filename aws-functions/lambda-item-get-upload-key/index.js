const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const short = require('short-uuid');

const fields = ["jwt"];

const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });
let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });

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
    let imgId = short.generate();

    s3.createPresignedPost({
      Bucket: "miko-user-img",
      Expires: 600,
      Conditions: [
        ["eq", "$acl", "public-read"],
        ["eq", "$key", `user-img/${imgId}`],
        ["content-length-range", 1, 5242880],
        ["starts-with", "$Content-Type", "image/"],
      ],
    }, (error, data) => {
      if (error) {
        lambdaCallback(null, JSON.stringify({
          statusCode: 200,
          msg: {
            success: false,
          },
        }));
        return;
      }

      lambdaCallback(null, JSON.stringify({
        statusCode: 200,
        msg: {
          success: true,
          presignedPost: data,
          imgKey: `user-img/${imgId}`,
        },
      }));
      return;
    });
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 401,
    }));
  }
};
