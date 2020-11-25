module.exports.main = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  return {
    status: "OK",
    message: `Completed at ${Date.now()}`,
  };
};
