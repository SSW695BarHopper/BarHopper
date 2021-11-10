/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const AWS = require("aws-sdk");
var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
var bodyParser = require("body-parser");
var express = require("express");

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "BarTable";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "id";
const partitionKeyType = "S";
const sortKeyName = "";
const sortKeyType = "";
const hasSortKey = sortKeyName !== "";
const path = "/bars";
const UNAUTH = "UNAUTH";
const hashKeyPath = "/:" + partitionKeyName;
const sortKeyPath = hasSortKey ? "/:" + sortKeyName : "";

// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch (type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
};

/**********************
 * GET bar methods *
 **********************/

app.get("/bars", function (req, res) {
  //TODO: Add Error Handling

  let axios = require("axios");

  let config = {
    method: "get",
    url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${req.query.lat}%2C${req.query.long}&radius=${req.query.radius}&type=bar&key=${process.env.GOOGLE_API_KEY}`,
    headers: {},
  };

  let latLong = req.latLong;
  let response;

  const sendGetRequest = async () => {
    try {
      response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${req.query.lat}%2C${req.query.long}&radius=${req.query.radius}&type=bar&key=${process.env.GOOGLE_API_KEY}`
      );
      res.send(response.data);
    } catch (err) {
      // Handle Error Here
      console.error(err);
    }
  };

  sendGetRequest();

  res.json({ response });

  // axios(config)
  //   .then(function (response) {
  //     let results = [];

  //     res.json(response.data.results);

  //     // response.data.results.forEach((bar) => {
  //     //   // results.push({bar.name, bar.vicinity, bar.opening_hours, bar.phone_number, bar.photo_reference});
  //     //   results.push(bar);
  //     //   // if lat/long is in the table
  //     //   // add attributes to current object

  //     //   // append: name, vicinity, ?phone_number, opening_hours, photo_reference
  //     // });

  //     // res.send(results);
  //     res.json({ success: "Google Maps API did trigger", url: req.url });
  //     console.log(JSON.stringify(response.data));
  //   })
  //   .catch(function (error) {
  //     res.json({ error });
  //   });

  // res.json({ success: "Google Maps API didn't trigger", url: req.url });
});

// app.get("*", function (req, res) {
//   res.json({ success: "* route", url: req.url });
// });

app.get("/bars/:id", function (req, res) {
  //TODO: Add error handling

  let axios = require("axios");

  let config = {
    method: "get",
    url: `https://maps.googleapis.com/maps/api/place/details/json?place_id=${req.params.id}&key=${process.env.GOOGLE_API_KEY}`,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      let result = {
        name: response.data.result["name"],
        location: "response.data.results.geometry.location",
        address: "address",
        phone_number: "phone number",
        open_time: "open time",
        close_time: "close time",
        vaccination_protocols: "show a vaccination card",
      };

      //TODO: Integrate with Dynamo to get line_attributes and music
      result.line_attributes = "[]";
      result.music_playing = "[]";

      res.json(result);
    })
    .catch(function (error) {
      res.json({ error });
    });
});

// /****************************
//  * Example post method *
//  ****************************/

// app.post("/items", function (req, res) {
//   // Add your code here
//   res.json({ success: "post call succeed!", url: req.url, body: req.body });
// });

// app.post("/items/*", function (req, res) {
//   // Add your code here
//   res.json({ success: "post call succeed!", url: req.url, body: req.body });
// });

// /****************************
//  * Example put method *
//  ****************************/

// app.put("/items", function (req, res) {
//   // Add your code here
//   res.json({ success: "put call succeed!", url: req.url, body: req.body });
// });

// app.put("/items/*", function (req, res) {
//   // Add your code here
//   res.json({ success: "put call succeed!", url: req.url, body: req.body });
// });

// /****************************
//  * Example delete method *
//  ****************************/

// app.delete("/items", function (req, res) {
//   // Add your code here
//   res.json({ success: "delete call succeed!", url: req.url });
// });

// app.delete("/items/*", function (req, res) {
//   // Add your code here
//   res.json({ success: "delete call succeed!", url: req.url });
// });

/********************************
 * HTTP Get method for list objects *
 ********************************/

// app.get(path + hashKeyPath, function (req, res) {
//  var condition = {};
//  condition[partitionKeyName] = {
//    ComparisonOperator: 'EQ'
//  };

//  if (userIdPresent && req.apiGateway) {
//    condition[partitionKeyName]['AttributeValueList'] = [
//      req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
//        UNAUTH
//    ];
//  } else {
//    try {
//      condition[partitionKeyName]['AttributeValueList'] = [
//        convertUrlType(req.params[partitionKeyName], partitionKeyType)
//      ];
//    } catch (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Wrong column type ' + err });
//    }
//  }

//  let queryParams = {
//    TableName: tableName,
//    KeyConditions: condition
//  };

//  dynamodb.query(queryParams, (err, data) => {
//    if (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Could not load items: ' + err });
//    } else {
//      res.json(data.Items);
//    }
//  });
// });

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

// app.get(path + '/object' + hashKeyPath + sortKeyPath, function (req, res) {
//  var params = {};
//  if (userIdPresent && req.apiGateway) {
//    params[partitionKeyName] =
//      req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
//      UNAUTH;
//  } else {
//    params[partitionKeyName] = req.params[partitionKeyName];
//    try {
//      params[partitionKeyName] = convertUrlType(
//        req.params[partitionKeyName],
//        partitionKeyType
//      );
//    } catch (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Wrong column type ' + err });
//    }
//  }
//  if (hasSortKey) {
//    try {
//      params[sortKeyName] = convertUrlType(
//        req.params[sortKeyName],
//        sortKeyType
//      );
//    } catch (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Wrong column type ' + err });
//    }
//  }

//  let getItemParams = {
//    TableName: tableName,
//    Key: params
//  };

//  dynamodb.get(getItemParams, (err, data) => {
//    if (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Could not load items: ' + err.message });
//    } else {
//      if (data.Item) {
//        res.json(data.Item);
//      } else {
//        res.json(data);
//      }
//    }
//  });
// });

/************************************
 * HTTP put method for insert object *
 *************************************/

// app.put(path, function (req, res) {
//  if (userIdPresent) {
//    req.body['userId'] =
//      req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
//      UNAUTH;
//  }

//  let putItemParams = {
//    TableName: tableName,
//    Item: req.body
//  };
//  dynamodb.put(putItemParams, (err, data) => {
//    if (err) {
//      res.statusCode = 500;
//      res.json({ error: err, url: req.url, body: req.body });
//    } else {
//      res.json({
//        success: 'put call succeed!',
//        url: req.url,
//        data: data
//      });
//    }
//  });
// });

/************************************
 * HTTP post method for insert object *
 *************************************/

// app.post(path, function (req, res) {
//  if (userIdPresent) {
//    req.body['userId'] =
//      req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
//      UNAUTH;
//  }

//  let putItemParams = {
//    TableName: tableName,
//    Item: req.body
//  };
//  dynamodb.put(putItemParams, (err, data) => {
//    if (err) {
//      res.statusCode = 500;
//      res.json({ error: err, url: req.url, body: req.body });
//    } else {
//      res.json({
//        success: 'post call succeed!',
//        url: req.url,
//        data: data
//      });
//    }
//  });
// });

/**************************************
 * HTTP remove method to delete object *
 ***************************************/

// app.delete(path + '/object' + hashKeyPath + sortKeyPath, function (req, res) {
//  var params = {};
//  if (userIdPresent && req.apiGateway) {
//    params[partitionKeyName] =
//      req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
//      UNAUTH;
//  } else {
//    params[partitionKeyName] = req.params[partitionKeyName];
//    try {
//      params[partitionKeyName] = convertUrlType(
//        req.params[partitionKeyName],
//        partitionKeyType
//      );
//    } catch (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Wrong column type ' + err });
//    }
//  }
//  if (hasSortKey) {
//    try {
//      params[sortKeyName] = convertUrlType(
//        req.params[sortKeyName],
//        sortKeyType
//      );
//    } catch (err) {
//      res.statusCode = 500;
//      res.json({ error: 'Wrong column type ' + err });
//    }
//  }

//  let removeItemParams = {
//    TableName: tableName,
//    Key: params
//  };
//  dynamodb.delete(removeItemParams, (err, data) => {
//    if (err) {
//      res.statusCode = 500;
//      res.json({ error: err, url: req.url });
//    } else {
//      res.json({ url: req.url, data: data });
//    }
//  });

// });
// respond with "hello world" when a GET request is made to the homepage
// app.get("*", function (req, res) {
//   //TODO: Add Error Handling

//   var axios = require("axios");

//   var config = {
//     method: "get",
//     url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${req.query.lat}%2C${req.query.long}&radius=${req.query.radius}&type=bar&key=${process.env.GOOGLE_API_KEY}`,
//     headers: {},
//   };

//   let latLong = req.latLong;

//   axios(config)
//     .then(function (response) {
//       let results = [];

//       response.data.results.forEach((bar) => {
//         // results.push({bar.name, bar.vicinity, bar.opening_hours, bar.phone_number, bar.photo_reference});
//         results.push({ bar });
//         // if lat/long is in the table
//         // add attributes to current object

//         // append: name, vicinity, ?phone_number, opening_hours, photo_reference
//       });

//       res.send(results);
//       console.log(JSON.stringify(response.data));
//     })
//     .catch(function (error) {
//       res.send(error);
//     });
// });

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;