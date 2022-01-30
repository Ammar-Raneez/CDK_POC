exports.main = async (event, context) => {
  if (event.httpMethod) {
    return {
      statusCode: 200,
      body: 'Hello from lambda!'
    }
  }

  return [
    {
      bidder: "ammar.2019163@iit.ac.lk",
      title: "Test Auction"
    }
  ];
}
