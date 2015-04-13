# Pandora Spotify synchronizer
A Chrome extension that adds songs liked on Pandora to the user's starred playlist on Spotify
# Current development plan:
1. Make sure the extension only asks the user to sign in to Spotify if they haven't before (this behavior already exists but the authorization API call to Spotify is made every single time a song is liked, stop that)
2. Refactor code to store the access token, user id and playlist id in chrome sync storage
3. Add backoff song searching: If Track-Album-Artist isn't found, search for Track-Artist, and Track-Album after that
4. Review code for full application security(what to do with the client secret)
5. Add a settings page for the extension where the user can specify the name of the playlist the songs will be added to. If a playlist with that name doesn't exist, create it.
6. Add the option to save tracks from different stations into different playlists
7. Add the option to temporarily disable the syncing, or disable syncing for a particular station.
8. Add functionality to work with other music services (Youtube to begin with)
