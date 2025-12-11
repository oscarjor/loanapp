// Simple Node.js script to test tRPC endpoints

async function testLoanAPI() {
  const baseUrl = 'http://localhost:3000/trpc';

  console.log('Testing tRPC Loan API...\n');

  // 1. List loans (should be empty)
  console.log('1. Listing all loans...');
  let response = await fetch(`${baseUrl}/loan.list`);
  let data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  // 2. Create a loan
  console.log('\n2. Creating a new loan...');
  const loanData = {
    borrowerName: 'John Doe',
    borrowerEmail: 'john@example.com',
    propertyType: 'MULTIFAMILY',
    propertySizeSqft: 25000,
    propertyAgeYears: 5,
    loanAmount: 4000000,
  };

  response = await fetch(`${baseUrl}/loan.create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: loanData }),
  });
  data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.result?.data?.json?.id) {
    const loanId = data.result.data.json.id;
    console.log(`Created loan with ID: ${loanId}`);

    // 3. Get the loan by ID
    console.log(`\n3. Getting loan ${loanId}...`);
    response = await fetch(`${baseUrl}/loan.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: loanId } }))}`);
    data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    // 4. Request valuation
    console.log(`\n4. Requesting valuation for loan ${loanId}...`);
    response = await fetch(`${baseUrl}/loan.requestValuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { loanId } }),
    });
    data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    // 5. List loans again
    console.log('\n5. Listing all loans (should show the created loan with valuation)...');
    response = await fetch(`${baseUrl}/loan.list`);
    data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  }
}

testLoanAPI().catch(console.error);
