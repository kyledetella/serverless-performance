exports.main = async (
  event: any
): Promise<{ status: string; message: string }> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  return {
    status: "OK",
    message: `Completed at ${Date.now()}`,
  };
};
