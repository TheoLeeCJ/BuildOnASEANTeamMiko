const AWS = require("aws-sdk");
const multipartParser = require("lambda-multipart-parser");
const jwt = require("jsonwebtoken");
const https = require("https");

const fields = ["jwt", "category", "key"];
const rekognitionCategories = [1, 8, 5, 9]; // Digital Storage, Leggings, Measurements on inflatables

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
      callback(outHtml);
      // callback(outHtml.includes("Find other sizes of this image:"));
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

    if (rekognitionCategories.includes(parseInt(formFields["category"]))) {
      let texts = await rekognition.detectText({
        Image: {
          S3Object: {
            Bucket: "miko-user-img",
            Name: formFields["key"],
          },
        },
      }).promise();
      
      texts = texts["TextDetections"].map((el) => { return el["DetectedText"].toLowerCase(); });
      recommendations.fields = [];

      switch (parseInt(formFields["category"])) {
        case 1:
          let manufacturer = "";
          let hasModel = false;
          let addedRpm = false;

          for (let text of texts) {
            if (text.includes("toshiba")) manufacturer = "toshiba";
            if (text.includes("western")) manufacturer = "western digital";
            if (text.includes("wd")) manufacturer = "western digital";

            if (text.includes("hd") && text.length > 4 && manufacturer == "toshiba" && !hasModel) {
              recommendations.fields.push(["Model No.", text]);
              hasModel = true;
            }
            if (text.includes("wd") && text.length > 4 && !text.includes("western") && !text.includes("wdc") && manufacturer == "western digital" && !hasModel) {
              let split = text.split(" ");
              for (let inner of split) {
                if (inner.includes("wd") && inner.length > 5) {
                  recommendations.fields.push(["Model No.", inner]);
                  hasModel = true;
                }
              }
            }
            if (text.includes("st") && text.length > 5 && !hasModel && !text.includes("western")) {
              let split = text.split(" ");
              for (let inner of split) {
                if (inner.includes("st") && inner.length > 5) {
                  recommendations.fields.push(["Model No.", inner]);
                }
              }
              hasModel = true;
            }

            if (text.includes("rpm") && !addedRpm) {
              recommendations.fields.push(["RPM", text]);
              addedRpm = true;
            }
          }

          if (manufacturer !== "") {
            recommendations.fields.push(["Manufacturer", manufacturer]);
          }
          break;
        case 5:
          for (let text of texts) {
            if (text.includes("x") && text.includes(".") && text.includes("m")) {
              recommendations.fields.push(["Dimensions", text]);
            }
            if (text.includes("kg")) {
              recommendations.fields.push(["Inflatable?", "Yes"]);
              recommendations.fields.push(["Weight Limit", text]);
            }
          }
          break;
        case 9: case 8:
          for (let text of texts) {
            if (text.includes("hand") && text.includes("wash")) {
              recommendations.fields.push(["Machine-Washable?", "No"]);
            }
            if (text.includes("achine") && text.includes("wash")) {
              recommendations.fields.push(["Machine-Washable?", "Yes"]);
            }
          }
          break;
        default:
          break;
      }
    }

    lambdaCallback(null, recommendations);

    checkOnlineImg(`https://www.google.com/searchbyimage?hl=en-US&image_url=https://miko-user-img.s3.amazonaws.com/${formFields["key"]}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
      },
    }, (result) => {
      // recommendations.isOnlineImage = result;
      recommendations.isOnlineImage = result.includes("Find other sizes of this image:");
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