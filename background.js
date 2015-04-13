var extensionId = "jefocpemkfdpaofkldjigkepjfpgombg";
var spotifyAPIClientId = "6a7d3885ccb34286a48690fd600ee2af";
var spotifyAPIClientSecret = "56e23715dab04e0a96c852e879a605df";
var playlistName = 'Liked from Pandora';

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
    $.ajax({
        url: "https://api.spotify.com/v1/search?query=track:" + encodeURIComponent(songData.songName) + "+album:" + encodeURIComponent(songData.albumName) + "+artist:" + encodeURIComponent(songData.artistName) + "&type=track",
        success: function(songSearchResultJSON) {
            if (songSearchResultJSON.tracks.items.length < 1) {
                alert("Song not found on Spotify!");
            } else {
                var songURI = songSearchResultJSON.tracks.items[0].uri;
                authenticate(songURI);
            }
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
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + authJSON.access_token
        },
        success: function(user) {
            getPlaylists(authJSON.access_token, user, songURI, '0');
        },
        error: function(response) {
            alert("User not found!");
        }
    })
}

//Get a list of the user's playlists with the given access token and user JSON object
function getPlaylists(accessToken, userObj, songURI, offset) {
    var userId = userObj.id;
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        data: {
            'limit': '50',
            'offset': offset
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
    var playlistId = -1;    
    playlistsObj.items.forEach( function(playlist) {
        if (playlist.name === playlistName) {
            playlistId = playlist.id;
            alert(playlist.name);
        }
    });
    if (playlistId === -1) {
        $.ajax({
            url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: {
                'limit': '50',
                'offset': (playlistsObj.limit + playlistsObj.offset).toString()
            },
            success: function(playlists) {
                addTrack(accessToken, playlists, userId, songURI);
            },
            error: function(response) {
                alert("Can't access playlists!");
            }
        })
    } else {
        $.ajax({
            method: "POST",
            url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?uris=' + encodeURIComponent(songURI),
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
            success: function(response) {
                alert('Song added to playlist successfully!');
            },
            error: function(response) {
                alert("Song couldn't be added successfully!");
            }
        })
    }
}