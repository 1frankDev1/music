-- Tablas para la aplicación de música

-- Tabla de usuarios (Manejo manual de auth)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'User',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de canciones
CREATE TABLE IF NOT EXISTS songs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration TEXT,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de playlists
CREATE TABLE IF NOT EXISTS playlists (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia para canciones en playlists (con orden)
CREATE TABLE IF NOT EXISTS playlist_songs (
    id BIGSERIAL PRIMARY KEY,
    playlist_id BIGINT REFERENCES playlists(id) ON DELETE CASCADE,
    song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, song_id)
);

-- Insertar usuario administrador inicial (como se solicitó)
-- NOTA: En un entorno real, la contraseña debería estar hasheada.
-- Para este ejercicio la guardamos en texto plano o como el usuario decida manejarlo en el JS.
INSERT INTO users (username, password, role)
VALUES ('Antonio', 'Asd123', 'Admin')
ON CONFLICT (username) DO NOTHING;
