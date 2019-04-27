// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var partidaSchema = mongoose.Schema({

    partida            : {
        numero    : Number,
        estado    : {type: String, default:"vacio"} ,
        id_sala   : Number
    },
    sala : {
      numero : {type: Number, default 1},
    }
});



// create the model for users and expose it to our app
module.exports = mongoose.model('Partida', partidaSchema);
