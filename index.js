const Discord = require('discord.js');
const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')

const winston = require('winston')
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename: `../ghost.log`,
      timestamp: tsFormat,
      level: 'debug',
      json: false
    })
  ]
});

var url = 'mongodb://localhost:27017/lottghost';
var gifMap = [];

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  logger.info('Connected correctly to server');

  findGifs(db, (docs) => {
    console.log(docs)
    docs.forEach((doc) => {
      gifMap.push({
        name: doc.name,
        url: doc.url
      });
    })
  });

  client.on('ready', () => {
    logger.info('info', 'I am ready!');
  });

  client.on('message', message => {
    var niceChance = .01;
    if (Math.random() < niceChance) {
      message.reply('Nice.\nGlad to hear that.');
    }

    var crazyChance = .02;
    if (message.author.username === 'noobmignon' && Math.random() < crazyChance) {
      message.reply("Haha, that's crazy, man");
    }

    var messageContent = message.content.toLowerCase();
    var params = messageContent.split(' ');

    if (messageContent.indexOf('!addgif') == 0) {
      var messageParams = message.content.split(' ');
      var gifName = messageParams[1];
      var gifUrl = messageParams[2];
      if (!gifMap.find((gif) => gif.name === gifName) && gifUrl) {
        insertGif(gifName, gifUrl, db, (results) => logger.info('inserted ' + gifName + ' gif'));
        gifMap.push({
          name: gifName,
          url: gifUrl
        });
      }
    } else if (messageContent.indexOf('!deletegif') == 0) {
      var gifName = params[1];
      gifMap.splice(gifMap.findIndex((gif) => gif.name === gifName), 1);
      deleteGif(gifName, db, (results) => logger.info('removed ' + gifName + ' gif'));
    } else if (messageContent.indexOf('!listgifs') == 0) {
      var reply = "";
      gifMap.forEach((gif) => {
        reply += "\n" + gif.name;
      });
      message.reply(reply);
    } else if (messageContent.indexOf('!say') == 0) {
      message.delete();
      console.log(messageContent);
      if (messageContent.includes(" *")) {
        var guildId = messageContent.substr(messageContent.indexOf(" *") + 2).split(' ')[0];
        var guild = client.guilds.array().find((guild) => guild.id === guildId);
        var channelName = message.content.substr(messageContent.indexOf(" $") + 2).split(' ')[0];
        var channel = guild.channels.array().find((channel) => channel.name === channelName);
        var sayText = message.content.substr(messageContent.indexOf(" ~") + 2);
        channel.send(sayText);
      } else if (messageContent.includes(" $")) {
        console.log("channel say");
        var channelName = message.content.substr(messageContent.indexOf(" $") + 2).split(' ')[0];
        var channel = message.guild.channels.array().find((channel) => channel.name === channelName);
        var sayText = message.content.substr(messageContent.indexOf(" ~") + 2);
        channel.send(sayText);
      } else {
        message.channel.send(message.content.substr(4));
      }
    } else if (messageContent.indexOf('~') == 0) {
      var commandName = params[0].substr(1);
      var gifData = gifMap.find((gif) => gif.name === commandName);
      if (gifData) {
        message.reply(gifData.url);
      }
    }

    if (message.content === 'ping') {
      message.reply('pong');
    }

    if (message.content.indexOf('little light') >= 0) {
      message.reply("Don't call me that");
    }
  });
});

var findGifs = function(db, callback) {
  var collection = db.collection('gifs');

  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    callback(docs);
  });
};

var insertGif = function(name, url, db, callback) {
  var collection = db.collection('gifs');

  collection.insertOne({name: name, url: url}, function (err, result) {
    assert.equal(err, null);
    callback(result);
  });
};

var deleteGif = function(name, db, callback) {
  var collection = db.collection('gifs');

  collection.deleteOne({name: name}, function (err, result) {
    assert.equal(err, null);
    callback(result);
  });
};

client.login('MjQ1NTU3Nzg5OTAzMDI4MjI0.DEgYTg.Ndgo_f5S2ZTMs3q9TGGFdn5VX6k');
