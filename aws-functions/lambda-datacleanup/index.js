const AWS = require("aws-sdk"); 
const users = ["pekora", "tohru", "mikoiino", "gawrgura", "sakuramiko35", "kobayashi", "kannakamui"];

const catData = {
  "largest": 9,
  "categories": [
    {
      "id": 0,
      "name": "Electronic Devices",
      "sub": [
        {
          "id": 1,
          "name": "Digital Storage",
          "filters": ["Some Bad Sectors?", "< 50% Terabytes Written?", "Disk health report?"],
          "questions": ["Does this product have any bad sectors?", "How much of the product's TBW rating been consumed?", "Do you have a hard drive health report?"]
        },
        {
          "id": 2,
          "name": "Laptops and PCs"
        }
      ]
    },
    {
      "id": 3,
      "name": "Toys",
      "sub": [
        {
          "id": 4,
          "name": "Kids' Toys"
        },
        {
          "id": 5,
          "name": "Water Toys",
          "filters": ["Small Stains?", "Minor Leaks?", "Inflatable?"],
          "questions": ["Does this product have minor stains?", "Does it have minor leaks?", "Is it an inflatable, or a foam-based float?"]
        }
      ]
    },
    {
      "id": 6,
      "name": "Everything Else"
    },
    {
      "id": 7,
      "name": "Clothes",
      "sub": [
        {
          "id": 8,
          "name": "Leggings",
          "filters": ["Denim?", "Machine-Washable?", "Minor Tears?"],
          "questions": ["Is it made of denim?", "Is it machine-washable?", "Are there any tears / rips on this product?"]
        },
        {
          "id": 9,
          "name": "Shirts",
          "filters": ["Minor Tears?"]
        }
      ]
    },
    {
      "id": 10,
      "name": "Anime Merch",
      "sub": [
        {
          "id": 11,
          "name": "Figurines",
          "filters": ["Small", "Tall"],
          "questions": ["Small figurine?", "Large / tall figurine?"]
        },
        {
          "id": 12,
          "name": "Cosplays"
        }
      ]
    },
    {
      "id": 13,
      "name": "Electrical Appliances",
      "sub": [
        {
          "id": 14,
          "name": "Electric Fans",
          "filters": ["Cleaning required?", "Remote Controlled?"],
          "questions": ["Does the buyer need to dust it off?", "Is the fan remote-controlled?"]
        }
      ]
    }
  ]
}["categories"];

let s3 = new AWS.S3({ apiVersion: "2006-03-01", region: process.env.AWS_REGION });
let db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10", region: process.env.AWS_REGION });

function randUser() {
  return users[Math.floor(Math.random() * 7)];
}

exports.handler = async (event, context, lambdaCallback) => {
  try {
    let index = [];
    let indexData, dataset;
    let usersItems = {};

    for (let i = 0; i < users.length; i++) {
      usersItems[users[i]] = [];
    }

    let scanParams = {
      TableName: "items",
      AttributesToGet: ["itemId", "category", "condition", "price"],
    };

    try {
      // TODO: USE LastEvaluatedKey TO SCAN FURTHER IF 1 MB LIMIT EXCEEDED!!!
      let response = await db.scan(scanParams).promise();
      dataset = response.Items;
    }
    catch (e) {
      lambdaCallback(null, e.toString());
      return;
    }

    for (let i = 0; i < dataset.length; i++) {
      let item = dataset[i];

      let user = randUser();
      item["user"] = user;
      usersItems[user].push(item["category"] + "-" + item["itemId"]);

      let cond = JSON.parse(item["condition"]);
      for (let i2 = 0; i2 < catData.length; i2++) {
        if (catData[i2].sub == undefined) continue;
        
        for (let i3 = 0; i3 < catData[i2].sub.length; i3++) {
          if (catData[i2].sub[i3].id == item["category"]) {
            if (catData[i2].sub[i3].filters == undefined) continue;
            cond = {};
            for (let i4 = 0; i4 < catData[i2].sub[i3].filters.length; i4++) {
              cond[catData[i2].sub[i3].filters[i4]] = ["Yes", "No"][Math.floor(Math.random() * 2)];
            }
          }
        }
      }

      item["condition"] = JSON.stringify(cond);

      if (typeof item["price"] !== "number") {
        let priceClean = item["price"].split("S$");
        item["price"] = parseInt(priceClean[priceClean.length - 1]);

        if (item["price"].toString() == "NaN") item["price"] = 0;
      }
      
      await db.update({
        TableName: "items",
        Key: { itemId: item["itemId"], category: item["category"], },
        UpdateExpression: "set userId = :userData, price = :priceData, #cond = :condData",
        ExpressionAttributeNames: { "#cond": "condition", },
        ExpressionAttributeValues: { ":userData": user, ":priceData": item["price"], ":condData": item["condition"], },
      }).promise();

      // lambdaCallback(null, item); return;
    }

    for (let i = 0; i < Object.keys(usersItems).length; i++) {
      console.log(Object.keys(usersItems)[i]);
      await db.update({
        TableName: "users",
        Key: { userId: Object.keys(usersItems)[i], greenPts: 0, },
        UpdateExpression: "set #items = :itemsData",
        ExpressionAttributeNames: { "#items": "items" },
        ExpressionAttributeValues: { ":itemsData": JSON.stringify(usersItems[Object.keys(usersItems)[i]]), },
      }).promise();
    }

    lambdaCallback(null, "a");
  }
  catch (e) {
    console.log(e.toString());
  }
};