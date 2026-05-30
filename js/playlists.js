const playlistList = document.getElementById('playlist-list');
const addPlaylistBtn = document.getElementById('add-playlist');
const playlistModal = document.getElementById('playlist-modal');
const savePlaylistBtn = document.getElementById('save-playlist');
const cancelPlaylistBtn = document.getElementById('cancel-playlist');
const playlistNameInput = document.getElementById('playlist-name-input');
const songListUI = document.getElementById('song-list-ui');

let currentPlaylists = [];
let activePlaylistId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();

    addPlaylistBtn.onclick = () => playlistModal.style.display = 'flex';
    cancelPlaylistBtn.onclick = () => playlistModal.style.display = 'none';
    savePlaylistBtn.onclick = createPlaylist;

    // Initialize Sortable
    new Sortable(songListUI, {
        animation: 150,
        handle: '.song-item',
        onEnd: async function (evt) {
            if (activePlaylistId) {
                await updatePlaylistOrder();
            }
        }
    });
});

async function loadPlaylists() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const { data, error } = await window.supabaseClient
        .from('playlists')
        .select('*')
        .eq('user_id', user.id);

    if (error) return console.error(error);

    currentPlaylists = data;
    renderPlaylists();
}

function renderPlaylists() {
    playlistList.innerHTML = '<li onclick="showAllSongs()">Todas las Canciones</li>';
    currentPlaylists.forEach(pl => {
        const li = document.createElement('li');
        li.textContent = pl.name;
        li.onclick = () => loadPlaylistSongs(pl.id, pl.name);
        playlistList.appendChild(li);
    });
}

async function createPlaylist() {
    const name = playlistNameInput.value;
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!name) return;

    const { error } = await window.supabaseClient
        .from('playlists')
        .insert([{ name, user_id: user.id }]);

    if (error) {
        alert('Error al crear playlist');
    } else {
        playlistModal.style.display = 'none';
        playlistNameInput.value = '';
        loadPlaylists();
    }
}

async function loadPlaylistSongs(id, name) {
    activePlaylistId = id;
    document.getElementById('current-view-title').textContent = name;

    const { data, error } = await window.supabaseClient
        .from('playlist_songs')
        .select('song_id, songs(*)')
        .eq('playlist_id', id)
        .order('position', { ascending: true });

    if (error) return console.error(error);

    const playlistSongs = data.map(d => d.songs);
    renderSongList(playlistSongs); // Function from player.js
}

function showAllSongs() {
    activePlaylistId = null;
    document.getElementById('current-view-title').textContent = 'Todas las Canciones';
    loadSongs(); // Function from player.js
}

async function updatePlaylistOrder() {
    const items = songListUI.querySelectorAll('.song-item');
    const updates = Array.from(items).map((item, index) => {
        return {
            playlist_id: activePlaylistId,
            song_id: parseInt(item.getAttribute('data-id')),
            position: index
        };
    });

    // Bulk update approach would be better but let's at least use data-id
    for (const update of updates) {
        await window.supabaseClient
            .from('playlist_songs')
            .upsert(update, { onConflict: 'playlist_id,song_id' });
    }
}

// Global function to add song to playlist (called from player.js render)
async function addSongToPlaylist(songId) {
    const plId = prompt('ID de la playlist a la que quieres añadir (puedes ver el ID en la consola o implementar un selector mejor):');
    if (!plId) return;

    const { data: count } = await window.supabaseClient
        .from('playlist_songs')
        .select('id', { count: 'exact' })
        .eq('playlist_id', plId);

    const { error } = await window.supabaseClient
        .from('playlist_songs')
        .insert([{
            playlist_id: plId,
            song_id: songId,
            position: count ? count.length : 0
        }]);

    if (error) alert('Error: ' + error.message);
    else alert('Añadido con éxito');
}
