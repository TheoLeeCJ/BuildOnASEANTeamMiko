exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: "Testing 123",
        }),
    };
    return response;
};
