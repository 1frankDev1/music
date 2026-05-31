# Guía de Configuración: Sonic Hub

Para que la aplicación funcione correctamente, debes configurar los permisos en Supabase y el preset en Cloudinary.

## 1. Configuración de Supabase (RLS Policies)

La aplicación usa una tabla personalizada llamada `users` y otra `songs`. Por defecto, Supabase bloquea las inserciones. Ejecuta los siguientes comandos en el **SQL Editor** de tu panel de Supabase:

### Para la tabla `users`:
```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquiera insertar (Registro)
CREATE POLICY "Permitir inserciones anónimas" ON users FOR INSERT WITH CHECK (true);

-- Permitir a cualquiera leer (Login)
CREATE POLICY "Permitir lectura anónima" ON users FOR SELECT USING (true);

-- Permitir eliminar (Admin)
CREATE POLICY "Permitir eliminación" ON users FOR DELETE USING (true);
```

### Para la tabla `songs`:
```sql
-- Habilitar RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquiera insertar (Subida de música)
CREATE POLICY "Permitir inserción de canciones" ON songs FOR INSERT WITH CHECK (true);

-- Permitir lectura
CREATE POLICY "Permitir lectura de canciones" ON songs FOR SELECT USING (true);

-- Permitir eliminación
CREATE POLICY "Permitir eliminación de canciones" ON songs FOR DELETE USING (true);
```

### Para la tabla `playlists` y `playlist_songs`:
```sql
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Playlists" ON playlists FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Playlist Songs" ON playlist_songs FOR ALL USING (true) WITH CHECK (true);
```

---

## 2. Configuración de Cloudinary (Upload Preset)

Para permitir subidas desde el navegador sin un servidor intermedio:

1. Ve a tu **Cloudinary Dashboard**.
2. Entra en **Settings** (icono de engranaje).
3. Ve a la pestaña **Upload**.
4. Desplázate hasta **Upload presets** y comprueba tu preset.
5. Configura lo siguiente:
   - **Upload preset name**: `vit0x7dr` (Este es el que está configurado actualmente en el código).
   - **Signing Mode**: `Unsigned` (esto es CRUCIAL).
   - **Folder**: Opcional (ej. `sonic_hub`).
6. Haz clic en **Save**.

---

## 3. ¿Por qué sale "new row violates row-level security policy"?

Este error significa que Supabase recibió la orden de guardar los datos, pero las reglas de seguridad (RLS) dicen que "nadie tiene permiso". Ejecutar el SQL de arriba solucionará este problema.
