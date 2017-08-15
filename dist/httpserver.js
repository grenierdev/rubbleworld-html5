"use strict";
exports.__esModule = true;
var express = require("express");
var app = express();
app.use(express.static(__dirname));
app.listen(4000, function () {
    console.log('Static server listening to http://localhost:4000/');
});
