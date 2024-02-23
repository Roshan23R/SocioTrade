const savePhoto = (post, photoEncode, photoType) => {
	if (photoEncode != null) {
		post.Photo = new Buffer.from(photoEncode, "base64");
		post.PhotoType = photoType;
	}
};

module.exports = { savePhoto };
