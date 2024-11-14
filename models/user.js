const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    hashedPassword: String,
});

const User = mongoose.model('User', userSchema);

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        delete returnedObject.hashedPassword;
    }
});

module.exports = User;