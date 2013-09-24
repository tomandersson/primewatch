var NTwitter = require('ntwitter'),
    mathUtils = require('mathutils'),
    db = require('./db.js'),
    nconf = require('nconf');

nconf.use('file', { file: 'config.json' });

       console.log('consumer secret is ' + nconf.get('consumerSecret'))

var twit = new NTwitter({
    consumer_key: nconf.get('consumerKey'),
    consumer_secret: nconf.get('consumerSecret'),
    access_token_key: nconf.get('accessTokenKey'),
    access_token_secret: nconf.get('accessTokenSecret')
});

var statuses = [
        "That's prime!",
        "Thanks, that's a prime.",
        "Prime material! *ba-dum-tisch*",
        "Primearama!",
        "Totally a prime number!",
        "Yeah, guess that's a prime number ..",
        "That one's a keeper.",
        "Ok, another prime, 'cool'.",
        "Cool, been looking for that one.",
        "P-R-I-M-E!", "Mhm, thanks. Another prime.",
        "Putting that on my list.",
        "That's a prime - thanks!",
        "Another one found -- grand!",
        "Neat, a prime!",
        "Not _too_ chuffed, but I guess that counts as prime ..",
        "Prime.",
        "Yeah, prime.",
        "You just posted a prime number.",
        "You just posted a prime.",
        "You just posted a prime - thanks!",
        "Found one!",
        "Found a prime.",
        "Prime spotted!",
        "Here's another prime: 3."
    ],
    antiStatuses = [
        "Sorry, that's not a prime.",
        "Nice try, but not quite right.",
        "Nah, don't want that one. Not a prime.",
        "Hm, not having it; not prime enough.",
        "Thanks, but I'll keep looking. For primes.",
        "Looking for primes, that's not one. Thanks tho.",
        "Not prime. No shame in trying though, I guess.",
        "I'm more into primes, thanks. Like 3.",
        "I'm more into primes, thanks. Like 5, or 7.",
        "Close. Been looking for primes, you seen any?",
        "Prime numbers only, please"
    ],
    sendCount = 0,
    sendCountTarget;

var getStatus = function (isPrime) {
    return isPrime ? statuses[Math.floor(Math.random() * (statuses.length - 1))]
        : antiStatuses[Math.floor(Math.random() * (antiStatuses.length - 1))];
};

var doUpdate = function (number, data) {
    var isPrime = mathUtils.isPrime(number);

    if (isPrime || sendCount === sendCountTarget) {
        console.log(number + " will be tweeted (isPrime? " + isPrime + "): " + data.text);

        /*twit.updateStatus("@" + data.user.screen_name + " " + number + ". " + getStatus(isPrime),
            {"in_reply_to_status_id": data.id_str},
            function (err, retVal) {
                if (!err && isPrime) {
                    db.put(number, data);
                }
            }
        );*/
        sendCount = sendCount < sendCountTarget ? sendCount + 1 : 0;
        if (!sendCount) {
            console.log("Updating sendCountTarget");
            sendCountTarget = getNewSendCount();
        }
    }
};

var getNewSendCount = function () {
    var count;

    do {
        count = Math.floor(Math.random() * (24 - 5 + 1)) + 5;
    } while (!mathUtils.isPrime(count));

    console.log("New sendCount is " + count)
    return count;
};

sendCountTarget = getNewSendCount();

process.on( 'SIGINT', function() {
    console.log("\nGracefully shutting down from  SIGINT (Crtl-C)");
    db.close();
    process.exit();
});

twit.stream('statuses/sample', function(stream) {
    stream.on('data', function (data) {
        if (data.text.match(/(?:^| )\d{1,16}(?:\s+|\.\s+|$)/)) {
            var number = Number(data.text.replace(/.*(?:^| )(\d{1,16})(?:\s+|\.\s+|$).*/, '$1'));

            if (number > 3) {
                db.get(number, function (err, item) {
                    if (err) {
                        console.log("Error while getting item '" + number + "': " + err);
                    } else if (!item) {
                        doUpdate(number, data);
                    }
                });
            }
        }
    });
});
