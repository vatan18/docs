# This Dockerfile is created during project handson for Impressico Devops Team - March-2024
# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# install required packages for system
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy the application code into the container
COPY . .

# Install app dependencies
# RUN pip install mysqlclient
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000
EXPOSE 5000

# Specify the command to run your application
CMD ["python", "app.py"]
