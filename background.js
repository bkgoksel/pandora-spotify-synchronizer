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
        getSpotifySongURI(request.data, 3);
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
                console.log("Authentication failed!");
            }
        })
    });
}

//Extract the access token and user JSON object given the auth response
function extractUserTokens() {
    chrome.storage.sync.get('accessToken', function(object) {
        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + object.accessToken
            },
            success: function(user) {
                chrome.storage.sync.set({'userId': user.id}, function() {
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
            headers: {'Authorization': 'Bearer ' + object.accessToken},
            data: {
                'limit': '50',
                'offset': offset
            },
            success: function(playlists) {
                if(playlists.items.length === 0) {
                    createNewPlaylist(object);
                } else {
                    findPlaylist(playlists);
                }
            },
            error: function(response) {
                alert("Can't access playlists!");
            }
        });
    });
}

//Creates a new playlist called 'Liked from Pandora' for the user.
function createNewPlaylist(object) {
    var newPlaylistTemp = "{\"name\":\"Liked from Pandora\", \"public\":true}";
    $.ajax({
        method: 'POST',
        url: 'https://api.spotify.com/v1/users/' + object.userId + '/playlists',
        headers: {
            'Authorization': 'Bearer ' + object.accessToken
        },
        contentType: 'application/json',
        dataType: 'json',
        data: newPlaylistTemp,
        success: function(newPlaylist) {
            chrome.storage.sync.set({'playlistId': newPlaylist.id}, function() {
                alert("Extension couldn't find a playlist called 'Liked from Pandora' in your playlists, so a private playlist with that name was created for you!");
                console.log("Playlist Id saved.");
            })
        },
        error: function(response) {
            alert("Playlist couldn't be created!");
        }
    })
}

//Keeps searching for a playlist with the given name from the users playlists.
function findPlaylist(playlists) {
    var playlistId = -1;    
    playlists.items.some( function(playlist) {
        if (playlist.name === playlistName) {
            playlistId = playlist.id;
            console.log("Playlist found: " + playlist.name);
            return true;
        }
        return false;
    });
    if (playlistId === -1) {
        getPlaylists((playlists.offset + playlists.limit).toString());
    } else {
        chrome.storage.sync.set({'playlistId': playlistId}, function() {
            console.log("Playlist Id saved.");
        });
    }
}

//Search for the song on Spotify and find its Spotify URI if the song exists.
function getSpotifySongURI(songData, searchLevel) {
    if(searchLevel === 0) {
        alert("Song not found on Spotify!");
        return;
    }
    var searchURL = "https://api.spotify.com/v1/search?query=track:" + encodeURIComponent(songData.songName);
    if (searchLevel > 1) {
        searchURL += "+artist:" + encodeURIComponent(songData.artistName);
        if(searchLevel > 2) {
            searchURL += "+album:" + encodeURIComponent(songData.albumName);
        }
    }
    searchURL += "&type=track";
    $.ajax({
        url: searchURL,
        success: function(songSearchResultJSON) {
            if (songSearchResultJSON.tracks.items.length < 1) {
                getSpotifySongURI(songData, searchLevel - 1);
            } else {
                var songURI = songSearchResultJSON.tracks.items[0].uri;
                addTrack(songURI);
            }
        },
        error: function(data) {
            alert("Bad song request!");
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
                console.log('Song added to playlist successfully!');
            },
            error: function(response) {
                alert("Song couldn't be added successfully!");
            }
        });
    });
}