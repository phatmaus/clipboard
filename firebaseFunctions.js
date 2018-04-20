'use strict'
const firebase = require("firebase");
const constants = require("./constants.js")();
exports.getRef = function (str) {
    let trimmed = str.trim().substring(0, constants.firebase.maxLength);
    return Buffer(trimmed).toString("base64");
}

exports.firebaseInit = function () {//imported from fb console
    firebase.initializeApp({
        apiKey: "AIzaSyAtZ7DjnwDUGzfCbRLW9wolKgPOegmr9ds",
        authDomain: "ms-jargon.firebaseapp.com",
        databaseURL: "https://ms-jargon.firebaseio.com",
        projectId: "ms-jargon",
        storageBucket: "ms-jargon.appspot.com",
        messagingSenderId: "410138011159"
    });
    return firebase.database();
}