var extensionId = "jefocpemkfdpaofkldjigkepjfpgombg";
var spotifyAPIClientId = "6a7d3885ccb34286a48690fd600ee2af";
var spotifyAPIClientSecret = "56e23715dab04e0a96c852e879a605df";
var playlistName = 'Liked from Pandora';

// Initial run: authenticate user, get playlist and user ids

chrome.runtime.onInstalled.addListener(function(details){
    authenticate();
});

// listen for a song being liked on the page.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case "song-liked":
        getSpotifySongURI(request.data);
        break;
    }
    return true;
});

//Authenticate the Spotify user and on redirect, call the function to extract the user information
function authenticate() {
    chrome.identity.launchWebAuthFlow(
    {
        'url': 'https://accounts.spotify.com/authorize?client_id=' + spotifyAPIClientId + '&response_type=code&redirect_uri=https://' + extensionId + '.chromiumapp.org/callback&scope=playlist-modify-public%20playlist-modify-private', 
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
                redirect_uri: "https://" + extensionId + ".chromiumapp.org/callback",
                client_id: spotifyAPIClientId,
                client_secret:  spotifyAPIClientSecret 
            },
            success: function(authData) {
                chrome.storage.sync.set({'accessToken': authData.access_token}, function() {
                    console.log("accesToken saved.");
                    extractUserTokens();
                });
            },
            error: function(response) {
                alert("Authentication failed!");
            }
        })
    });
}

//Extract the access token and user JSON object given the auth response
function extractUserTokens() {
    chrome.storage.sync.get('accessToken', function(object) {
        console.log("Access token read");
        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + object.accessToken
            },
            success: function(user) {
                chrome.storage.sync.set({'userId':user.id}, function() {
                    console.log("User Id saved.");
                    getPlaylists('0');
                });            
            },
            error: function(response) {
                alert("User not found!");
            }
        });
    });
}

//Get a list of the user's playlists with the given access token and user JSON object
function getPlaylists(offset) {
    chrome.storage.sync.get(['userId', 'accessToken'], function(object) {
        $.ajax({
            url: 'https://api.spotify.com/v1/users/' + object.userId + '/playlists',
            headers: {
                'Authorization': 'Bearer ' + object.accessToken
            },
            data: {
                'limit': '50',
                'offset': offset
            },
            success: function(playlists) {
                var playlistId = -1;    
                playlists.items.forEach( function(playlist) {
                    if (playlist.name === playlistName) {
                        playlistId = playlist.id;
                        console.log("Playlist found: " + playlist.name);
                    }
                });
                if (playlistId === -1) {
                    getPlaylists((playlists.offset + playlists.limit).toString());
                } else {
                    chrome.storage.sync.set({'playlistId': playlistId}, function() {
                        console.log("Playlist Id saved.");
                    });
                }
            },
            error: function(response) {
                alert("Can't access playlists!");
            }
        });
});
}

//Search for the song on Spotify and find its Spotify URI if the song exists.
function getSpotifySongURI(songData) {
    $.ajax({
        url: "https://api.spotify.com/v1/search?query=track:" + encodeURIComponent(songData.songName) + "+album:" + encodeURIComponent(songData.albumName) + "+artist:" + encodeURIComponent(songData.artistName) + "&type=track",
        success: function(songSearchResultJSON) {
            if (songSearchResultJSON.tracks.items.length < 1) {
                alert("Song not found on Spotify!");
            } else {
                var songURI = songSearchResultJSON.tracks.items[0].uri;
                addTrack(songURI);
            }
        },
        error: function(data) {
            alert("Song not found on Spotify");
        }
    })
}

function addTrack(songURI) {
    chrome.storage.sync.get(['userId', 'playlistId', 'accessToken'], function(object) {
        $.ajax({
            method: "POST",
            url: 'https://api.spotify.com/v1/users/' + object.userId + '/playlists/' + object.playlistId + '/tracks?uris=' + encodeURIComponent(songURI),
            headers: {
                'Authorization': 'Bearer ' + object.accessToken,
            },
            success: function(response) {
                alert('Song added to playlist successfully!');
            },
            error: function(response) {
                alert("Song couldn't be added successfully!");
            }
        });
    });
}