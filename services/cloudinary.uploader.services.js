export async function uploadToCloud(filePath) {
  return {
    secureUrl: "https://res.cloudinary.com/steamminds/image/upload/v12345678/mock.png",
    publicId: "mock_public_id_" + Date.now()
  };
}

export async function deleteFromCloud(publicId) {
  return { result: "ok" };
}
