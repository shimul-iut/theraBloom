async function testLogin() {
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  const url = `${baseURL}/api/v1/auth/login`;
  
  console.log('🧪 Testing login endpoint...');
  console.log('URL:', url);
  console.log('Payload:', {
    phoneNumber: '01712345678',
    password: 'password123',
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '01712345678',
        password: 'password123',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('\n❌ Request failed!');
    console.log('Error:', error.message);
    console.log('\n⚠️  Make sure your backend server is running:');
    console.log('   cd backend && npm run dev');
  }
}

testLogin();
