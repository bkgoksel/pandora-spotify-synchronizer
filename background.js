// listen for a song being liked on the page.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case "song-liked":
            getSpotifySongURI(request.data);
        break;
    }
    return true;
});

//Search for the song on Spotify and find its Spotify URI if the song exists.
function getSpotifySongURI(songData) {
    alert(songData.songName);
    var searchURL = "https://api.spotify.com/v1/search" + "?q=track:" + encodeURIComponent(songData.songName) + "+album:" + encodeURIComponent(songData.albumName) + "+artist:" + encodeURIComponent(songData.artistName) + "&type=track"; 
    $.ajax({
        url: searchURL,
        success: function(songSearchResultJSON) {
            var songURI = songSearchResultJSON.tracks.items[0].uri;
            authenticate(songURI);
        },
        error: function(data) {
            alert("Song not found on Spotify");
        }
    })
}

//Authenticate the Spotify user and on redirect, call the function to extract the user information
function authenticate(songURI) {
    chrome.identity.launchWebAuthFlow(
        {
            'url': 'https://accounts.spotify.com/authorize?client_id=6a7d3885ccb34286a48690fd600ee2af&response_type=code&redirect_uri=https://dpinhkoooicmkogpadlafpoljkihgmmg.chromiumapp.org/callback&scope=playlist-modify-public%20playlist-modify-private', 
            'interactive': true
        },
        function(redirect_url) { 
            var code = redirect_url.match(/code=([^&]+)/)[1];
            $.ajax({
                method: "POST",
                url: "https://accounts.spotify.com/api/token",
                data: { 
                    grant_type: "authorization_code", 
                    code: code, 
                    redirect_uri: "https://dpinhkoooicmkogpadlafpoljkihgmmg.chromiumapp.org/callback",
                    client_id: "6a7d3885ccb34286a48690fd600ee2af",
                    client_secret: "56e23715dab04e0a96c852e879a605df" },
                success: function(authData) {
                    extractUserTokens(authData, songURI);
                },
                error: function(response) {
                    alert("Authentication failed!");
                }
            })
    });
}

//Extract the access token and user JSON object given the auth response
function extractUserTokens(authJSON, songURI) {
    alert(authJSON.access_token);
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + authJSON.access_token
        },
        success: function(user) {
            getPlaylist(authJSON.access_token, user, songURI);
        },
        error: function(response) {
            alert("User not found!");
        }
    })
}

//Get a list of the user's playlists with the given access token and user JSON object
function getPlaylist(accessToken, userObj, songURI) {
    var userId = userObj.id;
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(playlists) {
            addTrack(accessToken, playlists, userId, songURI);
        },
        error: function(response) {
            alert("Can't access playlists!");
        }
    })
}

// Find the "Starred" playlist from the list of playlists and add the song with the given URI to the playlist
function addTrack(accessToken, playlistsObj, userId, songURI) {
    var playlistId = playlistsObj.items[1].id;    
    for (var playlist in playlistsObj.items) {
        if (playlist.name === 'Starred') {
            playlistId = playlist.id;
            alert(playlist.name);
        }
    }
    $.ajax({
        method: "POST",
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?uris=' + encodeURIComponent(songURI),
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            alert('Song added to playlist successfully!');
        },
        error: function(response) {
            alert("Song couldn't be added successfully!");
        }
    })
}