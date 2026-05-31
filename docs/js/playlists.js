const playlistList = document.getElementById('playlist-list');
const addPlaylistBtn = document.getElementById('add-playlist');
const playlistModal = document.getElementById('playlist-modal');
const savePlaylistBtn = document.getElementById('save-playlist');
const cancelPlaylistBtn = document.getElementById('cancel-playlist');
const playlistNameInput = document.getElementById('playlist-name-input');
const songListUI = document.getElementById('song-list-ui');

let currentPlaylists = [];
let activePlaylistId = null;
let isSortMode = false;
let sortableInstance;

document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();

    addPlaylistBtn.onclick = () => playlistModal.style.display = 'flex';
    cancelPlaylistBtn.onclick = () => playlistModal.style.display = 'none';
    savePlaylistBtn.onclick = createPlaylist;

    // Initialize Sortable for the grid
    sortableInstance = new Sortable(songListUI, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        disabled: true,
        onEnd: async function (evt) {
            if (activePlaylistId) {
                await updatePlaylistOrder();
            }
        }
    });

    const toggleSortBtn = document.getElementById('toggle-sort-btn');
    if (toggleSortBtn) {
        toggleSortBtn.onclick = toggleSortMode;
    }

    // Mobile Drawer Logic
    const drawer = document.getElementById('mobile-drawer');
    const toggleBtn = document.getElementById('mobile-playlist-toggle');
    const closeBtn = document.getElementById('close-drawer');

    if (toggleBtn && drawer) {
        toggleBtn.onclick = () => {
            drawer.classList.toggle('open');
            toggleBtn.classList.toggle('open');
        };
    }
    if (closeBtn && drawer) {
        closeBtn.onclick = () => {
            drawer.classList.remove('open');
            toggleBtn.classList.remove('open');
        };
    }
});

function toggleSortMode() {
    isSortMode = !isSortMode;
    const btn = document.getElementById('toggle-sort-btn');

    if (isSortMode) {
        sortableInstance.option('disabled', false);
        btn.classList.add('active-sort');
        btn.title = 'Desactivar Ordenar';
        btn.innerHTML = '<i class="fas fa-check"></i>';
        songListUI.classList.add('sort-enabled');
    } else {
        sortableInstance.option('disabled', true);
        btn.classList.remove('active-sort');
        btn.title = 'Activar Ordenar';
        btn.innerHTML = '<i class="fas fa-sort"></i>';
        songListUI.classList.remove('sort-enabled');
    }
}

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
    playlistList.innerHTML = '<li id="all-songs-tab" class="active">Biblioteca Global</li>';
    document.getElementById('all-songs-tab').onclick = showAllSongs;

    currentPlaylists.forEach(pl => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.setAttribute('data-pl-id', pl.id);
        li.innerHTML = `
            <span>${pl.name}</span>
            <button class="delete-pl-btn" title="Eliminar Playlist"><i class="fas fa-times"></i></button>
        `;
        li.onclick = (e) => {
            if (e.target.closest('.delete-pl-btn')) {
                deletePlaylist(pl.id);
                return;
            }
            loadPlaylistSongs(pl.id, pl.name);
        };
        playlistList.appendChild(li);
    });
}

async function deletePlaylist(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta playlist?')) return;

    const { error } = await window.supabaseClient
        .from('playlists')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar playlist: ' + error.message);
    } else {
        if (activePlaylistId === id) {
            showAllSongs();
        }
        loadPlaylists();
    }
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
    if (isSortMode) toggleSortMode();
    activePlaylistId = id;
    document.getElementById('current-view-title').textContent = name;

    document.querySelectorAll('#playlist-list li').forEach(li => li.classList.remove('active'));
    document.querySelector(`li[data-pl-id="${id}"]`)?.classList.add('active');

    const { data, error } = await window.supabaseClient
        .from('playlist_songs')
        .select('song_id, songs(*)')
        .eq('playlist_id', id)
        .order('position', { ascending: true });

    if (error) return console.error(error);

    const playlistSongs = data.map(d => d.songs);
    renderSongList(playlistSongs);
}

function showAllSongs() {
    if (isSortMode) toggleSortMode();
    activePlaylistId = null;
    document.getElementById('current-view-title').textContent = 'Explorar Todo';

    document.querySelectorAll('#playlist-list li').forEach(li => li.classList.remove('active'));
    document.getElementById('all-songs-tab').classList.add('active');

    loadSongs();
}

async function updatePlaylistOrder() {
    const items = songListUI.querySelectorAll('.song-card');
    const updates = Array.from(items).map((item, index) => {
        return {
            playlist_id: activePlaylistId,
            song_id: parseInt(item.getAttribute('data-id')),
            position: index
        };
    });

    for (const update of updates) {
        await window.supabaseClient
            .from('playlist_songs')
            .upsert(update, { onConflict: 'playlist_id,song_id' });
    }
}

async function addSongToPlaylist(songId) {
    const modal = document.getElementById('add-to-playlist-modal');
    const select = document.getElementById('playlist-select');
    const cancelBtn = document.getElementById('cancel-add-song');
    const confirmBtn = document.getElementById('confirm-add-song');

    select.innerHTML = '';
    currentPlaylists.forEach(pl => {
        const opt = document.createElement('option');
        opt.value = pl.id;
        opt.textContent = pl.name;
        select.appendChild(opt);
    });

    if (currentPlaylists.length === 0) {
        alert('Crea una playlist primero');
        return;
    }

    modal.style.display = 'flex';
    cancelBtn.onclick = () => modal.style.display = 'none';

    confirmBtn.onclick = async () => {
        const plId = select.value;
        const { data: currentSongs } = await window.supabaseClient
            .from('playlist_songs')
            .select('id')
            .eq('playlist_id', plId);

        const { error } = await window.supabaseClient
            .from('playlist_songs')
            .insert([{
                playlist_id: plId,
                song_id: songId,
                position: currentSongs ? currentSongs.length : 0
            }]);

        modal.style.display = 'none';
        if (error) {
            if (error.code === '23505') alert('La canción ya está en la playlist');
            else alert('Error: ' + error.message);
        }
    };
}

async function removeSongFromPlaylist(songId) {
    if (!activePlaylistId) return;
    if (!confirm('¿Quitar canción de esta playlist?')) return;

    const { error } = await window.supabaseClient
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', activePlaylistId)
        .eq('song_id', songId);

    if (error) {
        showToast('Error al quitar canción', 'error');
    } else {
        showToast('Canción quitada', 'success');
        // Recargar la vista actual de la playlist
        const plName = document.getElementById('current-view-title').textContent;
        loadPlaylistSongs(activePlaylistId, plName);
    }
}
