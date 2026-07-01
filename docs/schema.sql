-- Tablas para la aplicación de música (Viking Music)

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
    is_global BOOLEAN DEFAULT TRUE,
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

-- Sentencia para agregar la columna is_global a tablas existentes sin borrar datos
-- Si ya existe, fallará silenciosamente o no hará nada en la mayoría de gestores,
-- pero es la forma segura de actualizar sin DROP.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='is_global') THEN
        ALTER TABLE songs ADD COLUMN is_global BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
