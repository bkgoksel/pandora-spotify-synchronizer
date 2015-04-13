// listen for a song being liked on the page.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case "song-liked":
            getSpotifySongURI(request.data);
        break;
    }
    return true;
});

function getSpotifySongURI(songData) {
    alert(songData.songName);
    var searchURL = "https://api.spotify.com/v1/search" + "?q=track:" + encodeURIComponent(songData.songName) + "+album:" + encodeURIComponent(songData.albumName) + "+artist:" + encodeURIComponent(songData.artistName) + "&type=track"; 
    $.ajax({
        url: searchURL,
        success: function(data) {
            extractIdfromJSON(data);
        }
    })
}

function extractIdfromJSON(songJSON) {
    var songId = songJSON.tracks.items[0].uri;
    authenticate(songId);
}

function authenticate(songId) {
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
                    extractUserTokens(authData, songId);
                }
            })
    });
}

function extractUserTokens(authJSON, songId) {
    alert(authJSON.access_token);
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + authJSON.access_token
        },
        success: function(user) {
            getPlaylist(authJSON.access_token, user, songId);
        }
    })
}

function getPlaylist(accessToken, userObj, songId) {
    var userId = userObj.id;
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(playlists) {
            addTrack(accessToken, playlists, userId, songId);
        }
    })
}

function addTrack(accessToken, playlistsObj, userId, songId) {
    var playlistId = playlistsObj.items[1].id;
    alert(playlistsObj.items[1].name);
    $.ajax({
        method: "POST",
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?uris=' + encodeURIComponent(songId),
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(response) {
            alert('success!');
        },
        error: function(response) {
            alert(response.items[0].message);
        }
    })
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}