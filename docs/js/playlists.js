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
let isSelectionMode = false;
let globalSelectedSongs = new Set();
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

    const multiAddBtn = document.getElementById('btn-open-multi-add');
    if (multiAddBtn) {
        multiAddBtn.onclick = openMultiAddModal;
    }

    const selectionModeBtn = document.getElementById('btn-selection-mode');
    if (selectionModeBtn) {
        selectionModeBtn.onclick = toggleSelectionMode;
    }

    const cancelSelectionBtn = document.getElementById('btn-cancel-selection');
    if (cancelSelectionBtn) {
        cancelSelectionBtn.onclick = () => toggleSelectionMode(false);
    }

    const addSelectedBtn = document.getElementById('btn-add-selected-to-pl');
    if (addSelectedBtn) {
        addSelectedBtn.onclick = openBulkAddToPlaylist;
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
    if (isSelectionMode) toggleSelectionMode(false);
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

function toggleSelectionMode(forceValue) {
    if (isSortMode) toggleSortMode();
    isSelectionMode = typeof forceValue === 'boolean' ? forceValue : !isSelectionMode;

    const btn = document.getElementById('btn-selection-mode');
    const bar = document.getElementById('selection-bar');

    if (isSelectionMode) {
        btn.classList.add('active-sort'); // Reuse style
        bar.style.display = 'flex';
        songListUI.classList.add('selection-enabled');
    } else {
        btn.classList.remove('active-sort');
        bar.style.display = 'none';
        songListUI.classList.remove('selection-enabled');
        globalSelectedSongs.clear();
        document.querySelectorAll('.song-card.selected').forEach(c => c.classList.remove('selected'));
        updateSelectionCount();
    }
}

function updateSelectionCount() {
    const el = document.getElementById('selection-count');
    if (el) el.textContent = `${globalSelectedSongs.size} seleccionadas`;
}

function handleSongClick(song, index, card) {
    if (isSelectionMode) {
        if (globalSelectedSongs.has(song.id)) {
            globalSelectedSongs.delete(song.id);
            card.classList.remove('selected');
        } else {
            globalSelectedSongs.add(song.id);
            card.classList.add('selected');
        }
        updateSelectionCount();
    } else {
        if (typeof loadSong === 'function') {
            loadSong(index);
            if (typeof playSong === 'function') playSong();
        }
    }
}

async function openBulkAddToPlaylist() {
    if (globalSelectedSongs.size === 0) return await window.customAlert('Selecciona al menos una canción');

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
        await window.customAlert('Crea una playlist primero');
        return;
    }

    modal.style.display = 'flex';
    cancelBtn.onclick = () => modal.style.display = 'none';

    confirmBtn.onclick = async () => {
        const plId = select.value;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Añadiendo...';

        const { data: currentSongs } = await window.supabaseClient
            .from('playlist_songs')
            .select('song_id')
            .eq('playlist_id', plId);

        const existingIds = new Set(currentSongs ? currentSongs.map(s => s.song_id) : []);
        const toAdd = Array.from(globalSelectedSongs).filter(id => !existingIds.has(id));

        if (toAdd.length === 0) {
            await window.customAlert('Las canciones seleccionadas ya están en esta playlist');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Añadir';
            return;
        }

        const { data: countData } = await window.supabaseClient
            .from('playlist_songs')
            .select('id', { count: 'exact' })
            .eq('playlist_id', plId);

        let startPos = countData ? countData.length : 0;

        const inserts = toAdd.map((songId, i) => ({
            playlist_id: plId,
            song_id: songId,
            position: startPos + i
        }));

        const { error } = await window.supabaseClient
            .from('playlist_songs')
            .insert(inserts);

        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Añadir';
        modal.style.display = 'none';

        if (error) {
            await window.customAlert('Error: ' + error.message);
        } else {
            if (typeof showToast === 'function') showToast(`Añadidas ${toAdd.length} canciones`, 'success');
            toggleSelectionMode(false);
            if (activePlaylistId == plId) {
                loadPlaylistSongs(plId, document.getElementById('current-view-title').textContent);
            }
        }
    };
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
    const confirmed = await window.customConfirm('¿Estás seguro de que deseas eliminar esta playlist?');
    if (!confirmed) return;

    const { error } = await window.supabaseClient
        .from('playlists')
        .delete()
        .eq('id', id);

    if (error) {
        await window.customAlert('Error al eliminar playlist: ' + error.message);
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
        await window.customAlert('Error al crear playlist');
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

    const multiAddBtn = document.getElementById('btn-open-multi-add');
    if (multiAddBtn) multiAddBtn.style.display = 'inline-flex';

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

    const multiAddBtn = document.getElementById('btn-open-multi-add');
    if (multiAddBtn) multiAddBtn.style.display = 'none';

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
        await window.customAlert('Crea una playlist primero');
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
            if (error.code === '23505') await window.customAlert('La canción ya está en la playlist');
            else await window.customAlert('Error: ' + error.message);
        }
    };
}

async function removeSongFromPlaylist(songId) {
    if (!activePlaylistId) return;
    const confirmed = await window.customConfirm('¿Quitar canción de esta playlist?');
    if (!confirmed) return;

    const { error } = await window.supabaseClient
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', activePlaylistId)
        .eq('song_id', songId);

    if (error) {
        if (typeof showToast === 'function') showToast('Error al quitar canción', 'error');
        else await window.customAlert('Error al quitar canción');
    } else {
        if (typeof showToast === 'function') showToast('Canción quitada', 'success');
        // Recargar la vista actual de la playlist
        const plName = document.getElementById('current-view-title').textContent;
        loadPlaylistSongs(activePlaylistId, plName);
    }
}

// Multi-Add Logic
let multiSelectedSongs = new Set();
let allUserSongs = [];

async function openMultiAddModal() {
    if (!activePlaylistId) return;

    const modal = document.getElementById('multi-add-modal');
    const list = document.getElementById('multi-add-list');
    const title = document.getElementById('multi-add-title');
    const plName = document.getElementById('current-view-title').textContent;

    title.textContent = `Añadir a "${plName}"`;
    modal.style.display = 'flex';
    list.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Cargando...</p>';

    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Fetch all user songs
    const { data: songs, error: songsError } = await window.supabaseClient
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('title', { ascending: true });

    // Fetch songs already in the playlist
    const { data: existing, error: existingError } = await window.supabaseClient
        .from('playlist_songs')
        .select('song_id')
        .eq('playlist_id', activePlaylistId);

    if (songsError) return;
    allUserSongs = songs;
    const existingIds = new Set(existing ? existing.map(e => e.song_id) : []);

    list.innerHTML = '';
    multiSelectedSongs.clear();

    songs.forEach(song => {
        const isInPlaylist = existingIds.has(song.id);
        const card = document.createElement('div');
        card.className = 'song-card' + (isInPlaylist ? ' in-playlist' : '');
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';
        card.style.padding = '1.25rem';

        card.innerHTML = `
            <div class="card-meta" style="flex: 1;">
                <h5 style="font-size: 1rem; margin-bottom: 0.25rem;">${song.title}</h5>
                <p style="font-size: 0.8rem; margin-bottom: 0.5rem;">${song.artist}</p>
                ${isInPlaylist ? '<span style="font-size: 0.7rem; color: var(--hub-accent); font-weight: 700; display: block;">Ya está en la playlist</span>' : ''}
            </div>
            <div style="margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--hub-surface-light); padding-top: 0.75rem;">
                <span style="font-size: 0.8rem; color: var(--hub-text-muted);">${isInPlaylist ? 'En lista' : 'Añadir'}</span>
                <input type="checkbox" class="multi-song-checkbox" data-id="${song.id}"
                    ${isInPlaylist ? 'disabled' : ''}
                    style="width: 22px; height: 22px; accent-color: var(--hub-accent); cursor: pointer;">
            </div>
        `;

        if (!isInPlaylist) {
            card.onclick = (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const cb = card.querySelector('.multi-song-checkbox');
                    cb.checked = !cb.checked;
                    if (cb.checked) multiSelectedSongs.add(song.id); else multiSelectedSongs.delete(song.id);
                }
            };
            card.querySelector('.multi-song-checkbox').onchange = (e) => {
                if (e.target.checked) multiSelectedSongs.add(song.id); else multiSelectedSongs.delete(song.id);
            };
        }
        list.appendChild(card);
    });

    document.getElementById('btn-multi-cancel').onclick = () => modal.style.display = 'none';
    document.getElementById('btn-multi-select-all').onclick = () => {
        const checkboxes = document.querySelectorAll('.multi-song-checkbox:not(:disabled)');
        checkboxes.forEach(cb => {
            cb.checked = true;
            multiSelectedSongs.add(parseInt(cb.getAttribute('data-id')));
        });
    };
    document.getElementById('btn-multi-deselect-all').onclick = () => {
        const checkboxes = document.querySelectorAll('.multi-song-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        multiSelectedSongs.clear();
    };
    document.getElementById('btn-multi-confirm').onclick = saveMultiSongs;
}

async function saveMultiSongs() {
    if (multiSelectedSongs.size === 0) {
        document.getElementById('multi-add-modal').style.display = 'none';
        return;
    }

    const btn = document.getElementById('btn-multi-confirm');
    btn.disabled = true;
    btn.textContent = 'Añadiendo...';

    const { data: currentSongs } = await window.supabaseClient
        .from('playlist_songs')
        .select('id')
        .eq('playlist_id', activePlaylistId);

    let startPos = currentSongs ? currentSongs.length : 0;
    const toInsert = Array.from(multiSelectedSongs).map((songId, index) => ({
        playlist_id: activePlaylistId,
        song_id: songId,
        position: startPos + index
    }));

    const { error } = await window.supabaseClient
        .from('playlist_songs')
        .insert(toInsert);

    btn.disabled = false;
    btn.textContent = 'Añadir Seleccionadas';

    if (error) {
        await window.customAlert('Error al añadir canciones: ' + error.message);
    } else {
        document.getElementById('multi-add-modal').style.display = 'none';
        loadPlaylistSongs(activePlaylistId, document.getElementById('current-view-title').textContent);
    }
}
