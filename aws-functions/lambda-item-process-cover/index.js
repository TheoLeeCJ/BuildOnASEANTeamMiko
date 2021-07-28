const AWS = require("aws-sdk");
const multipartParser = require("lambda-multipart-parser");

const fields = ["jwt", "category", "pending-image"];

let rekognition = new AWS.Rekognition({ apiVersion: "2016-06-27", region: process.env.AWS_REGION });

exports.handler = async (event, context, lambdaCallback) => {
  try {
    // const formFields = await multipartParser.parse(event);

    // for (let i = 0; i < fields.length; i++) {
    //   if (formFields[fields[i]] == "" || formFields[fields[i]] === undefined || formFields[fields[i]] == null) {
    //     lambdaCallback(null, JSON.stringify({
    //       statusCode: 200,
    //       msg: {
    //         success: false,
    //         reason: "missing",
    //       },
    //     }));
    //     return;
    //   }
    // }

    let a = await rekognition.detectText({
      Image: {
        S3Object: {
          Bucket: "console-sample-images",
          Name: "coffee_monday.jpg",
        },
      },
    }).promise();
    
    lambdaCallback(null, a);

    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      msg: e.toString(),
    }));
  }
};