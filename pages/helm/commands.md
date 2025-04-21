# Helm Commands and Usage

#### 1. **Install a Release**
```bash
helm install <release-name> <chart> [flags]
```
- **Example**:
  ```bash
  helm install manishboard-release manishboard
  ```
- **Description**: Installs a Helm chart as a release. The release is named `manishboard-release`, and the chart is `manishboard`.

#### 2. **Uninstall a Release**
```bash
helm uninstall <release-name> [flags]
```
- **Example**:
  ```bash
  helm uninstall manishboard-release
  ```
- **Description**: Uninstalls a Helm release. In this case, it removes the `manishboard-release`.

#### 3. **Upgrade a Release**
```bash
helm upgrade <release-name> <chart> [flags]
```
- **Example**:
  ```bash
  helm upgrade manishboard-release manishboard
  ```
- **Description**: Upgrades an existing release. If the release does not exist, it installs it.

#### 4. **Upgrade or Install a Release**
```bash
helm upgrade --install <release-name> <chart> [flags]
```
- **Example**:
  ```bash
  helm upgrade --install manishboard-release manishboard
  ```
- **Description**: This command is useful when you want to upgrade a release if it exists or install it if it doesn't. It’s a combination of `helm upgrade` and `helm install`.

#### 5. **List Releases**
```bash
helm list [flags]
```
- **Example**:
  ```bash
  helm list
  helm list -n manishboard-ns
  ```
- **Description**: Lists all installed releases in the current namespace or specific namespace (`manishboard-ns` in the example).

#### 6. **Add a Helm Repository**
```bash
helm repo add <repo-name> <repo-url>
```
- **Example**:
  ```bash
  helm repo add traefik https://traefik.github.io/charts
  ```
- **Description**: Adds a new Helm chart repository, such as the Traefik charts repository.

#### 7. **Update Helm Repositories**
```bash
helm repo update
```
- **Example**:
  ```bash
  helm repo update
  ```
- **Description**: Updates the Helm repositories to the latest versions of the charts.

#### 8. **Install a Release from a Specific Repository**
```bash
helm install <release-name> <repo>/<chart> [flags]
```
- **Example**:
  ```bash
  helm install manishboard-rls manishboard-helm/manishboard
  ```
- **Description**: Installs a chart from a specific Helm repository. In this case, it installs `manishboard` from the `manishboard-helm` repository.

#### 9. **Search for a Chart in a Repository**
```bash
helm search repo <chart-name>
```
- **Example**:
  ```bash
  helm search repo --versions
  helm search repo --versions | grep manishboard
  ```
- **Description**: Searches for a chart in the Helm repository, optionally filtering by versions.

#### 10. **Install with Custom Values**
```bash
helm install <release-name> <chart> --set <key>=<value> [flags]
```
- **Example**:
  ```bash
  helm install manishboard-rls manishboard-helm/manishboard -n manishboard-ns --set deployment.backend.imageTag=8fcb21dade40a55feeeedcf70585d9ba8ad62980
  ```
- **Description**: Installs a chart with custom values passed as key-value pairs. In this case, it sets a custom `imageTag` for the backend deployment.

#### 11. **Uninstall with Namespace**
```bash
helm uninstall <release-name> -n <namespace>
```
- **Example**:
  ```bash
  helm uninstall manishboard-rls -n manishboard-ns
  ```
- **Description**: Uninstalls a release from a specific namespace (`manishboard-ns`).

#### 12. **Install with Namespace**
```bash
helm install <release-name> <chart> -n <namespace>
```
- **Example**:
  ```bash
  helm install manishboard-rls manishboard-helm/manishboard -n manishboard-ns
  ```
- **Description**: Installs a Helm release into a specific namespace (`manishboard-ns`).

#### 13. **List All Repositories**
```bash
helm repo list
```
- **Example**:
  ```bash
  helm repo list
  ```
- **Description**: Lists all Helm repositories that have been added.

#### 14. **Upgrade a Release with Namespace and Custom Values**
```bash
helm upgrade <release-name> <chart> -n <namespace> --set <key>=<value>
```
- **Example**:
  ```bash
  helm upgrade manishboard-rls manishboard-helm/manishboard -n manishboard-ns --set deployment.backend.imageTag=8fcb21dade40a55feeeedcf70585d9ba8ad62980
  ```
- **Description**: Upgrades a release with a custom value passed and specifies a namespace.


#### 15. **Download a Helm Chart**
```bash
helm pull <repo>/<chart> [--version <chart-version>] [--untar]
```
- **Example**:
  ```bash
  helm pull stable/nginx-ingress --untar
  ```
- **Description**: Downloads the specified Helm chart. The `--untar` flag extracts the chart after downloading.

#### 16. **Get the Entire `values.yaml` File of a Chart**
```bash
helm show values <repo>/<chart>
```
- **Example**:
  ```bash
  helm show values stable/nginx-ingress
  ```
- **Description**: Retrieves the full `values.yaml` file for the given chart.

#### 17. **Install or Upgrade a Release Using a Custom `values.yaml` File**
```bash
helm install <release-name> <chart> -f <custom-values.yaml>
helm upgrade <release-name> <chart> -f <custom-values.yaml>
```
- **Example**:
  ```bash
  helm install manishboard-rls manishboard-helm/manishboard -f custom-values.yaml
  helm upgrade manishboard-rls manishboard-helm/manishboard -f custom-values.yaml
  ```
- **Description**: Installs or upgrades a Helm release using a custom `values.yaml` file instead of passing key-value pairs individually.
