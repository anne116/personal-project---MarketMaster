# Use an official python runtime as a parent image
FROM python:3.9-slim

# Set a working directory in the container
WORKDIR /app

# Copy the requirement.txt before other files and install dependencies
COPY requirement.txt .

# Install any needed packages specified in requirement.txt
RUN pip install --no-cache-dir -r requirement.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Command to run when the container starts 
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
