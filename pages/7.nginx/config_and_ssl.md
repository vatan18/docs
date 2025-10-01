# Nginx Configuration and SSL Setup

## Description
This documentation covers the process of setting up Nginx redirects, configuring SSL certificates, and securing your Nginx server for better performance and security.


### 1. **Installing & Configuring Your SSL Certificate**

### Generating CSR and Ordering Your Certificate

If you still need to create a certificate signing request (CSR) and order your SSL certificate, refer to the guide for **Nginx: Creating Your CSR with OpenSSL**. After your SSL certificate is validated and issued, follow the steps below to install and configure it on your Nginx server.

### Installing and Configuring SSL

### a. **Primary and Intermediate Certificates**

Once your certificate is issued, you should receive a file named `your_domain_name.pem` from DigiCert. This `.pem` file contains both the primary certificate and the intermediate certificate.

If you already have the `.pem` file, proceed to Step 4. If not, you may need to concatenate the primary certificate and intermediate certificate manually.

### b. **Copy the Certificate Files to Your Server**

1. Log in to your DigiCert account and download both:
    - The intermediate certificate (`DigiCertCA.crt`)
    - Your primary certificate (`your_domain_name.crt`)
2. Copy these files along with the `.key` file you generated when creating the CSR to your server. Store them in a secure directory with read permissions for `root` only.

### c. **Concatenate the Primary and Intermediate Certificates**

If you need to combine the primary and intermediate certificates into a single `.pem` file, use the following command:

```bash
cat your_domain_name.crt DigiCertCA.crt >> bundle.crt

```

### d. **Edit the Nginx Virtual Hosts File**

1. Open the Nginx virtual host file for the website you're securing.
2. Copy the existing non-secure `server` block and paste it below the original block (if you want your site to support both HTTP and HTTPS).
3. Update the secure server block by adding the following:

```
server {
    listen 443 ssl;
    server_name your.domain.com;

    ssl_certificate /etc/ssl/your_domain_name.pem; # or bundle.crt
    ssl_certificate_key /etc/ssl/your_domain_name.key;

    access_log /var/log/nginx/nginx.vhost.access.log;
    error_log /var/log/nginx/nginx.vhost.error.log;

    location / {
        root /home/www/public_html/your.domain.com/public/;
        index index.html;
    }
}

```

- `ssl_certificate`: The combined certificate file, typically `your_domain_name.pem` or `bundle.crt`.
- `ssl_certificate_key`: The `.key` file generated when creating the CSR.

### e. **Restart Nginx**

Once the SSL configuration is complete, restart Nginx to apply the changes:

```bash
sudo systemctl restart nginx

```

---

### 2. **Page Redirects in Nginx**

Nginx allows for simple and effective URL redirection using its `rewrite` module. Below are various examples of redirect configurations you can use.

### a. **Redirecting One Domain to Another**

To permanently redirect traffic from one domain (e.g., `devisers.in`) to another domain (e.g., `devisers.com`):

```
server {
    listen 80;
    listen 443 ssl;
    server_name devisers.in www.devisers.in;
    return 301 $scheme://www.devisers.com$request_uri;
}

```

- **Explanation**: A `301` permanent redirect is used to send traffic from `devisers.in` and `www.devisers.in` to `www.devisers.com`.

### b. **Redirecting HTTP to HTTPS**

To ensure all traffic on HTTP (port 80) is redirected to HTTPS:

```
server {
    listen 80;
    server_name www.domain.tld;
    return 301 https://www.domain.tld$request_uri;
}

```

- **Explanation**: This forces all HTTP traffic to be redirected to the HTTPS version of your website.

### c. **Redirecting a Specific Domain from HTTP to HTTPS**

To redirect only a specific domain (e.g., `devisers.in`) from HTTP to HTTPS:

```
server {
    listen 80;
    server_name devisers.in;
    return 301 https://devisers.in$request_uri;
}

```

- **Explanation**: This targets a specific domain and forces the redirection to HTTPS.

### d. **Redirecting from `www` to Non-`www`**

To redirect all traffic from `www.devisers.in` to the non-`www` version (`devisers.in`):

```
server {
    listen 80;
    listen 443 ssl;
    server_name www.devisers.in;
    return 301 $scheme://devisers.in$request_uri;
}

```

- **Explanation**: A permanent redirect is used to move traffic from the `www` version to the non-`www` version.

### e. **Redirecting from Non-`www` to `www`**

To redirect traffic from `devisers.in` to `www.devisers.in`:

```
server {
    listen 80;
    listen 443 ssl;
    server_name devisers.in;
    return 301 $scheme://www.devisers.in$request_uri;
}

```

- **Explanation**: A permanent redirect to ensure visitors access the `www` version of the website.

---

### 3. **Restarting Nginx to Apply Changes**

After making changes to your Nginx configuration file (e.g., for redirects or SSL), restart Nginx:

```bash
sudo systemctl restart nginx

```

---

### Summary of Key Nginx Redirect and SSL Features:

| Configuration Type | Description | Example Configuration |
| --- | --- | --- |
| SSL Certificate Installation | Set up SSL with your certificate and key | `ssl_certificate` and `ssl_certificate_key` |
| Redirect domain to another domain | Redirect `devisers.in` to `devisers.com` | `return 301 $scheme://www.devisers.com$request_uri;` |
| HTTP to HTTPS redirect | Redirect HTTP to HTTPS for `domain.tld` | `return 301 https://www.domain.tld$request_uri;` |
| Redirect specific domain HTTP to HTTPS | Redirect only `devisers.in` from HTTP to HTTPS | `return 301 https://devisers.in$request_uri;` |
| Redirect `www` to non-`www` | Redirect `www.devisers.in` to `devisers.in` | `return 301 $scheme://devisers.in$request_uri;` |
| Redirect non-`www` to `www` | Redirect `devisers.in` to `www.devisers.in` | `return 301 $scheme://www.devisers.in$request_uri;` |

## Reference:

- https://phoenixnap.com/kb/nginx-reverse-proxy
- https://www.hostinger.in/tutorials/nginx-redirect/
- https://www.digicert.com/kb/csr-ssl-installation/nginx-openssl.htm
- Kamaljeet: https://git.impressicocrm.com/devOps/sandbox/-/tree/release/14.1.0.0/project/flask-mysql-application