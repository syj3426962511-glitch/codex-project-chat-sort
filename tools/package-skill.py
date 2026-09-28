"""Build a portable skill ZIP without local configuration or host binaries."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from shutil import copyfile

root = Path(__file__).resolve().parents[1]
skill = root / 'skills' / 'codex-project-chat-sort'
output = root / '.artifacts' / 'codex-project-chat-sort.skill'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED) as archive:
    for file in sorted(skill.rglob('*')):
        if file.is_file():
            info = ZipInfo.from_file(file, file.relative_to(skill.parent).as_posix())
            info.create_system = 3
            info.external_attr = (0o100755 if file.suffix == '.command' else 0o100644) << 16
            info.compress_type = ZIP_DEFLATED
            data = file.read_bytes()
            if file.suffix == '.command':
                data = data.replace(b'\r\n', b'\n')
            archive.writestr(info, data)
print(output)
zip_output = output.with_suffix('.zip')
copyfile(output, zip_output)
print(zip_output)
