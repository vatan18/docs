# Transitioning Docker from Rootful to Rootless (Offline Setup)

Here’s a diagram illustrating the process of setting up Docker in rootless mode on a machine without internet access:

> **Note:**  
> - Sudo access is required on both the remote and local machines.  
> - Internet access is required on the local machine.

---

## On Machine with Internet Access (Local Machine)

1. ### Download Required Packages
   Download the necessary packages on your source machine using the command:

   ```bash
   sudo dnf install --downloadonly --downloaddir=pkg_folder <pkg_name>
   ```

   **Required Packages:**  
   - `docker-ce-rootless-extras.rpm`
   - `uidmap.rpm`
   - `libslirp0.rpm`
   - `slirp4netns.rpm`

   > **Note:** For downloading `.rpm` packages without installing them, refer to this link.

2. ### Ship Packages to Remote Machine
   Use `scp` to transfer the `.rpm` packages from the local machine to the remote machine:

   ```bash
   scp ./packages/* <remote_user>@<remote_ip>:~/packages/
   ```

3. ### Install Dependencies on Target Machine
   Install all the dependency packages using:

   ```bash
   rpm -ivh ./package.rpm
   ```

   > **Note:** For installing the packages, refer to the link provided.

4. ### Enable Rootless Docker

   #### Verify `dockerd-rootless-setuptool.sh`
   Check if `dockerd-rootless-setuptool.sh` is present in `/usr/bin`:

   ```bash
   ls /usr/bin/ | grep dockerd-rootless-setuptool.sh
   ```

   > **Note:** If the script is not present, ensure that the `docker-ce-rootless-extras` package was installed correctly.

   #### Set Up Rootless Docker
   Run the installation command as a non-root user:

   ```bash
   /usr/bin/dockerd-rootless-setuptool.sh install
   ```

5. ### Verify Docker is Running Rootless
   Run the following to confirm Docker is operating in rootless mode:

   ```bash
   docker ps
   ```

---

### Additional Commands for Downloading Packages

- Download Docker rootless extras package:
  ```bash
  sudo dnf install -y --download-only docker-ce-rootless-extras
  ```

- Download `uidmap` package:
  ```bash
  sudo dnf install -y --download-only uidmap
  ```

- Download `slirp4netns` package:
  ```bash
  sudo apt install -y --download-only slirp4netns
  ```

- Download `libslirp0` package:
  ```bash
  sudo apt install -y --download-only libslirp0
  ```

The downloaded packages will be saved in the `/var/cache/apt/archives` directory.

---

## Transfer Packages to Target Machine Using `scp`

```bash
scp /var/cache/apt/archives/docker-ce-rootless-extras_5%3a27.0.3-1~ubuntu.20.04~focal_amd64.deb manish@172.20.23.147:~/
scp /var/cache/apt/archives/uidmap_1%3a4.8.1-1ubuntu5.20.04.5_amd64.deb manish@172.20.23.147:~/
scp /var/cache/apt/archives/slirp4netns_0.4.3-1_amd64.deb manish@172.20.23.147:~/
scp /var/cache/apt/archives/libslirp0_4.1.0-2ubuntu2.2_amd64.deb manish@172.20.23.147:~/
```

---

## Machine Without Internet Access (Target Machine)

1. ### Install Transferred Packages

   On the target machine, navigate to the directory where the packages were transferred and install them using `dpkg`:

   ```bash
   sudo dpkg -i docker-ce-rootless-extras_5%3a27.0.3-1~ubuntu.20.04~focal_amd64.deb
   sudo dpkg -i uidmap_1%3a4.8.1-1ubuntu5.20.04.5_amd64.deb
   sudo dpkg -i slirp4netns_0.4.3-1_amd64.deb
   sudo dpkg -i libslirp0_4.1.0-2ubuntu2.2_amd64.deb
   ```

--- 
