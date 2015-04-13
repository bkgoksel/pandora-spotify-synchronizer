var likeButton = $("div.thumbUpButton");
var songNameLink = $("a.songTitle:first");
var artistNameLink = $("a.artistSummary");
var albumNameLink = $("a.albumTitle");

likeButton.click(function(){
	chrome.extension.sendMessage({
		type: "song-liked",
		data: {
			songName: songNameLink.text(),
			artistName: artistNameLink.text(),
			albumName: albumNameLink.text()
		}
	});
})