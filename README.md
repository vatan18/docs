# DevOps Documentation & Notes

Welcome to my collection of notes and documentation related to my work and learning in the DevOps field. This repository contains resources, tutorials, and insights on various tools, technologies, and best practices I have encountered during my DevOps journey.

The topics covered include but are not limited to the following:

- **AWS**
- **Docker**
- **Git**
- **Kubernetes**
- **Linux (Ubuntu)**
- **Nginx**
- **Node.js**
- **PostgreSQL**
- **Python**
- **Terraform**

---

## Local Development

To get started with the project locally, follow the steps below:

### Install Dependencies

First, install the necessary dependencies using [PNPM](https://pnpm.io/installation).

If you haven't installed PNPM, follow these steps:

#### For Ubuntu:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```
Alternatively, you can also use:
```bash
wget -qO- https://get.pnpm.io/install.sh | sh -
```

Once PNPM is installed, navigate to the project directory and run the following command to install the dependencies:

```bash
pnpm install
```

### Available Scripts

Once dependencies are installed, you can use the following `pnpm` commands to manage the project:

- **Start the Development Server**  
  Run this command to start the development server:
  ```bash
  pnpm dev
  ```

- **Build the Project**  
  Use this command to build the project for production:
  ```bash
  pnpm build
  ```

- **Start the Production Server**  
  To run the application in production mode, use:
  ```bash
  pnpm start
  ```

- **Export Static Site**  
  If you need to export the site as a static version, use:
  ```bash
  pnpm export
  ```

The development server will be available at `http://localhost:3000`.

---

## Reference

- [Github Template](https://github.com/shuding/nextra-docs-template)  
This is the template used for this documentation site.

---

## License

This project is licensed under the MIT License.

---

## Additional Resources

For further learning, you can explore additional resources and documentation related to DevOps best practices, CI/CD pipelines, security, and automation.