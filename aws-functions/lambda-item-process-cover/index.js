const AWS = require("aws-sdk");
const multipartParser = require("lambda-multipart-parser");
const jwt = require("jsonwebtoken");
const https = require("https");

const fields = ["jwt", "category", "key"];
const rekognitionCategories = [1, 8, 5]; // Digital Storage, Leggings, Measurements on inflatables

const SECRET = "dc7bd8c0-06d6-40b0-8bcf-e09d1b4c9f76";

let rekognition = new AWS.Rekognition({ apiVersion: "2016-06-27", region: process.env.AWS_REGION });

function checkOnlineImg(a, b, callback = (c) => {}) {
  https.get(a, b, res => {
    let data = [];
    const redirect = res.headers && res.headers.location ? res.headers.location : null;

    if (res.statusCode === 302) {
      checkOnlineImg(redirect, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
        },
      }, callback);
      return;
    }

    res.on("data", chunk => {
      data.push(chunk);
    });

    res.on("end", () => {
      const outHtml = Buffer.concat(data).toString();
      // console.log(`<!-- is online image: ${outHtml.includes("Find other sizes of this image:")} -->`);
      // console.log(outHtml);
      // callback(outHtml);
      callback(outHtml.includes("Find other sizes of this image:"));
    });
  }).on("error", err => {
    console.log("Error: ", err.message);
  });
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
    
    // grabs attributes like:
    // machine washable, material
    // model number, RPM
    // size
    // ^ for now
    
    let recommendations = {};
    let jwtData = jwt.verify(formFields["jwt"], SECRET, { "algorithms": ["HS256"] }); // important - verify token with HS256; throws error is tampered with

    if (rekognitionCategories.includes(formFields["category"])) {
      let texts = await rekognition.detectText({
        Image: {
          S3Object: {
            Bucket: "miko-user-img",
            Name: formFields["key"],
          },
        },
      }).promise();
      
      recommendations.texts = texts["TextDetections"].map((el) => { return el["DetectedText"]; });
    }

    lambdaCallback(null, recommendations);

    checkOnlineImg(`https://www.google.com/searchbyimage?hl=en-US&image_url=https://miko-user-img.s3.amazonaws.com/${formFields["key"]}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
      },
    }, (result) => {
      recommendations.isOnlineImage = result;
      lambdaCallback(null, recommendations);
    });

    return;
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
      msg: e.toString(),
    }));
  }
};