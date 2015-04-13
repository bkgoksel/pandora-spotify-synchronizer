# Pandora Spotify synchronizer
A Chrome extension that adds songs liked on Pandora to the user's starred playlist on Spotify
# Current development plan:
1. Add backoff song searching: If Track-Album-Artist isn't found, search for Track-Artist, and Track-Album after that
2. Review code for full application security(what to do with the client secret)
3. Add a settings page for the extension where the user can specify the name of the playlist the songs will be added to. If a playlist with that name doesn't exist, create it.
4. Add the option to save tracks from different stations into different playlists
5. Add the option to temporarily disable the syncing, or disable syncing for a particular station.
6. Add functionality to work with other music services (Youtube to begin with)