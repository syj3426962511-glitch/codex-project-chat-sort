"""Build a portable skill ZIP without local configuration or host binaries."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from shutil import copyfile

root = Path(__file__).resolve().parents[1]
skill = root / 'skills' / 'codex-project-chat-sort'
output = root / '.artifacts' / 'codex-project-chat-sort.skill'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED) as archive:
    for file in sorted(skill.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(skill.parent))
print(output)
zip_output = output.with_suffix('.zip')
copyfile(output, zip_output)
print(zip_output)
