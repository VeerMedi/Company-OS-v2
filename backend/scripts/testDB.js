const mongoose = require('mongoose');

const uri = "mongodb+srv://sourabhsompandey_db_user:sourabh01@hustledatabase.fsycdzj.mongodb.net/hustledatabase?retryWrites=true&w=majority";

console.log('Attempting to connect with SRV URI...');

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB Atlas!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
