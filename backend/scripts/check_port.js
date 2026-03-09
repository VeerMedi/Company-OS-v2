require('dotenv').config();
console.log('PORT in .env:', process.env.PORT);
console.log('Effective PORT:', process.env.PORT || 5005);
