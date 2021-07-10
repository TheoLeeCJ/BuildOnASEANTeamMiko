const multipartParser = require("lambda-multipart-parser");

exports.handler = async (event, context, lambdaCallback) => {
  // lambdaCallback(null, JSON.stringify({
  //     statusCode: 200,
  //     message: execSync("ls .").toString("ascii"),
  // }));
  // return;

  try {
    const result = await multipartParser.parse(event);
    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      message: result,
    }));
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
    }));
  }
};
