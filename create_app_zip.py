import os
import zipfile

dist_dir = r"c:\Google Antigravity\Curso de ingles\dist"
zip_path = r"c:\Google Antigravity\Curso de ingles\magic-english-app.zip"

if os.path.exists(zip_path):
    os.remove(zip_path)

print(f"Creating ZIP from: {dist_dir}")
print(f"Target archive: {zip_path}\n")

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
    for root, dirs, files in os.walk(dist_dir):
        # Sort for deterministic structure
        dirs.sort()
        files.sort()
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dist_dir)
            # Force forward slash '/' as path separator in zip archive
            arcname = rel_path.replace('\\', '/')
            zip_file.write(full_path, arcname=arcname)
            print(f"  + {arcname}")

print(f"\nZIP file created successfully!")
print(f"Size: {os.path.getsize(zip_path)} bytes")
