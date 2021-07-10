const jwt = require("jsonwebtoken");
const multipartParser = require("lambda-multipart-parser");
const bcrypt = require("bcryptjs");

exports.handler = async (event, context, lambdaCallback) => {
  try {
    const result = await multipartParser.parse(event);
    lambdaCallback(null, JSON.stringify({
      statusCode: 200,
      message: {
        username: result["username"],
        password: result["password"],
      },
    }));
  }
  catch (e) {
    lambdaCallback(null, JSON.stringify({
      statusCode: 400,
    }));
  }
};
