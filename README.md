# Pandora Spotify synchronizer
A Chrome extension that adds songs liked on Pandora to the user's starred playlist on Spotify
# Current development plan:
1. Make sure it finds the starred playlist from the list of playlists instead of the first one
2. Make sure the extension only asks the user to sign in to Spotify if they haven't before (this behavior already exists but the authorization API call to Spotify is made every single time a song is liked, stop that)
3. Refactor code to store the access token and user id in chrome sync storage
4. Add backoff song searching: If Track-Album-Artist isn't found, search for Track-Artist, and Track-Album after that
5. Review code for full application security(what to do with the client secret)
6. Add a settings page for the extension where the user can specify the name of the playlist the songs will be added to. If a playlist with that name doesn't exist, create it.
7. Add the option to save tracks from different stations into different playlists
8. Add the option to temporarily disable the syncing, or disable syncing for a particular station.
9. Add functionality to work with other music services (Youtube to begin with)
