# Download Debian Package from APT Repository

To download a Debian package from an APT repository, follow these steps:

## Check Package Name:
Before downloading any package, verify its exact name. For example, to download VLC media player, run the following command to list all packages with "vlc" in their name:

```bash
sudo apt update
apt list | grep vlc
```

This command will display a list of all registered packages containing "vlc".

## Install or Download Only:
- To install VLC, use:

  ```bash
  sudo apt install -y vlc
  ```

- To only download the package without installing it immediately, use:

  ```bash
  sudo apt install -y vlc --download-only
  ```

Running either of these commands will download the package to the directory:

```
/var/cache/apt/archives
```

## Reference:
[Download Packages Without Installing - Ask Ubuntu](https://askubuntu.com/questions/1206167/download-packages-without-installing)
