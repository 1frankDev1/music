const audio = document.getElementById('main-audio');
const playBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('total-duration');
const volumeBar = document.getElementById('volume-bar');

const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerCover = document.getElementById('player-cover');

let currentSongIndex = 0;
let songs = [];
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSongs();

    // Listeners
    playBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleSongEnd);
    progressBar.addEventListener('input', setProgress);
    volumeBar.addEventListener('input', setVolume);
});


function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];

    if (!song) return;

    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerCover.src = song.cover_url || 'https://via.placeholder.com/64';
    audio.src = song.audio_url;

    // Update active class in UI
    document.querySelectorAll('.song-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    if (!audio.src) return;
    isPlaying = true;
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

function pauseSong() {
    isPlaying = false;
    audio.pause();
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function nextSong() {
    if (songs.length === 0) return;
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * songs.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }
    loadSong(currentSongIndex);
    playSong();
}

function prevSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
    playSong();
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
}

function handleSongEnd() {
    if (isRepeat) {
        audio.currentTime = 0;
        playSong();
    } else {
        nextSong();
    }
}

function updateProgress() {
    const { duration, currentTime } = audio;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.value = progressPercent;

        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }
}

function setProgress() {
    const width = progressBar.value;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (width / 100) * duration;
    }
}

function setVolume() {
    audio.volume = volumeBar.value / 100;
}

function formatTime(time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function renderSongList(songsToRender) {
    const list = document.getElementById('song-list-ui');
    list.innerHTML = '';

    songs = songsToRender;

    songsToRender.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.setAttribute('data-id', song.id);
        li.innerHTML = `
            <img src="${song.cover_url || 'https://via.placeholder.com/48'}" alt="Cover">
            <div class="song-info">
                <strong>${song.title}</strong>
                <span class="song-artist">${song.artist}</span>
            </div>
            <div class="song-artist-desktop" style="color: var(--text-muted); font-size: 0.9rem;">${song.artist}</div>
            <div class="song-duration">${song.duration || '--:--'}</div>
            <div class="song-actions" style="display: flex; justify-content: flex-end;">
                <button class="btn-icon add-to-pl" data-id="${song.id}" title="Añadir a playlist"><i class="fas fa-plus"></i></button>
            </div>
        `;

        // Hide one of the artists on mobile via CSS but let's just make it work

        li.onclick = (e) => {
            const addBtn = e.target.closest('.add-to-pl');
            if (addBtn) {
                if (typeof addSongToPlaylist === 'function') {
                    addSongToPlaylist(song.id);
                }
                return;
            }
            loadSong(index);
            playSong();
        };
        list.appendChild(li);
    });
}

let allSongs = [];

async function loadSongs() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const { data, error } = await window.supabaseClient
        .from('songs')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error loading songs:', error);
        return;
    }

    allSongs = data;
    songs = data;
    renderSongList(songs);
    if (songs.length > 0 && !audio.src) {
        loadSong(0);
    }
}

document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSongs.filter(s =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term)
    );
    renderSongList(filtered);
});
