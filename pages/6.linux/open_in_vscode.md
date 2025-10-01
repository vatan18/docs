# Open in VS CODE for Nautilus 46.2

#### 1. install python3-nautilus:
```bash
sudo apt install python3-nautilus
```

#### 2. Create extension:
```bash
mkdir -p ~/.local/share/nautilus-python/extensions/
nano ~/.local/share/nautilus-python/extensions/vscode_extension.py
```

#### 3. Paste below python code
Use this updated code that's compatible with Nautilus 46:
```python
from gi import require_version
require_version('Nautilus', '4.0')
from gi.repository import Nautilus, GObject, Gio
import os
from urllib.parse import unquote

class VSCodeExtension(GObject.GObject, Nautilus.MenuProvider):
    def get_background_items(self, *args):
        # For Nautilus 46+, we need to handle the new argument pattern
        if len(args) == 2:
            window, file = args
        else:
            file = args[0]

        # Get the current folder path
        folder_path = unquote(file.get_uri()[7:])  # Remove 'file://'
        
        # Create the menu item
        menu_item = Nautilus.MenuItem(
            name='VSCodeExtension::OpenInVSCode',
            label='Open in VS Code',
            tip='Open the current directory in VS Code'
        )
        
        menu_item.connect('activate', self.on_click_open_vscode, folder_path)
        
        return [menu_item]

    def on_click_open_vscode(self, menu, folder_path):
        os.system(f'/snap/bin/code "{folder_path}"')
```

#### 4. Make it executable:
```bash
chmod +x ~/.local/share/nautilus-python/extensions/vscode_extension.py
```

#### 5. Restart Nautilus:
```bash
nautilus -q
killall nautilus
```

#### 6. Restart
If needed, you might have to log out and log back in, or run:
```bash
gtk-update-icon-cache
```

#### 7. Debug
If you still don't see it, please run Nautilus from terminal and share any error messages:
```bash
nautilus --no-desktop
```


Now Then try opening Nautilus again and right-click on empty space. You should now see the "Open in VS Code" option.

Also, check if the Python extension is being loaded:
```bash
ls -l ~/.local/share/nautilus-python/extensions/
```