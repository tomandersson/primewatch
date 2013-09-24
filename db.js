var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    exports = module.exports;

var serverOptions = {
        'auto_reconnect': true,
        'poolSize': 10
    },
    mongoClient = new MongoClient(new Server('localhost', 27017, serverOptions)),
    dbName = "primewatch",
    collectionName = "primes",
    db;


mongoClient.open(function (err, mongoClient) {
    db = mongoClient.db(dbName);
});

exports.get = function (id, callback) {
    db.collection(collectionName, function (err, collection) {
        collection.findOne({ _id: id }, callback || function() {});
    });
};

exports.put = function (id, object, callback) {
    db.collection(collectionName, function (err, collection) {
        collection.save(
            { _id: id, data: object},
            {safe: true},
            callback || function () {}
        )
    });
};

exports.close = function () {
    db.close();
};