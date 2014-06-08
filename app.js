var NTwitter = require('ntwitter'),
    mathUtils = require('mathutils'),
    db = require('./db.js'),
    nconf = require('nconf');

nconf.use('file', { file: 'config.json' });

var twit = new NTwitter({
        consumer_key: nconf.get('consumerKey'),
        consumer_secret: nconf.get('consumerSecret'),
        access_token_key: nconf.get('accessTokenKey'),
        access_token_secret: nconf.get('accessTokenSecret')
    }),
    timeout = nconf.get('tweetTimeout') || 2 * 60000;

var statuses = [
        "That's prime!",
        "Thanks, that's a prime.",
        "Primearama!",
        "Totally a prime number!",
        "Yeah, guess that's a prime number ..",
        "That one's a keeper.",
        "Ok, another prime, 'cool'.",
        "Cool, been looking for that one.",
        "P-R-I-M-E!",
        "Putting that on my list.",
        "That's a prime - thanks!",
        "Another one found -- grand!",
        "Neat, a prime!",
        "Prime.",
        "Yeah, prime.",
        "Someone just posted a prime number.",
        "Someone just posted a prime.",
        "Someone just posted a prime - thanks!",
        "Found one!",
        "Found a prime.",
        "Prime spotted!",
        "Here's another prime: 3.",
        "More primes!",
        "Getting closer to finding them all ..",
        "Can't be that many left now!"
    ];

var getStatus = function () {
    return statuses[Math.floor(Math.random() * (statuses.length - 1))];
};

var doUpdate = function (number, data) {
    var isPrime = mathUtils.isPrime(number);

    if (isPrime) {
        console.log(number + " will be tweeted: " + data.text);

        twit.updateStatus(number + "! " + getStatus() + " #PrimeWatch \nhttp://twitter.com/#!" + data.user.id + "/status/" + data.id_str,
            {},
            function (err) {
                if (!err && isPrime) {
                    db.put(number, data);
                }
            }
        );

    }

    return isPrime;
};

process.on( 'SIGINT', function() {
    console.log("\nGracefully shutting down from  SIGINT (Crtl-C)");
    db.close();
    process.exit();
});

function listenToStream () {
    console.log("Listening to stream");
    twit.stream('statuses/sample', function(stream) {
        stream.on('data', function (data) {
            if (data.text.match(/(?:^| )\d{1,16}(?:\s+|\.\s+|$)/)) {
                var number = Number(data.text.replace(/.*(?:^| )(\d{1,16})(?:\s+|\.\s+|$).*/, '$1'));

                if (number > 3) {
                    db.get(number, function (err, item) {
                        if (err) {
                            console.log("Error while getting item '" + number + "': " + err);
                        } else if (!item) {
                            if (doUpdate(number, data)) {
                                console.log("Found new prime: " + number);
                                stream.destroy();
                                setTimeout(listenToStream, timeout);
                            }
                        }
                    });
                }
            }
        });
    });
}

listenToStream();