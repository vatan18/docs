# Using pipenv and Python

- `pipenv shell`: Initiates a new shell within the virtual environment managed by pipenv. This ensures that subsequent commands are executed within this environment.

- `pipenv install requests`: Adds the `requests` package to the project's dependencies specified in the Pipfile. This command also updates the Pipfile.lock file to reflect the changes.

- `pipenv uninstall requests`: Removes the `requests` package from the project's dependencies listed in the Pipfile. Similar to `pipenv install`, this command updates the Pipfile.lock accordingly.

- `pipenv install`: Syncs the project's dependencies specified in the Pipfile with the current environment. If there are any newer packages listed in the Pipfile that are not currently installed, they will be installed, and Pipfile.lock will be updated.

- `pipenv uninstall --all`: Removes all packages from the current environment that are not listed in the Pipfile. This command helps to ensure that the environment is in sync with the dependencies specified in the project.

- `pipenv lock`: Generates a lock file named Pipfile.lock based on the current state of the environment and the dependencies listed in the Pipfile. This lock file ensures deterministic builds by pinning the exact versions of all dependencies.

- `pipenv requirements`: Generates a requirements.txt file containing the project's dependencies and their respective versions. This file is commonly used in environments where pipenv is not used, such as production servers.

- `pipenv run python main.py`: Executes the Python script `main.py` within the virtual environment managed by pipenv. This ensures that the script runs with the correct dependencies and environment settings specified in the Pipfile.

- `pipenv run pip install -r <(pipenv requirements) --target ./`: Installs the dependencies listed in the project's Pipfile file into the pipenv environment.

### Note on `pipenv lock -r`

It has been observed that the command `pipenv lock -r` may not work as expected in some environments. This issue is documented and discussed in various forums. For more information and potential workarounds, you can refer to the following articles:
- [pipenv lock -r no longer works #5253](https://github.com/pypa/pipenv/issues/5253)
- [pipenv requirements sub-command based on Pipfile #6130](https://github.com/pypa/pipenv/issues/6130)

It is recommended to use `pipenv requirements` or other alternatives until this issue is resolved.
