var firebase = require("firebase");
var constants = require("./constants.js");
exports.formatForFirebase = function (str) {    
    return str.trim().replace(/[\/\.\#\$\[\] ]/g, '').substring(constants.firebase.maxLength);//invalid firebase key chars
}

exports.firebaseInit = function () {    
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