import axios from 'axios';

async function testLogin() {
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing login endpoint...');
  console.log('URL:', `${baseURL}/api/v1/auth/login`);
  console.log('Payload:', {
    phoneNumber: '01712345678',
    password: 'password123',
  });

  try {
    const response = await axios.post(`${baseURL}/api/v1/auth/login`, {
      phoneNumber: '01712345678',
      password: 'password123',
    });

    console.log('\n✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received. Is the server running?');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
