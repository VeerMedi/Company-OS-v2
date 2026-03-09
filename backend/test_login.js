const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'manager@hustlesystem.com',
            password: 'Manager@2024'
        });
        console.log('Login Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('Login Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
