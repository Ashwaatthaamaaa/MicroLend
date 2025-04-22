import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const headers = {
  'x-wallet-address': '0x1234567890123456789012345678901234567890',
  'Content-Type': 'application/json'
}

async function testEndpoints() {
  console.log('Starting API tests...\n')

  try {
    // Test GET /api/loans
    console.log('1. Testing GET /api/loans...')
    const loans = await axios.get(`${API_BASE_URL}/loans`, { headers })
    console.log('✓ Success:', loans.data)
    console.log('----------------------------------------\n')

    // Test GET /api/loans/[id]
    console.log('2. Testing GET /api/loans/1...')
    const loan = await axios.get(`${API_BASE_URL}/loans/1`, { headers })
    console.log('✓ Success:', loan.data)
    console.log('----------------------------------------\n')

    // Test POST /api/loans/[id]/fund
    console.log('3. Testing POST /api/loans/1/fund...')
    const fundResult = await axios.post(
      `${API_BASE_URL}/loans/1/fund`,
      { amount: 10 },
      { headers }
    )
    console.log('✓ Success:', fundResult.data)
    console.log('----------------------------------------\n')

    // Test POST /api/loans/[id]/repay
    console.log('4. Testing POST /api/loans/1/repay...')
    const repayResult = await axios.post(
      `${API_BASE_URL}/loans/1/repay`,
      {},
      { headers }
    )
    console.log('✓ Success:', repayResult.data)
    console.log('----------------------------------------\n')

    // Test POST /api/loans/[id]/cancel
    console.log('5. Testing POST /api/loans/1/cancel...')
    const cancelResult = await axios.post(
      `${API_BASE_URL}/loans/1/cancel`,
      {},
      { headers }
    )
    console.log('✓ Success:', cancelResult.data)
    console.log('----------------------------------------\n')

    console.log('All tests completed successfully! 🎉')

  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('❌ Test failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    } else {
      console.error('❌ Test failed:', error)
    }
  }
}

// Run the tests
console.log('Starting API tests...')
testEndpoints() 